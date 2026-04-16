'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send, Plus, MessageSquare, Palette, Mail, FileText,
  Sparkles, Bot, User, Trash2, Wand2, Paintbrush, ChevronRight,
  Loader2, Lightbulb, Copy, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  type: string;
  messages: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

const CONVERSATION_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'design', label: 'Design', icon: Paintbrush },
  { value: 'quote', label: 'Quote', icon: FileText },
  { value: 'procurement', label: 'Procurement', icon: Mail },
];

const STYLES = ['Contemporary', 'Mediterranean', 'Art Deco', 'Minimalist', 'Traditional Maltese', 'Industrial'];
const ROOM_TYPES = ['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom', 'Dining Room', 'Office', 'Hallway', 'Balcony'];

const AI_TOOLS = [
  { id: 'palette', label: 'Suggest Color Palette', icon: Palette, description: 'AI generates a palette for your style' },
  { id: 'email', label: 'Write Client Email', icon: Mail, description: 'AI drafts a professional email' },
  { id: 'quote-desc', label: 'Generate Quote Description', icon: FileText, description: 'AI writes quote item descriptions' },
  { id: 'brief', label: 'Design Brief Summary', icon: Lightbulb, description: 'AI summarizes project requirements' },
];

const STYLE_COLORS: Record<string, string[]> = {
  Contemporary: ['#2D2D2D', '#F5F0E8', '#C8A97E', '#6B8E7B', '#D4AF37'],
  Mediterranean: ['#D4A574', '#87CEEB', '#F5E6D3', '#8B4513', '#2E8B57'],
  'Art Deco': ['#1A1A2E', '#D4AF37', '#E8E8E8', '#C77DFF', '#00F5D4'],
  Minimalist: ['#FFFFFF', '#2D2D2D', '#E8E8E8', '#8B7D6B', '#3A0CA3'],
  'Traditional Maltese': ['#D4A574', '#F5E6D3', '#8B4513', '#2E8B57', '#87CEEB'],
  Industrial: ['#2D2D2D', '#8B7355', '#A0A0A0', '#D4AF37', '#4A4A4A'],
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Bot className="size-5 text-brand-cyan flex-shrink-0" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-2 bg-brand-cyan/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function ColorSwatch({ color }: { color: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="size-10 rounded-lg border border-white/10 cursor-pointer hover:scale-110 transition-transform relative group"
          style={{ background: color }}
          onClick={() => {
            navigator.clipboard?.writeText(color);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <Check className="size-3 text-white" />
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{color}</TooltipContent>
    </Tooltip>
  );
}

export default function AiDesignModule() {
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationType, setConversationType] = useState('general');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Design generation state
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('Living Room');
  const [selectedStyle, setSelectedStyle] = useState('Contemporary');
  const [generating, setGenerating] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);

  // AI tools state
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState('');
  const [toolGenerating, setToolGenerating] = useState(false);

  // Projects
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [convRes, projRes] = await Promise.all([
          fetch('/api/ai/conversations'),
          fetch('/api/projects'),
        ]);
        if (cancelled) return;
        if (convRes.ok) {
          const data = await convRes.json();
          if (!cancelled) setConversations(data);
        }
        if (projRes.ok) {
          const data = await projRes.json();
          if (!cancelled) {
            setProjects(data);
            if (data.length > 0 && !selectedProject) setSelectedProject(data[0].id);
          }
        }
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [selectedProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages
  const loadConversation = (conv: Conversation) => {
    setActiveConversationId(conv.id);
    setConversationType(conv.type);
    try {
      const msgs: ChatMessage[] = JSON.parse(conv.messages);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
    setShowConversations(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId: activeConversationId,
          type: conversationType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = data.message;
        setMessages((prev) => [...prev, assistantMsg]);
        if (!activeConversationId) {
          setActiveConversationId(data.conversationId);
          await fetchConversations();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  // New conversation
  const newConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage('');
  };

  // Delete conversation
  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
      if (activeConversationId === id) newConversation();
      await fetchConversations();
    } catch (e) { console.error(e); }
  };

  // Generate design concept
  const generateConcept = async () => {
    setGenerating(true);
    setGeneratedConcept(null);
    const project = projects.find((p) => p.id === selectedProject);
    const prompt = `Generate a comprehensive interior design concept for a ${selectedRoom} in ${selectedStyle} style${project ? ` for the project "${project.name}"` : ''}. Include color palette suggestions, key furniture pieces, material selections, lighting recommendations, and an estimated budget range.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, type: 'design' }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedConcept(data.message.content);
      }
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  // AI tool action
  const runTool = async (toolId: string) => {
    setActiveTool(toolId);
    setToolDialogOpen(true);
    setToolGenerating(true);
    setToolResult('');

    const prompts: Record<string, string> = {
      palette: `Suggest a detailed color palette for ${selectedStyle} style interior design. Include primary, secondary, and accent colors with hex codes and usage recommendations.`,
      email: `Write a professional email to a client updating them on their interior design project progress. Keep it warm, professional, and under 200 words. The project is in ${selectedStyle} style.`,
      'quote-desc': `Generate a detailed quote description for a ${selectedRoom} renovation in ${selectedStyle} style. Include item descriptions, specifications, and notes.`,
      brief: `Create a design brief summary for a ${selectedStyle} ${selectedRoom} project. Include objectives, style direction, key requirements, and deliverables.`,
    };

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompts[toolId], type: 'general' }),
      });

      if (res.ok) {
        const data = await res.json();
        setToolResult(data.message.content);
      }
    } catch (e) { console.error(e); }
    setToolGenerating(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="w-64 h-96 rounded-xl" />
          <Skeleton className="flex-1 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-strong border-b border-brand-indigo/20 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-brand-cyan" />
          <div>
            <h2 className="text-lg font-bold font-heading">AI Design Assistant</h2>
            <p className="text-xs text-muted-foreground">Powered by intelligent design algorithms</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={conversationType} onValueChange={setConversationType}>
            <SelectTrigger className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONVERSATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon className="size-3.5" /> {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={newConversation} className="text-xs">
            <Plus className="size-3.5 mr-1" /> New Chat
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Conversations + AI Tools */}
        <div className="w-56 glass-strong border-r border-brand-indigo/20 flex flex-col flex-shrink-0">
          {/* Conversations */}
          <div className="flex-1 overflow-hidden">
            <div className="p-3 border-b border-brand-indigo/10">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</h4>
            </div>
            <ScrollArea className="h-[calc(100%-44px)]">
              <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-brand-indigo/20 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-brand-surface-light/50'
                      }`}
                      onClick={() => loadConversation(conv)}
                    >
                      <MessageSquare className="size-3 flex-shrink-0" />
                      <span className="truncate flex-1">{conv.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      >
                        <Trash2 className="size-2.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* AI Tools */}
          <div className="border-t border-brand-indigo/10">
            <div className="p-3 border-b border-brand-indigo/10">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
            </div>
            <div className="p-2 space-y-0.5">
              {AI_TOOLS.map((tool) => (
                <Button
                  key={tool.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => runTool(tool.id)}
                >
                  <tool.icon className="size-3.5 mr-2" /> {tool.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Chat / Design Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-3 w-fit">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="size-3.5 mr-1" /> Chat
              </TabsTrigger>
              <TabsTrigger value="design" className="text-xs">
                <Wand2 className="size-3.5 mr-1" /> Design Generator
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
              <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-4 max-w-3xl mx-auto">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <Bot className="size-12 mx-auto text-brand-cyan/40 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">AI Design Assistant</h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                        Ask me anything about interior design, color palettes, material selections, procurement advice, or client communications.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'Generate a contemporary living room concept',
                          'Suggest a color palette for a Mediterranean villa',
                          'Write a client email about project progress',
                          'What are the best materials for a Maltese kitchen?',
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="ghost"
                            size="sm"
                            className="text-xs glass border-brand-indigo/10 hover:border-brand-cyan/30"
                            onClick={() => setInputMessage(suggestion)}
                          >
                            <ChevronRight className="size-3 mr-1 text-brand-cyan" /> {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="size-8 rounded-full bg-brand-cyan/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="size-4 text-brand-cyan" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-brand-indigo/30 text-foreground'
                            : 'glass-card border-brand-indigo/20'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-brand-cyan [&_h3]:text-brand-indigo-light [&_strong]:text-foreground [&_a]:text-brand-cyan [&_code]:text-brand-gold [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="size-8 rounded-full bg-brand-indigo/30 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="size-4 text-brand-indigo-light" />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {sending && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-brand-indigo/20 glass-strong flex-shrink-0">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask about design concepts, materials, colors..."
                    className="min-h-[40px] max-h-32 bg-brand-surface-light border-brand-indigo/20 resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !inputMessage.trim()}
                    className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30 self-end"
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Design Generator Tab */}
            <TabsContent value="design" className="flex-1 overflow-y-auto mt-0 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Generator Controls */}
                <Card className="glass-card card-shine rounded-xl border-brand-indigo/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="size-5 text-brand-cyan" /> Design Concept Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Project</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20 w-full">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Room Type</Label>
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                          <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROOM_TYPES.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Style</Label>
                        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                          <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STYLES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Style Color Preview */}
                    <div className="mb-4">
                      <Label className="text-xs text-muted-foreground mb-2 block">Style Color Preview</Label>
                      <TooltipProvider>
                        <div className="flex gap-2">
                          {(STYLE_COLORS[selectedStyle] || []).map((color) => (
                            <ColorSwatch key={color} color={color} />
                          ))}
                        </div>
                      </TooltipProvider>
                    </div>

                    <Button
                      onClick={generateConcept}
                      disabled={generating}
                      className="w-full bg-brand-indigo hover:bg-brand-indigo-light glow-indigo"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Generating Concept...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4 mr-2" /> Generate Concept
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Concept */}
                {generatedConcept && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="glass-card card-shine rounded-xl border-brand-cyan/20 glow-cyan">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="size-5 text-brand-gold" /> Generated Design Concept
                          </CardTitle>
                          <Badge className="status-design">{selectedStyle} · {selectedRoom}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-brand-cyan [&_h3]:text-brand-indigo-light [&_strong]:text-foreground [&_a]:text-brand-cyan [&_code]:text-brand-gold [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                          <ReactMarkdown>{generatedConcept}</ReactMarkdown>
                        </div>

                        {/* Color palette from concept */}
                        <div className="mt-4 pt-4 border-t border-brand-indigo/10">
                          <Label className="text-xs text-muted-foreground mb-2 block">Extracted Palette</Label>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              {(STYLE_COLORS[selectedStyle] || []).map((color) => (
                                <ColorSwatch key={color} color={color} />
                              ))}
                            </div>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Tool Result Dialog */}
      <Dialog open={toolDialogOpen} onOpenChange={setToolDialogOpen}>
        <DialogContent className="glass-card rounded-xl border-brand-indigo/30 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text flex items-center gap-2">
              <Sparkles className="size-5 text-brand-cyan" />
              {AI_TOOLS.find((t) => t.id === activeTool)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {toolGenerating ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="size-5 animate-spin text-brand-cyan" />
                <span className="text-sm text-muted-foreground">Generating...</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-brand-cyan [&_h3]:text-brand-indigo-light [&_strong]:text-foreground [&_a]:text-brand-cyan">
                <ReactMarkdown>{toolResult}</ReactMarkdown>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToolDialogOpen(false)}>Close</Button>
            {toolResult && (
              <Button
                className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30"
                onClick={() => {
                  navigator.clipboard?.writeText(toolResult);
                }}
              >
                <Copy className="size-4 mr-1" /> Copy
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
