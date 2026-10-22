'use client';

import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '@/stores/useCallStore';
import Avatar from '@/components/ui/Avatar';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';

export default function VoiceCallModal() {
  const {
    callStatus,
    callType,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipMirrored, setIsPipMirrored] = useState(true);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Bind remote stream to video & audio elements
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => {
          console.warn('Remote video playback note:', err);
        });
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn('Remote audio playback note:', err);
        });
      }
    }
  }, [remoteStream, callStatus, callType]);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => {
        console.warn('Local video playback note:', err);
      });
    }
  }, [localStream, callStatus, callType, isVideoOff]);

  if (callStatus === 'idle' || !activeCall) {
    return null;
  }

  const otherUser = activeCall.otherUser || {};
  const displayName = otherUser.name || otherUser.username || 'User';
  const isVideoCall = callType === 'video';

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasRemoteVideo =
    isVideoCall &&
    remoteStream &&
    remoteStream.getVideoTracks().length > 0 &&
    remoteStream.getVideoTracks().some((t) => t.enabled);

  // ==========================================
  // 1. VIDEO CALL INTERFACE (CONNECTED / OUTGOING / INCOMING)
  // ==========================================
  if (isVideoCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
        {/* Hidden audio element for WebRTC audio playback */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div
          className={`relative w-full bg-zinc-950 border border-zinc-800 shadow-2xl text-white overflow-hidden flex flex-col justify-between transition-all duration-300 ${
            isFullscreen
              ? 'fixed inset-0 rounded-0 h-screen max-w-none border-0'
              : 'max-w-4xl h-[88vh] max-h-[720px] rounded-3xl'
          }`}
        >
          {/* Ambient emerald subtle glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* MAIN VIDEO AREA */}
          <div className="relative flex-1 w-full h-full bg-zinc-900 flex items-center justify-center overflow-hidden">
            {callStatus === 'connected' ? (
              <>
                {/* Remote video stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    hasRemoteVideo ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                />

                {/* Remote Video Off / Fallback Avatar */}
                {!hasRemoteVideo && (
                  <div className="flex flex-col items-center justify-center p-8 z-10 text-center animate-fade-in">
                    <div className="relative mb-4">
                      <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse" />
                      <Avatar
                        src={otherUser.avatar}
                        name={displayName}
                        size="2xl"
                        className="relative shadow-2xl ring-4 ring-emerald-500/40"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{displayName}</h3>
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      <VideoOff className="w-4 h-4 text-amber-400" />
                      Camera is paused or connecting...
                    </p>
                  </div>
                )}

                {/* Local PiP (Picture-in-Picture) Preview */}
                <div
                  className={`absolute bottom-24 right-4 sm:right-6 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 bg-zinc-900 z-30 transition-all duration-200 group ${
                    isPipMirrored ? 'scale-x-[-1]' : ''
                  }`}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                  />
                  {isVideoOff && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-400 text-xs gap-1.5 p-2 text-center select-none scale-x-[-1]">
                      <VideoOff className="w-6 h-6 text-zinc-400" />
                      <span>Camera Off</span>
                    </div>
                  )}
                  {/* PiP Mirror Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsPipMirrored(!isPipMirrored)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Flip Preview"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : callStatus === 'outgoing' ? (
              /* OUTGOING VIDEO CALL STATE */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                {/* Local camera preview background */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover opacity-30 blur-xs ${
                    isPipMirrored ? 'scale-x-[-1]' : ''
                  }`}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
                    <span className="absolute -inset-2 rounded-full bg-emerald-500/40 animate-pulse" />
                    <Avatar
                      src={otherUser.avatar}
                      name={displayName}
                      size="2xl"
                      className="relative shadow-2xl ring-4 ring-emerald-500/60"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{displayName}</h3>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                    <Video className="w-3.5 h-3.5 animate-pulse" />
                    Outgoing Video Call...
                  </div>
                  <p className="text-xs text-zinc-400">Waiting for {displayName} to answer...</p>
                </div>
              </div>
            ) : (
              /* INCOMING VIDEO CALL STATE */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <span className="absolute -inset-6 rounded-full bg-emerald-500/20 animate-ping" />
                    <span className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-pulse" />
                    <Avatar
                      src={otherUser.avatar}
                      name={displayName}
                      size="2xl"
                      className="relative shadow-2xl ring-4 ring-emerald-500/50"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{displayName}</h3>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 animate-bounce">
                    <Video className="w-4 h-4 text-emerald-400" />
                    Incoming Video Call
                  </div>
                  <p className="text-xs text-zinc-400 mb-8">@{otherUser.username || 'user'}</p>
                </div>
              </div>
            )}

            {/* TOP BAR OVERLAY */}
            <div className="absolute top-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 pointer-events-auto">
              <div className="flex items-center gap-3">
                <Avatar src={otherUser.avatar} name={displayName} size="sm" />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{displayName}</h4>
                  <div className="flex items-center gap-2">
                    {callStatus === 'connected' ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        {formatDuration(callDuration)}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 capitalize">{callStatus}...</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 uppercase font-semibold">
                      HD Video
                    </span>
                  </div>
                </div>
              </div>

              {/* Fullscreen toggle button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* BOTTOM CONTROLS OVERLAY */}
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center z-40 pointer-events-auto">
              {callStatus === 'incoming' ? (
                /* INCOMING ACTIONS */
                <div className="flex items-center gap-10">
                  {/* Decline */}
                  <button
                    type="button"
                    onClick={() => rejectCall('declined')}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl shadow-red-600/30 group-hover:scale-105 transition-all">
                      <PhoneOff className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-zinc-300 font-medium">Decline</span>
                  </button>

                  {/* Accept Video Call */}
                  <button
                    type="button"
                    onClick={acceptCall}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-xl shadow-emerald-600/40 group-hover:scale-110 transition-all animate-bounce">
                      <Video className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">Join Video</span>
                  </button>
                </div>
              ) : callStatus === 'outgoing' ? (
                /* OUTGOING ACTIONS */
                <button
                  type="button"
                  onClick={endCall}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl shadow-red-600/30 group-hover:scale-105 transition-all">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-zinc-300 font-medium">Cancel</span>
                </button>
              ) : (
                /* CONNECTED CONTROLS BAR */
                <div className="flex items-center gap-4 sm:gap-6 bg-zinc-900/90 backdrop-blur-md px-6 py-3.5 rounded-full border border-zinc-700/80 shadow-2xl">
                  {/* Mute Mic */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-3.5 rounded-full transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                    title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Toggle Camera */}
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`p-3.5 rounded-full transition-all cursor-pointer ${
                      isVideoOff
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    }`}
                    title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={endCall}
                    className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl shadow-red-600/40 hover:scale-105 transition-all cursor-pointer ml-2"
                    title="End Video Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. AUDIO CALL INTERFACE
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      {/* Audio element for WebRTC audio track */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl text-white overflow-hidden animate-scale-in">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* 1. INCOMING AUDIO CALL */}
        {callStatus === 'incoming' && (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <span className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-ping" />
              <span className="absolute -inset-6 rounded-full bg-emerald-500/10 animate-pulse" />
              <Avatar
                src={otherUser.avatar}
                name={displayName}
                size="2xl"
                className="relative shadow-xl ring-4 ring-emerald-500/40"
              />
            </div>

            <h3 className="text-xl font-bold text-white mb-1 truncate max-w-full">
              {displayName}
            </h3>
            <p className="text-xs text-emerald-400 font-medium mb-1">
              Incoming NexChat Voice Call...
            </p>
            <p className="text-[11px] text-zinc-500 mb-8">@{otherUser.username || 'user'}</p>

            {/* Actions: Accept & Decline */}
            <div className="flex items-center justify-center gap-8 w-full pt-2">
              <button
                type="button"
                onClick={() => rejectCall('declined')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-all">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-xs text-zinc-400 group-hover:text-red-400 transition-colors">
                  Decline
                </span>
              </button>

              <button
                type="button"
                onClick={acceptCall}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-all animate-bounce">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  Accept
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. OUTGOING AUDIO CALL */}
        {callStatus === 'outgoing' && (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse" />
              <Avatar
                src={otherUser.avatar}
                name={displayName}
                size="2xl"
                className="relative shadow-xl ring-4 ring-emerald-500/50"
              />
            </div>

            <h3 className="text-xl font-bold text-white mb-1 truncate max-w-full">
              {displayName}
            </h3>
            <p className="text-xs text-emerald-400 font-medium mb-1 animate-pulse">
              Calling...
            </p>
            <p className="text-[11px] text-zinc-500 mb-8">Waiting for answer...</p>

            <button
              type="button"
              onClick={endCall}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:scale-105 transition-all">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs text-zinc-400 group-hover:text-red-400 transition-colors">
                Cancel
              </span>
            </button>
          </div>
        )}

        {/* 3. CONNECTED AUDIO CALL */}
        {callStatus === 'connected' && (
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <span className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
              <Avatar
                src={otherUser.avatar}
                name={displayName}
                size="2xl"
                className="relative shadow-xl ring-4 ring-emerald-500/40"
              />
            </div>

            <h3 className="text-xl font-bold text-white mb-1 truncate max-w-full">
              {displayName}
            </h3>

            {/* Duration Counter */}
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/80 rounded-full border border-zinc-700/60 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatDuration(callDuration)}
              </span>
            </div>

            {/* Sound wave visualizer animation */}
            <div className="flex items-center gap-1.5 h-6 mb-8">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 0.3, 0.8, 0.5].map((scale, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 0.15}s`, height: `${scale * 100}%` }}
                  className="w-1 bg-emerald-500 rounded-full animate-pulse min-h-[4px]"
                />
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-6 w-full">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                type="button"
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 hover:scale-105 transition-all cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
