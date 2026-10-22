import { create } from 'zustand';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Singleton audio context for realistic ringtones with no external assets needed
let toneAudioCtx = null;
let toneInterval = null;

const stopTones = () => {
  if (toneInterval) {
    clearInterval(toneInterval);
    toneInterval = null;
  }
  if (toneAudioCtx && toneAudioCtx.state !== 'closed') {
    try {
      toneAudioCtx.close();
    } catch {
      // ignore
    }
    toneAudioCtx = null;
  }
};

const playToneBurst = (freq1, freq2, durationMs) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!toneAudioCtx || toneAudioCtx.state === 'closed') {
      toneAudioCtx = new AudioContextClass();
    }

    const osc1 = toneAudioCtx.createOscillator();
    const osc2 = toneAudioCtx.createOscillator();
    const gain = toneAudioCtx.createGain();

    osc1.frequency.value = freq1;
    osc2.frequency.value = freq2;

    gain.gain.setValueAtTime(0.08, toneAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, toneAudioCtx.currentTime + durationMs / 1000);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(toneAudioCtx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(toneAudioCtx.currentTime + durationMs / 1000);
    osc2.stop(toneAudioCtx.currentTime + durationMs / 1000);
  } catch {
    // ignore
  }
};

const startOutgoingTone = () => {
  stopTones();
  playToneBurst(440, 480, 1800);
  toneInterval = setInterval(() => {
    playToneBurst(440, 480, 1800);
  }, 4000);
};

const startIncomingTone = () => {
  stopTones();
  playToneBurst(587.33, 880, 800);
  setTimeout(() => playToneBurst(659.25, 987.77, 800), 200);
  toneInterval = setInterval(() => {
    playToneBurst(587.33, 880, 800);
    setTimeout(() => playToneBurst(659.25, 987.77, 800), 200);
  }, 3000);
};

// Peer connection reference
let peerConnection = null;
let durationInterval = null;

