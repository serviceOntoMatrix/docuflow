import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, User, Building, Users } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  sender_role: 'client' | 'firm' | 'accountant';
  sender_name: string;
  sender_email: string;
  recipient_role: 'client' | 'firm' | 'accountant';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatThreadProps {
  documentId: string;
  documentName: string;
  currentUserRole: 'client' | 'firm' | 'accountant';
  currentUserId: string;
}

export function ChatThread({ 
  documentId, 
  documentName, 
  currentUserRole, 
  currentUserId 
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    // Mark messages as read when component mounts
    chatApi.markAsRead(documentId);
    
    // Set up polling for real-time updates
    const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [documentId]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await chatApi.getMessages(documentId);
      if (response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Don't show toast for polling errors to avoid spam
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Determine recipient based on current user role and conversation context
    let recipientRole: 'client' | 'firm' | 'accountant';
    if (currentUserRole === 'client') {
      recipientRole = 'firm';
    } else if (currentUserRole === 'accountant') {
      recipientRole = 'firm';
    } else { // firm
      // For firm, check the most recent message to determine who we're replying to
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        // Reply to whoever sent the last message, unless it was us
        if (lastMessage.sender_role !== currentUserRole) {
          recipientRole = lastMessage.sender_role;
        } else {
          // If the last message was from us, check the one before that
          const previousMessage = messages[messages.length - 2];
          if (previousMessage) {
            recipientRole = previousMessage.sender_role;
          } else {
            // Default to client if no previous messages
            recipientRole = 'client';
          }
        }
      } else {
        // No messages yet, default to client
        recipientRole = 'client';
      }
    }

    setIsLoading(true);
    try {
      const response = await chatApi.sendMessage({
        document_id: documentId,
        message: newMessage.trim(),
        recipient_role: recipientRole,
      });

      if (response.data) {
        setNewMessage('');
        // Add the new message to the local state
        const newMsg: Message = {
          ...response.data,
          sender_name: 'You',
          sender_email: '',
          is_read: false,
        };
        setMessages(prev => [...prev, newMsg]);
        // Immediately refresh messages to get the proper format
        loadMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client':
        return <User className="h-4 w-4" />;
      case 'firm':
        return <Building className="h-4 w-4" />;
      case 'accountant':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'firm':
        return 'bg-green-100 text-green-800';
      case 'accountant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat: {documentName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender_id !== currentUserId && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {getRoleIcon(message.sender_role)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRoleColor(message.sender_role)}`}
                    >
                      {getRoleIcon(message.sender_role)}
                      <span className="ml-1">
                        {message.sender_name} ({message.sender_role})
                      </span>
                    </Badge>
                    <span className="text-xs opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                </div>
                
                {message.sender_id === currentUserId && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {getRoleIcon(message.sender_role)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {currentUserRole === 'firm' && (
            <p className="text-xs text-muted-foreground mt-2">
              As Firm, you can message Clients and Accountants
            </p>
          )}
          {(currentUserRole === 'client' || currentUserRole === 'accountant') && (
            <p className="text-xs text-muted-foreground mt-2">
              You can only message the Firm
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
