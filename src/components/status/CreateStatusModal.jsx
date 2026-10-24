'use client';

import { useState, useRef } from 'react';
import { X, UploadCloud, Image, Video, AlertCircle, Loader2 } from 'lucide-react';
import { useStatusStore } from '@/stores/useStatusStore';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CreateStatusModal({ isOpen, onClose }) {
  const { createStatus, isUploading } = useStatusStore();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File exceeds 50MB limit');
      return;
    }

    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVid && !isImg) {
      toast.error('Please select an image or video file (JPG, PNG, MP4, WEBM, etc.)');
      return;
    }

    setSelectedFile(file);
    setIsVideo(isVid);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setIsVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please choose an image or video first');
      return;
    }

    const formData = new FormData();
    formData.append('media', selectedFile);
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }

    try {
      await createStatus(formData);
      handleClearFile();
      setCaption('');
      onClose();
    } catch {
      // toast is handled in useStatusStore
    }
  };

  const handleModalClose = () => {
    if (isUploading) return;
    handleClearFile();
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                New Status
              </h3>
              <p className="text-xs text-zinc-500">
                Share a photo or video (disappears in 24h)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isUploading}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Media Selection / Preview Area */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all bg-zinc-50 dark:bg-zinc-800/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Click to browse photo or video
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Supports JPG, PNG, WEBP, MP4, WEBM (Max 50MB)
              </p>

              <div className="flex items-center gap-3 mt-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-emerald-500" /> Photos
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-teal-500" /> Videos
                </span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-72 flex items-center justify-center group">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-72 w-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Status Preview"
                  className="max-h-72 w-full object-contain"
                />
              )}

              {/* Action buttons on top of preview */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isUploading}
                  className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                  title="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] text-white flex items-center gap-1.5 font-medium">
                {isVideo ? (
                  <>
                    <Video className="w-3 h-3 text-teal-400" /> Video selected
                  </>
                ) : (
                  <>
                    <Image className="w-3 h-3 text-emerald-400" /> Image selected
                  </>
                )}
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption to your status..."
              maxLength={500}
              disabled={isUploading}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleModalClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile || isUploading}
              isLoading={isUploading}
              className="px-5 py-2 text-xs font-semibold"
            >
              Post Status
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
