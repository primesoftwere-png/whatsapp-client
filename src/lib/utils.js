import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return format(d, 'h:mm a');
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (isToday(d)) {
    return format(d, 'h:mm a');
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  if (isThisWeek(d)) {
    return format(d, 'EEEE'); // e.g. Monday
  }
  if (isThisYear(d)) {
    return format(d, 'MMM d'); // e.g. Oct 22
  }
  return format(d, 'MM/dd/yy');
}

export function formatSeparatorDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (isToday(d)) {
    return 'Today';
  }
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  if (isThisYear(d)) {
    return format(d, 'MMMM d, yyyy');
  }
  return format(d, 'MMMM d, yyyy');
}

export function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(text, length = 35) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

const AVATAR_COLORS = [
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-emerald-700 text-white',
  'bg-slate-700 text-white',
  'bg-teal-700 text-white',
  'bg-green-600 text-white',
  'bg-cyan-700 text-white',
  'bg-slate-800 text-white',
];

export function getAvatarColor(identifier = '') {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Resolves a media or avatar URL (relative or absolute) to a fully qualified URL.
 * e.g. '/uploads/avatar-123.jpg' -> 'http://localhost:5000/uploads/avatar-123.jpg'
 */
export function getMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const backendBase =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : '') ||
    'http://localhost:5000';
  const cleanBase = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

