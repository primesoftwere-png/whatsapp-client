'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSocketStore } from '@/stores/useSocketStore';
import { useUIStore } from '@/stores/useUIStore';
import { Smile, Paperclip, Send, X, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-xs text-center text-zinc-500">Loading emojis...</div>,
});

export default function MessageComposer({
  conversationId,
  onSendMessage,
  replyingTo,
  onCancelReply,
}) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { emitTyping } = useSocketStore();
  const { theme } = useUIStore();
  const typingTimeoutRef = useRef(null);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('.emoji-toggle-btn')
      ) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [content]);

  // Cleanup typing indicator when conversation changes or unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (conversationId) {
        emitTyping(conversationId, false);
      }
    };
  }, [conversationId, emitTyping]);

  // Emit typing indicator with debounce and immediate stop on empty input
  const handleInputChange = (e) => {
    const val = e.target.value;
    setContent(val);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (val.trim().length > 0) {
      emitTyping(conversationId, true);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(conversationId, false);
      }, 1500);
    } else {
      // Stopped typing immediately when content is cleared
      emitTyping(conversationId, false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading attachment...');
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await api.upload('/uploads', formData);
          const uploaded = res.file;
          const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
          const fileUrl = uploaded?.url?.startsWith('http') ? uploaded.url : `${baseUrl}${uploaded?.url || ''}`;
          setAttachments((prev) => [
            ...prev,
            {
              url: fileUrl,
              filename: uploaded?.filename || file.name,
              originalName: uploaded?.originalName || file.name,
              name: file.name,
              mimetype: uploaded?.mimetype || file.type || 'application/octet-stream',
              type: uploaded?.mimetype || file.type || 'application/octet-stream',
              size: uploaded?.size || file.size || 0,
            },
          ]);
        } catch {
          const reader = new FileReader();
          reader.onload = () => {
            setAttachments((prev) => [
              ...prev,
              {
                url: reader.result,
                filename: file.name,
                originalName: file.name,
                name: file.name,
                mimetype: file.type || 'application/octet-stream',
                type: file.type || 'application/octet-stream',
                size: file.size || 0,
              },
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
      toast.success('File attached', { id: toastId });
    } catch {
      toast.error('Failed to attach file', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTyping(conversationId, false);

    onSendMessage({
      content: trimmed,
      attachments,
      replyTo: replyingTo?._id || replyingTo?.id,
    });

    setContent('');
    setAttachments([]);
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl mb-2 text-xs border-l-4 border-emerald-600 animate-slide-down">
          <div className="overflow-hidden mr-2">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
              Replying to {replyingTo.sender?.name || 'message'}
            </span>
            <span className="text-zinc-600 dark:text-zinc-400 block truncate">
              {replyingTo.content || 'Attachment'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl animate-fade-in">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-700"
            >
              {att.type?.startsWith('image') ? (
                <img src={att.url} alt="upload" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-500 text-xs text-center p-1 font-mono">
                  FILE
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full opacity-90 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-scale-in"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme === 'dark' ? 'dark' : 'light'}
            lazyLoadEmojis={true}
            searchPlaceHolder="Search emoji..."
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-zinc-900 border border-transparent focus-within:border-emerald-500/40 transition-all">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="emoji-toggle-btn p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors rounded-xl"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors rounded-xl"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent border-0 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none py-2 outline-none max-h-32 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white disabled:text-zinc-500 disabled:cursor-not-allowed transition-all duration-150 shadow-xs hover:shadow-emerald-500/25 active:scale-95"
          title="Send message (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
