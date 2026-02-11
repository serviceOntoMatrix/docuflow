import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, Clock } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatThread {
  document_id: string;
  document_name: string;
  document_status: string;
  company_name?: string;
  last_message_at?: string;
  unread_count: number;
}

interface ChatThreadsListProps {
  onSelectThread: (thread: ChatThread) => void;
  selectedThreadId?: string;
}

export function ChatThreadsList({ onSelectThread, selectedThreadId }: ChatThreadsListProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const response = await chatApi.getThreads();
      if (response.data) {
        setThreads(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat threads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat threads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No messages';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'clarification_needed':
        return 'bg-red-100 text-red-800';
      case 'resend_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Threads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat Threads
          {threads.some(t => t.unread_count > 0) && (
            <Badge variant="destructive" className="ml-auto">
              {threads.reduce((sum, t) => sum + t.unread_count, 0)} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-5rem)]">
          <div className="p-4 space-y-2">
            {threads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No chat threads yet</p>
                <p className="text-sm">Start a conversation by uploading a document</p>
              </div>
            ) : (
              threads.map((thread) => (
                <Button
                  key={thread.document_id}
                  variant={selectedThreadId === thread.document_id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onSelectThread(thread)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <FileText className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {thread.document_name}
                        </span>
                        {thread.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {thread.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(thread.document_status)}`}
                        >
                          {thread.document_status.replace('_', ' ')}
                        </Badge>
                        {thread.company_name && (
                          <span className="text-xs text-muted-foreground">
                            {thread.company_name}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(thread.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