export const useCallStore = create((set, get) => ({
  callStatus: 'idle', // 'idle' | 'outgoing' | 'incoming' | 'connected'
  callType: 'audio',  // 'audio' | 'video'
  activeCall: null,   // { callId, conversationId, otherUser, isCaller, offer, callType }
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  callDuration: 0,    // seconds

  startCall: async (conversationId, recipientUser, callType = 'audio') => {
    if (!recipientUser) {
      toast.error('Recipient information missing');
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      toast.error('Not connected to messaging server');
      return;
    }

    const isVideo = callType === 'video';

    try {
      // 1. Get user media (microphone and optional camera for video call)
      const mediaConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // 2. Initialize RTCPeerConnection
      peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote audio/video stream
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            targetUserId: recipientUser._id || recipientUser.id,
            candidate: event.candidate,
            callId: get().activeCall?.callId,
          });
        }
      };

      // 3. Create Offer SDP
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const targetId = String(recipientUser._id || recipientUser.id);
      const callId = `call_${Date.now()}`;

      set({
        callStatus: 'outgoing',
        callType,
        activeCall: {
          callId,
          conversationId,
          otherUser: recipientUser,
          isCaller: true,
          callType,
        },
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
        callDuration: 0,
      });

      startOutgoingTone();

      // 4. Send call:start signaling via socket
      socket.emit('call:start', {
        conversationId,
        recipientId: targetId,
        offer,
        callType,
      });
    } catch (err) {
      console.error(`Failed to start ${callType} call:`, err);
      stopTones();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error(
          isVideo
            ? 'Camera/microphone permission denied. Please allow access.'
            : 'Microphone permission denied. Please allow access.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error(
          isVideo
            ? 'Camera or microphone not found on this device.'
            : 'Microphone not found on this device.'
        );
      } else {
        toast.error(`Could not initiate ${callType} call`);
      }
      get().cleanup();
    }
  },

  handleIncomingCall: ({ callId, conversationId, caller, offer, callType = 'audio' }) => {
    // If already in a call, reject as busy
    if (get().callStatus !== 'idle') {
      const socket = getSocket();
      if (socket) {
        socket.emit('call:reject', {
          callId,
          callerId: caller?._id,
          reason: 'busy',
        });
      }
      return;
    }

    const effectiveCallType = callType || 'audio';

    set({
      callStatus: 'incoming',
      callType: effectiveCallType,
      activeCall: {
        callId,
        conversationId,
        otherUser: caller,
        isCaller: false,
        offer,
        callType: effectiveCallType,
      },
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });

    startIncomingTone();
  },

  acceptCall: async () => {
    const { activeCall } = get();
    if (!activeCall || !activeCall.offer) return;

    stopTones();

    const socket = getSocket();
    if (!socket) return;

    const isVideo = activeCall.callType === 'video';

    try {
      // 1. Get media stream (audio + video if video call)
      const mediaConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // 2. Initialize RTCPeerConnection
      peerConnection = new RTCPeerConnection(RTC_CONFIG);

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call:ice-candidate', {
            targetUserId: activeCall.otherUser?._id || activeCall.otherUser?.id,
            candidate: event.candidate,
            callId: activeCall.callId,
          });
        }
      };

      // 3. Set remote description from caller's offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(activeCall.offer));

      // 4. Create and set local answer SDP
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      set({
        callStatus: 'connected',
        callType: activeCall.callType || 'audio',
        localStream: stream,
      });

      // 5. Emit call:accept to caller
      socket.emit('call:accept', {
        callId: activeCall.callId,
        callerId: activeCall.otherUser?._id || activeCall.otherUser?.id,
        answer,
      });

      // Start duration counter
      get().startDurationTimer();
    } catch (err) {
      console.error('Failed to accept call:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Permission denied. Please allow microphone/camera access to accept.');
      } else {
        toast.error('Failed to connect call');
      }
      get().rejectCall('error');
    }
  },

  handleCallAccepted: async ({ answer }) => {
    stopTones();
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      set({ callStatus: 'connected' });
      get().startDurationTimer();
    } catch (err) {
      console.error('Error applying call answer:', err);
      get().endCall();
    }
  },

  handleIceCandidate: async ({ candidate }) => {
    if (!peerConnection || !candidate) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  },

  rejectCall: (reason = 'declined') => {
    stopTones();
    const { activeCall } = get();
    const socket = getSocket();

    if (socket && activeCall) {
      socket.emit('call:reject', {
        callId: activeCall.callId,
        callerId: activeCall.otherUser?._id || activeCall.otherUser?.id,
        reason,
      });
    }

    get().cleanup();
  },

  handleCallRejected: ({ reason }) => {
    stopTones();
    const message = reason === 'busy' ? 'User is on another call' : 'Call declined';
    toast(message, { icon: '📞' });
    get().cleanup();
  },

  endCall: () => {
    stopTones();
    const { activeCall } = get();
    const socket = getSocket();

    if (socket && activeCall) {
      socket.emit('call:end', {
        callId: activeCall.callId,
        targetUserId: activeCall.otherUser?._id || activeCall.otherUser?.id,
      });
    }

    get().cleanup();
  },

  handleCallEnded: () => {
    stopTones();
    toast('Call ended', { icon: '📞' });
    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff, callType } = get();
    if (callType !== 'video') return;

    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = isVideoOff;
        });
        set({ isVideoOff: !isVideoOff });
      } else {
        toast('No active video track to toggle');
      }
    }
  },

  startDurationTimer: () => {
    if (durationInterval) clearInterval(durationInterval);
    set({ callDuration: 0 });
    durationInterval = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
  },

  cleanup: () => {
    stopTones();
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      try {
        peerConnection.close();
      } catch {
        // ignore
      }
      peerConnection = null;
    }

    const { localStream } = get();
    if (localStream) {
      try {
        localStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
    }

    set({
      callStatus: 'idle',
      callType: 'audio',
      activeCall: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });
  },
}));

export default useCallStore;
