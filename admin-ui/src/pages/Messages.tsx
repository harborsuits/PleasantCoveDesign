import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
import { useAuth } from "@/hooks/useAuth";

export default function Messages() {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : null;
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sendMessage,
    isSending,
  } = useInfiniteMessages(projectIdNum || 0, token || undefined);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    await sendMessage({ content: message.trim() });
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!projectIdNum) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Select a project to view messages</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Please navigate to a specific project to view its messages.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with your client for Project #{projectIdNum}</p>
      </div>

      <Card className="h-[calc(100vh-220px)] flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading messages...</div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.senderType !== 'admin' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${msg.senderType === 'admin' ? 'order-1' : 'order-2'}`}>
                    <div className={`rounded-lg px-3 py-2 ${
                      msg.senderType === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {msg.attachments.map((attachment, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            📎 File {idx + 1}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.senderType === 'admin' && (
                    <Avatar className="h-8 w-8 order-2">
                      <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {hasNextPage && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More Messages'}
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              disabled={!message.trim() || isSending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
