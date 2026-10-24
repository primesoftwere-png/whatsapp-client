'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useStatusStore } from '@/stores/useStatusStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Avatar from '@/components/ui/Avatar';
import { getMediaUrl, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const IMAGE_DURATION_MS = 5000;

export default function StoryViewer() {
  const {
    activeStoryGroup,
    activeStoryIndex,
    isViewerOpen,
    closeViewer,
    setActiveIndex,
    deleteStatus,
    toggleLike,
  } = useStatusStore();
  const { user: currentUser } = useAuthStore();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);

  const statuses = activeStoryGroup?.statuses || [];
  const currentStatus = statuses[activeStoryIndex];
  const isOwner =
    currentUser &&
    currentStatus &&
    (currentStatus.user?._id === currentUser._id ||
      currentStatus.user === currentUser._id);

  const isLikedByMe =
    currentUser &&
    currentStatus &&
    Array.isArray(currentStatus.likes) &&
    currentStatus.likes.some(
      (l) => (l._id || l).toString() === currentUser._id.toString()
    );

  const likesCount = Array.isArray(currentStatus?.likes)
    ? currentStatus.likes.length
    : 0;

  // Next / Previous helpers
  const handleNext = useCallback(() => {
    if (activeStoryIndex < statuses.length - 1) {
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      setActiveIndex(activeStoryIndex + 1);
    } else {
      closeViewer();
    }
  }, [activeStoryIndex, statuses.length, setActiveIndex, closeViewer]);

  const handlePrev = useCallback(() => {
    if (activeStoryIndex > 0) {
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      setActiveIndex(activeStoryIndex - 1);
    } else {
      // Replay current from start
      setProgress(0);
      elapsedBeforePauseRef.current = 0;
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [activeStoryIndex, setActiveIndex]);

  // Handle timer for image status
  useEffect(() => {
    if (!isViewerOpen || !currentStatus) return;

    if (currentStatus.type === 'video') {
      // Video manages its own progress via timeupdate
      return;
    }

    if (isPaused) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      return;
    }

    startTimeRef.current = performance.now() - elapsedBeforePauseRef.current;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      elapsedBeforePauseRef.current = elapsed;
      const pct = Math.min((elapsed / IMAGE_DURATION_MS) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        handleNext();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isViewerOpen, currentStatus, isPaused, activeStoryIndex, handleNext]);

  // Video timeupdate handler
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeViewer();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, handleNext, handlePrev, closeViewer]);

  if (!isViewerOpen || !currentStatus) return null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this status update?')) {
      return;
    }
    await deleteStatus(currentStatus._id);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(currentStatus._id);
  };

  const author = currentStatus.user || activeStoryGroup.user || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Central Story Box */}
      <div className="relative w-full max-w-md h-full md:max-h-[92vh] md:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl">
        {/* Top Progress Bars */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-1.5 w-full mb-3">
            {statuses.map((s, idx) => {
              let fillPct = 0;
              if (idx < activeStoryIndex) fillPct = 100;
              else if (idx === activeStoryIndex) fillPct = progress;
              return (
                <div
                  key={s._id || idx}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Header & Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={author.avatar}
                name={author.name || author.username}
                size="sm"
                className="ring-2 ring-emerald-400"
              />
              <div>
                <h4 className="text-sm font-bold leading-tight">
                  {author.name || author.username}
                </h4>
                <p className="text-[11px] text-zinc-300">
                  {formatTime(currentStatus.createdAt)}
                  <span className="mx-1.5 opacity-60">•</span>
                  {activeStoryIndex + 1} of {statuses.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-300">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => {
                    const next = !prev;
                    if (videoRef.current) {
                      if (next) videoRef.current.pause();
                      else videoRef.current.play().catch(() => {});
                    }
                    return next;
                  });
                }}
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* Mute toggle for video */}
              {currentStatus.type === 'video' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}

              {/* Delete button (Owner only) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 rounded-full hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                  title="Delete this status update"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {/* Close viewer */}
              <button
                type="button"
                onClick={closeViewer}
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Container with Left/Right Click Nav */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
          {currentStatus.type === 'video' ? (
            <video
              ref={videoRef}
              src={getMediaUrl(currentStatus.mediaUrl)}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleNext}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={getMediaUrl(currentStatus.mediaUrl)}
              alt={currentStatus.caption || 'Status Photo'}
              className="w-full h-full object-contain"
            />
          )}

          {/* Left Click Area for Prev */}
          <div
            onClick={handlePrev}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            title="Previous"
          />

          {/* Right Click Area for Next */}
          <div
            onClick={handleNext}
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            title="Next"
          />
        </div>

        {/* Bottom Bar: Caption & Like Option */}
        <div className="relative z-30 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-3">
          {/* Caption */}
          {currentStatus.caption && (
            <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10">
              <p className="text-sm text-white text-center font-medium leading-relaxed">
                {currentStatus.caption}
              </p>
            </div>
          )}

          {/* Bottom Actions Row: Like Button */}
          <div className="flex items-center justify-between text-white pt-1">
            <div className="text-xs text-zinc-400">
              {likesCount > 0 ? (
                <span>
                  ❤️ {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                </span>
              ) : (
                <span className="opacity-75">Be the first to like</span>
              )}
            </div>

            {/* Like Button */}
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                isLikedByMe
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-1 ring-rose-400'
                  : 'bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/20'
              }`}
              title={isLikedByMe ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isLikedByMe ? 'fill-current scale-110' : ''
                }`}
              />
              <span className="text-xs font-bold">
                {isLikedByMe ? 'Liked' : 'Like'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Prev / Next Floating Arrows */}
      {activeStoryIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-40"
          title="Previous update"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {activeStoryIndex < statuses.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-40"
          title="Next update"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
