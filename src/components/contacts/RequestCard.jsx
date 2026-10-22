'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Check, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function RequestCard({
  request,
  onAccept,
  onDecline,
  isOutgoing = false,
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const isOutgoingReq = isOutgoing || request.isOutgoing;
  const targetUser = isOutgoingReq
    ? request.to || request.recipient
    : request.from || request.sender;
  const requestId = request._id || request.id;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(requestId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline(requestId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar
          src={targetUser?.avatar}
          name={targetUser?.name || targetUser?.username}
          size="lg"
        />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {targetUser?.name || targetUser?.username}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            @{targetUser?.username}
          </p>
          {request.createdAt && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              {isOutgoingReq ? 'Sent ' : 'Received '} {formatDate(request.createdAt)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        {isOutgoingReq ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            Pending
          </span>
        ) : (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={handleAccept}
              isLoading={isProcessing}
              icon={Check}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDecline}
              disabled={isProcessing}
              icon={X}
            >
              Decline
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
