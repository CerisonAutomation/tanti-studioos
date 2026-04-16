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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  Wifi,
  WifiOff,
  Settings,
  MessageSquare,
  Zap,
  ArrowRight,
  HandMetal,
  Loader2,
  Activity,
  Users,
  ToggleLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ConversationMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  from: string;
  isAiGenerated: boolean;
  channel: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  clientName: string;
  channel: 'whatsapp' | 'telegram';
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  isActive: boolean;
  isAiMode: boolean;
  messages: ConversationMessage[];
}

interface AgentSettings {
  whatsappAutoReply: boolean;
  telegramAutoReply: boolean;
  personality: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  responseDelay: number;
  fallbackMessage: string;
}

const channelConfig = {
  whatsapp: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    label: 'WhatsApp',
  },
  telegram: {
    icon: <Send className="h-4 w-4" />,
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    borderColor: 'border-sky-400/30',
    label: 'Telegram',
  },
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffHours < 24) return formatTime(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function AgentsModule() {
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [quickReplyLoading, setQuickReplyLoading] = useState(false);
  const [manualReply, setManualReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState<AgentSettings>({
    whatsappAutoReply: true,
    telegramAutoReply: true,
    personality: `You are the AI assistant for Tanti Interiors Studio, a luxury interior design firm based in Malta. You speak professionally yet warmly, like a knowledgeable design consultant. You help clients with:
- Scheduling consultations
- Answering questions about services and pricing
- Providing design inspiration and suggestions
- Coordinating project timelines
Always maintain a sophisticated, helpful tone. If you're unsure about something, offer to connect the client with a human designer. Keep responses concise and elegant.`,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    responseDelay: 3,
    fallbackMessage: `Thank you for your message. Our team is currently unavailable, but we'll get back to you during business hours (9 AM - 6 PM CET). For urgent matters, please call us directly.`,
  });

  // Mock conversations derived from messages
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messages');
      const data = await res.json();

      if (Array.isArray(data)) {
        setMessages(data);

        // Group messages into conversations by client + channel
        const convMap = new Map<string, Conversation>();

        data
          .filter((m: Record<string, unknown>) => m.channel === 'whatsapp' || m.channel === 'telegram')
          .forEach((msg: Record<string, unknown>) => {
            const key = `${msg.clientId || msg.from}-${msg.channel}`;
            const convMsg: ConversationMessage = {
              id: msg.id as string,
              content: msg.content as string,
              direction: msg.direction as 'inbound' | 'outbound',
              from: msg.from as string,
              isAiGenerated: msg.isAiGenerated as boolean,
              channel: msg.channel as string,
              createdAt: msg.createdAt as string,
            };

            if (!convMap.has(key)) {
              convMap.set(key, {
                id: key,
                clientName: (msg.from as string) || 'Unknown',
                channel: msg.channel as 'whatsapp' | 'telegram',
                lastMessage: msg.content as string,
                lastMessageTime: msg.createdAt as string,
                unread: (msg.status === 'unread' && msg.direction === 'inbound') ? 1 : 0,
                isActive: true,
                isAiMode: msg.channel === 'whatsapp' ? settings.whatsappAutoReply : settings.telegramAutoReply,
                messages: [convMsg],
              });
            } else {
              const conv = convMap.get(key)!;
              conv.messages.push(convMsg);
              conv.lastMessage = msg.content as string;
              conv.lastMessageTime = msg.createdAt as string;
              if (msg.status === 'unread' && msg.direction === 'inbound') conv.unread++;
            }
          });

        // Sort conversations by last message time
        const sortedConvs = Array.from(convMap.values()).sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        setConversations(sortedConvs);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [settings.whatsappAutoReply, settings.telegramAutoReply]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const generateQuickReplies = async () => {
    if (!selectedConv) return;
    setQuickReplyLoading(true);
    try {
      const lastInbound = [...selectedConv.messages]
        .reverse()
        .find((m) => m.direction === 'inbound');

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastInbound?.content || 'Hello',
          conversationId: selectedConv.id,
          type: 'general',
        }),
      });
      const data = await res.json();
      // Simulate 3 quick reply options
      const base = data.response || 'Thank you for your message.';
      setQuickReplies([
        base.substring(0, 80) + (base.length > 80 ? '...' : ''),
        "I'd be happy to help! Could you tell me more about what you're looking for?",
        'Let me check on that and get back to you shortly.',
      ]);
    } catch {
      toast.error('Failed to generate quick replies');
    } finally {
      setQuickReplyLoading(false);
    }
  };

  const sendManualReply = async () => {
    if (!selectedConv || !manualReply.trim()) return;
    setSendingReply(true);
    try {
      const clientId = (messages.find(
        (m: Record<string, unknown>) =>
          m.from === selectedConv.clientName && m.channel === selectedConv.channel
      ) as Record<string, unknown>)?.clientId as string | null;

      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          channel: selectedConv.channel,
          direction: 'outbound',
          from: 'Tanti Studio',
          to: selectedConv.clientName,
          content: manualReply,
          isAiGenerated: false,
        }),
      });

      // Add to local conversation
      const newMsg: ConversationMessage = {
        id: `msg-${Date.now()}`,
        content: manualReply,
        direction: 'outbound',
        from: 'Tanti Studio',
        isAiGenerated: false,
        channel: selectedConv.channel,
        createdAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, messages: [...c.messages, newMsg], lastMessage: manualReply, lastMessageTime: newMsg.createdAt }
            : c
        )
      );
      setManualReply('');
      toast.success('Message sent');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const toggleAiMode = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, isAiMode: !c.isAiMode } : c
      )
    );
    const conv = conversations.find((c) => c.id === convId);
    toast.success(
      conv?.isAiMode
        ? 'Switched to manual mode'
        : 'Switched to AI auto-reply mode'
    );
  };

  // Stats
  const whatsappConvos = conversations.filter((c) => c.channel === 'whatsapp');
  const telegramConvos = conversations.filter((c) => c.channel === 'telegram');
  const whatsappMessagesToday = whatsappConvos.reduce((sum, c) => sum + c.messages.length, 0);
  const telegramMessagesToday = telegramConvos.reduce((sum, c) => sum + c.messages.length, 0);
  const activeConversations = conversations.filter((c) => c.isActive).length;

  // Skeleton loading
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-brand-surface-light" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-brand-surface-light" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Messaging Agents</h2>
          <p className="text-muted-foreground text-sm mt-1">
            AI-powered WhatsApp & Telegram agent management
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSettings(!showSettings)}
          className="border-border/30"
        >
          <Settings className="h-4 w-4 mr-2" /> Agent Settings
        </Button>
      </div>

      {/* Channel Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WhatsApp Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="font-semibold font-['Space_Grotesk'] text-sm">WhatsApp</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 pulse-cyan" />
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold font-['Space_Grotesk'] text-green-400">
                    {whatsappMessagesToday}
                  </p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-['Space_Grotesk'] text-green-400">
                    {whatsappConvos.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                <span className="text-xs text-muted-foreground">Auto-reply</span>
                <Switch
                  checked={settings.whatsappAutoReply}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, whatsappAutoReply: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Telegram Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-sky-400" />
                  </div>
                  <span className="font-semibold font-['Space_Grotesk'] text-sm">Telegram</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-sky-400 pulse-cyan" />
                  <span className="text-xs text-sky-400">Connected</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold font-['Space_Grotesk'] text-sky-400">
                    {telegramMessagesToday}
                  </p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-['Space_Grotesk'] text-sky-400">
                    {telegramConvos.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                <span className="text-xs text-muted-foreground">Auto-reply</span>
                <Switch
                  checked={settings.telegramAutoReply}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, telegramAutoReply: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Conversations Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-brand-cyan" />
                </div>
                <span className="font-semibold font-['Space_Grotesk'] text-sm">Activity</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Chats</span>
                  <span className="font-bold text-brand-cyan font-['Space_Grotesk']">{activeConversations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">AI Handling</span>
                  <span className="font-bold text-brand-gold font-['Space_Grotesk']">
                    {conversations.filter((c) => c.isAiMode).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Manual Mode</span>
                  <span className="font-bold text-brand-indigo font-['Space_Grotesk']">
                    {conversations.filter((c) => !c.isAiMode).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-brand-gold" />
                </div>
                <span className="font-semibold font-['Space_Grotesk'] text-sm">Performance</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Avg Response</span>
                  <span className="font-bold text-brand-gold font-['Space_Grotesk']">{settings.responseDelay}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Business Hours</span>
                  <span className="font-bold text-foreground font-['Space_Grotesk'] text-xs">
                    {settings.businessHoursStart}-{settings.businessHoursEnd}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">AI Replies Sent</span>
                  <span className="font-bold text-brand-cyan font-['Space_Grotesk']">
                    {conversations.reduce((sum, c) => sum + c.messages.filter((m) => m.isAiGenerated).length, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-['Space_Grotesk'] flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand-cyan" /> Agent Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-reply toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-surface-light/30">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">WhatsApp Auto-Reply</span>
                    </div>
                    <Switch
                      checked={settings.whatsappAutoReply}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, whatsappAutoReply: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-brand-surface-light/30">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-sky-400" />
                      <span className="text-sm">Telegram Auto-Reply</span>
                    </div>
                    <Switch
                      checked={settings.telegramAutoReply}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, telegramAutoReply: checked }))
                      }
                    />
                  </div>
                </div>

                {/* AI Personality */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-brand-cyan" /> AI Personality & Prompt
                  </Label>
                  <Textarea
                    value={settings.personality}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, personality: e.target.value }))
                    }
                    rows={5}
                    className="bg-brand-surface-light/50 border-border/30 text-sm"
                    placeholder="Define the AI agent's personality and behavior..."
                  />
                </div>

                {/* Business Hours & Response Delay */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Business Hours Start
                    </Label>
                    <Input
                      type="time"
                      value={settings.businessHoursStart}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          businessHoursStart: e.target.value,
                        }))
                      }
                      className="bg-brand-surface-light/50 border-border/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Business Hours End
                    </Label>
                    <Input
                      type="time"
                      value={settings.businessHoursEnd}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          businessHoursEnd: e.target.value,
                        }))
                      }
                      className="bg-brand-surface-light/50 border-border/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Response Delay (seconds)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.responseDelay}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          responseDelay: parseInt(e.target.value) || 3,
                        }))
                      }
                      className="bg-brand-surface-light/50 border-border/30"
                    />
                  </div>
                </div>

                {/* Fallback Message */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <ToggleLeft className="h-3 w-3" /> Fallback Message (when AI can't respond)
                  </Label>
                  <Textarea
                    value={settings.fallbackMessage}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, fallbackMessage: e.target.value }))
                    }
                    rows={2}
                    className="bg-brand-surface-light/50 border-border/30 text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      toast.success('Agent settings saved');
                      setShowSettings(false);
                    }}
                    className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
                  >
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Conversations + Thread */}
      <div className="flex h-[calc(100vh-380px)] min-h-[400px] gap-0">
        {/* Conversations List */}
        <div className="w-80 lg:w-96 shrink-0 glass-card rounded-l-xl flex flex-col">
          <div className="p-3 border-b border-border/30">
            <h3 className="font-semibold font-['Space_Grotesk'] text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-cyan" /> Active Conversations
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/10">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active conversations</p>
                </div>
              ) : (
                conversations.map((conv, index) => {
                  const channel = channelConfig[conv.channel];
                  const isSelected = selectedConversation === conv.id;

                  return (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        setQuickReplies([]);
                        setManualReply('');
                      }}
                      className={`cursor-pointer p-3 transition-all hover:bg-brand-surface-light/50 ${
                        isSelected ? 'bg-brand-indigo/10 border-l-2 border-brand-indigo' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full ${channel.bgColor} flex items-center justify-center ${channel.color}`}>
                          {channel.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">
                              {conv.clientName}
                            </span>
                            <div className="flex items-center gap-1">
                              {conv.isAiMode ? (
                                <Bot className="h-3 w-3 text-brand-gold" />
                              ) : (
                                <User className="h-3 w-3 text-brand-cyan" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(conv.lastMessageTime)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.lastMessage}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${channel.borderColor} ${channel.color}`}
                            >
                              {channel.label}
                            </Badge>
                            {conv.isAiMode && (
                              <Badge className="bg-brand-gold/15 text-brand-gold border-brand-gold/30 text-xs">
                                <Bot className="h-2.5 w-2.5 mr-0.5" /> AI
                              </Badge>
                            )}
                            {conv.unread > 0 && (
                              <Badge className="bg-brand-cyan/20 text-brand-cyan text-xs">
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 glass-card rounded-r-xl border-l-0 flex flex-col">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-3 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full ${channelConfig[selectedConv.channel].bgColor} flex items-center justify-center ${channelConfig[selectedConv.channel].color}`}>
                    {channelConfig[selectedConv.channel].icon}
                  </div>
                  <div>
                    <h4 className="font-semibold font-['Space_Grotesk'] text-sm">
                      {selectedConv.clientName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {channelConfig[selectedConv.channel].label} •{' '}
                      {selectedConv.isAiMode ? 'AI Mode' : 'Manual Mode'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAiMode(selectedConv.id)}
                  className={
                    selectedConv.isAiMode
                      ? 'border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10'
                      : 'border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10'
                  }
                >
                  {selectedConv.isAiMode ? (
                    <>
                      <HandMetal className="h-4 w-4 mr-1" /> Take Over
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-1" /> Enable AI
                    </>
                  )}
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {selectedConv.messages.map((msg, i) => {
                    const isInbound = msg.direction === 'inbound';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl p-3 ${
                            isInbound
                              ? 'bg-brand-surface-light rounded-bl-sm'
                              : msg.isAiGenerated
                              ? 'bg-brand-gold/10 border border-brand-gold/20 rounded-br-sm'
                              : 'bg-brand-indigo/20 rounded-br-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {msg.isAiGenerated && (
                              <Sparkles className="h-3 w-3 text-brand-gold" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.createdAt)}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ml-1 ${channelConfig[msg.channel as keyof typeof channelConfig]?.borderColor || ''} ${channelConfig[msg.channel as keyof typeof channelConfig]?.color || ''}`}
                            >
                              {channelConfig[msg.channel as keyof typeof channelConfig]?.label || msg.channel}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Quick Replies */}
              <div className="px-4 py-2 border-t border-border/20">
                {quickReplies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setManualReply(reply)}
                        className="text-xs border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/10"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {reply.length > 50 ? reply.substring(0, 50) + '...' : reply}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateQuickReplies}
                    disabled={quickReplyLoading}
                    className="text-xs text-brand-cyan hover:text-brand-cyan-dark"
                  >
                    {quickReplyLoading ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    Generate Quick Replies
                  </Button>
                )}
              </div>

              {/* Reply Input */}
              <div className="p-3 border-t border-border/30 flex gap-2">
                <Input
                  value={manualReply}
                  onChange={(e) => setManualReply(e.target.value)}
                  placeholder={
                    selectedConv.isAiMode
                      ? 'Type to take over from AI...'
                      : 'Type your message...'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendManualReply();
                    }
                  }}
                  className="bg-brand-surface-light/50 border-border/30 flex-1"
                />
                <Button
                  onClick={sendManualReply}
                  disabled={!manualReply.trim() || sendingReply}
                  className={`${
                    selectedConv.isAiMode
                      ? 'bg-brand-gold hover:bg-brand-gold/80 text-black'
                      : 'bg-brand-indigo hover:bg-brand-indigo-light text-white'
                  }`}
                >
                  {sendingReply ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-['Space_Grotesk']">Select a conversation</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Choose a conversation from the left panel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
