import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ChatThreadsList } from './ChatThreadsList';
import { ChatThread } from './ChatThread';

interface ChatThread {
  document_id: string;
  document_name: string;
  document_status: string;
  company_name?: string;
  last_message_at?: string;
  unread_count: number;
}

interface ChatInterfaceProps {
  currentUserRole: 'client' | 'firm' | 'accountant';
  currentUserId: string;
}

export function ChatInterface({ currentUserRole, currentUserId }: ChatInterfaceProps) {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if there's a pre-selected document from navigation state
    if (location.state?.selectedDocument) {
      const { selectedDocument } = location.state;
      setSelectedThread({
        document_id: selectedDocument.document_id,
        document_name: selectedDocument.document_name,
        document_status: 'pending', // Default status
        last_message_at: undefined,
        unread_count: 0,
      });
      // Clear the state to prevent re-selection on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  return (
    <div className="h-full">
      {selectedThread ? (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <ChatThreadsList
              onSelectThread={handleSelectThread}
              selectedThreadId={selectedThread?.document_id}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <ChatThread
              documentId={selectedThread.document_id}
              documentName={selectedThread.document_name}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <ChatThreadsList
              onSelectThread={handleSelectThread}
              selectedThreadId={selectedThread?.document_id}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            <div className="h-full flex items-center justify-center bg-muted/20 border-l">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">Select a chat thread</h3>
                <p className="text-muted-foreground">
                  Choose a document from the list to start chatting
                </p>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
