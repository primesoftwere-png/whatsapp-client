import { Suspense } from 'react';
import ChatShell from '@/components/chat/ChatShell';
import Spinner from '@/components/ui/Spinner';

export default function ChatLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0c0c11]">
          <Spinner size="lg" text="Loading NexChat..." />
        </div>
      }
    >
      <ChatShell>{children}</ChatShell>
    </Suspense>
  );
}
