'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  MessageCircle,
  Send,
  Smartphone,
  MessageSquare,
  Sparkles,
  Clock,
  User,
  Archive,
  CheckCheck,
  Bot,
  Loader2,
  Building2,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface MessageClient {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface Message {
  id: string;
  clientId: string | null;
  channel: string;
  direction: string;
  from: string;
  to: string | null;
  subject: string | null;
  content: string;
  status: string;
  isAiGenerated: boolean;
  attachments: string | null;
  createdAt: string;
  client: MessageClient | null;
}

type ChannelType = 'all' | 'email' | 'whatsapp' | 'telegram' | 'sms' | 'internal';

const channelConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  email: {
    icon: <Mail className="h-4 w-4" />,
    color: 'text-blue-400',
    label: 'Email',
  },
  whatsapp: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-green-400',
    label: 'WhatsApp',
  },
  telegram: {
    icon: <Send className="h-4 w-4" />,
    color: 'text-sky-400',
    label: 'Telegram',
  },
  sms: {
    icon: <Smartphone className="h-4 w-4" />,
    color: 'text-purple-400',
    label: 'SMS',
  },
  internal: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-amber-400',
    label: 'Internal',
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function InboxModule() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);

      const res = await fetch(`/api/messages?${params.toString()}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : (data.messages || []));
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channelFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-select first message
  useEffect(() => {
    if (messages.length > 0 && !selectedMessage) {
      setSelectedMessage(messages[0]);
    }
  }, [messages, selectedMessage]);

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'read' } : m))
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: 'read' } : null));
      }
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAsArchived = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(messages.find((m) => m.id !== messageId) || null);
      }
      toast.success('Message archived');
    } catch {
      toast.error('Failed to archive message');
    }
  };

  const suggestReply = async () => {
    if (!selectedMessage) return;
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: selectedMessage.content,
          conversationId: selectedMessage.id,
          type: 'inquiry',
        }),
      });
      const data = await res.json();
      if (data.response) {
        setAiSuggestion(data.response);
        setReplyText(data.response);
      }
    } catch {
      toast.error('Failed to generate AI suggestion');
    } finally {
      setAiLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const channel = selectedMessage.channel;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedMessage.clientId,
          channel,
          direction: 'outbound',
          from: 'Tanti Studio',
          to: selectedMessage.from,
          subject: selectedMessage.subject
            ? `Re: ${selectedMessage.subject}`
            : null,
          content: replyText,
          isAiGenerated: replyText === aiSuggestion,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Reply sent');
      setReplyText('');
      setAiSuggestion('');
      // Mark original as replied
      await fetch(`/api/messages/${selectedMessage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied' }),
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, status: 'replied' } : m
        )
      );
      setSelectedMessage((prev) =>
        prev ? { ...prev, status: 'replied' } : null
      );
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setReplyText('');
    setAiSuggestion('');
    if (msg.status === 'unread') {
      markAsRead(msg.id);
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  // Skeleton loading
  if (loading && messages.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] gap-4 p-6">
        <div className="w-80 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-brand-surface-light"
            />
          ))}
        </div>
        <div className="flex-1 animate-pulse rounded-xl bg-brand-surface-light" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 p-6">
      {/* Left Panel - Message List */}
      <div className="w-80 lg:w-96 shrink-0 flex flex-col glass-card rounded-l-xl">
        {/* Header */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-['Space_Grotesk'] flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-cyan" /> Inbox
            </h2>
            {unreadCount > 0 && (
              <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <Tabs
            value={channelFilter}
            onValueChange={setChannelFilter}
            className="w-full"
          >
            <TabsList className="w-full bg-brand-surface-light/50 h-8 p-0.5">
              <TabsTrigger value="all" className="text-xs h-7 flex-1">
                All
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs h-7 flex-1">
                <Mail className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs h-7 flex-1">
                <MessageCircle className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="telegram" className="text-xs h-7 flex-1">
                <Send className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs h-7 flex-1">
                Unread
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Messages List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/10">
            <AnimatePresence>
              {messages
                .filter((m) => channelFilter !== 'unread' || m.status === 'unread')
                .map((msg, index) => {
                  const channel = channelConfig[msg.channel] || channelConfig.email;
                  const isSelected = selectedMessage?.id === msg.id;
                  const isUnread = msg.status === 'unread';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectMessage(msg)}
                      className={`cursor-pointer p-3 transition-all hover:bg-brand-surface-light/50 ${
                        isSelected ? 'bg-brand-indigo/10 border-l-2 border-brand-indigo' : ''
                      } ${isUnread ? 'bg-brand-cyan/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${channel.color}`}>
                          {channel.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {msg.from}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          {msg.subject && (
                            <p className={`text-xs truncate ${isUnread ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {msg.content}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-brand-cyan pulse-cyan mt-2 shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
          {messages.filter((m) => channelFilter !== 'unread' || m.status === 'unread').length === 0 && (
            <div className="text-center py-12">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Message Detail */}
      <div className="flex-1 glass-card rounded-r-xl border-l-0 flex flex-col">
        {selectedMessage ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-brand-surface flex items-center justify-center ${channelConfig[selectedMessage.channel]?.color || 'text-muted-foreground'}`}>
                    {channelConfig[selectedMessage.channel]?.icon || <Mail className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold font-['Space_Grotesk']">
                      {selectedMessage.from}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      via {channelConfig[selectedMessage.channel]?.label || selectedMessage.channel} • {formatDate(selectedMessage.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMessage.isAiGenerated && (
                    <Badge className="bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30 text-xs">
                      <Bot className="h-3 w-3 mr-1" /> AI Generated
                    </Badge>
                  )}
                  <Badge className={
                    selectedMessage.status === 'unread' ? 'status-unread' :
                    selectedMessage.status === 'replied' ? 'status-accepted' :
                    'status-draft'
                  }>
                    {selectedMessage.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsArchived(selectedMessage.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedMessage.subject && (
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {selectedMessage.subject}
                </p>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Message Content */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {/* AI Suggestion */}
                  {aiSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-brand-cyan" />
                        <span className="text-xs font-medium text-brand-cyan">AI Suggested Reply</span>
                      </div>
                      <p className="text-sm text-foreground/80">{aiSuggestion}</p>
                    </motion.div>
                  )}
                </ScrollArea>

                {/* Reply Area */}
                <div className="p-4 border-t border-border/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={suggestReply}
                      disabled={aiLoading}
                      className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"
                    >
                      {aiLoading ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      Suggest Reply
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      AI will generate a professional response
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="bg-brand-surface-light/50 border-border/30 flex-1"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={sendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
                    >
                      {sendingReply ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Client Info Sidebar */}
              {selectedMessage.client && (
                <div className="w-56 border-l border-border/30 p-4 hidden lg:block">
                  <Card className="bg-brand-surface-light/30 border-border/20">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
                        Client Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-brand-indigo/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-brand-indigo" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{selectedMessage.client.name}</p>
                        </div>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{selectedMessage.client.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`status-${selectedMessage.client.status} text-xs`}>
                            {selectedMessage.client.status}
                          </Badge>
                        </div>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        <span>View Projects</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Client since {new Date(selectedMessage.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold font-['Space_Grotesk']">Select a message</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Choose a conversation from the left panel
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
