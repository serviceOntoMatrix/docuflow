import React from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { authApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function ChatPage() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: authApi.getSession,
  });

  const currentUserRole = session?.role as 'client' | 'firm' | 'accountant';
  const currentUserId = session?.user?.id;

  if (!session || !currentUserRole || !currentUserId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="h-full">
        <ChatInterface
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
