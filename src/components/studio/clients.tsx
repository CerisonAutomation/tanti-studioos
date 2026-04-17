'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Plus,
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  MessageSquare,
  Activity as ActivityIcon,
  Briefcase,
  User,
  Sparkles,
  ChevronDown,
  Download,
} from 'lucide-react';
import { exportToCSV } from '@/lib/export';

// Types
interface ClientProject {
  id: string;
  name: string;
  status: string;
  priority: string;
  budget: number | null;
  spent: number;
  _count?: { tasks: number };
}

interface ClientQuote {
  id: string;
  title: string;
  status: string;
  tier: string;
  total: number;
  createdAt: string;
}

interface ClientMessage {
  id: string;
  channel: string;
  direction: string;
  from: string;
  to: string | null;
  subject: string | null;
  content: string;
  status: string;
  isAiGenerated: boolean;
  createdAt: string;
}

interface ClientActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  source: string | null;
  status: string;
  notes: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  projects: ClientProject[];
  quotes: ClientQuote[];
  messages: ClientMessage[];
  activities: ClientActivity[];
}

interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string;
  status: string;
  source: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  _count: { projects: number; quotes: number; messages: number };
}

const statusOptions = ['lead', 'active', 'completed', 'dormant'] as const;
const sourceOptions = ['website', 'referral', 'instagram', 'exhibition', 'cold-outreach', 'other'] as const;

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const channelIcons: Record<string, string> = {
  email: '📧',
  whatsapp: '💬',
  telegram: '✈️',
};

const channelColors: Record<string, string> = {
  email: 'text-blue-400',
  whatsapp: 'text-green-400',
  telegram: 'text-sky-400',
};

export default function ClientsModule() {
  const { selectedClientId, setSelectedClientId } = useAppStore();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Malta',
    source: 'website',
    status: 'lead',
    notes: '',
    budgetMin: '',
    budgetMax: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch clients list
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('sort', sortField);
      params.set('order', sortOrder);
      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Handle multiple response formats:
        // 1. Array directly: [...]
        // 2. Object with clients: { clients: [...], total: N }
        // 3. Object with data: { data: [...] }
        let rawClients: unknown[];
        let total = 0;

        if (Array.isArray(data)) {
          rawClients = data;
          total = data.length;
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.clients)) {
            rawClients = data.clients;
            total = typeof data.total === 'number' ? data.total : data.clients.length;
          } else if (Array.isArray(data.data)) {
            rawClients = data.data;
            total = data.data.length;
          } else {
            rawClients = [];
          }
        } else {
          rawClients = [];
        }

        // Normalize _count field from either _count or separate count fields
        const normalizedClients = rawClients.map((c: Record<string, unknown>) => {
          const countObj = (c as Record<string, unknown>)._count as Record<string, unknown> | undefined;
          return {
            ...c,
            _count: {
              projects: (countObj?.projects as number) ?? (c.projectCount as number) ?? 0,
              quotes: (countObj?.quotes as number) ?? (c.quoteCount as number) ?? 0,
              messages: (countObj?.messages as number) ?? (c.messageCount as number) ?? 0,
            },
          };
        }) as ClientListItem[];
        setClients(normalizedClients);
        setTotalCount(total);
      } else {
        console.error('Clients API returned status:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sortField, sortOrder]);

  // Fetch client detail
  const fetchClientDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClientDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch client detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetail(selectedClientId);
      setActiveTab('overview');
    } else {
      setClientDetail(null);
    }
  }, [selectedClientId, fetchClientDetail]);

  // Open add dialog
  const openAddDialog = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Malta',
      source: 'website',
      status: 'lead',
      notes: '',
      budgetMin: '',
      budgetMax: '',
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (client: ClientDetail) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country,
      source: client.source || 'website',
      status: client.status,
      notes: client.notes || '',
      budgetMin: client.budgetMin?.toString() || '',
      budgetMax: client.budgetMax?.toString() || '',
    });
    setDialogOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return;
    setSubmitting(true);
    try {
      if (editingClient) {
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchClientDetail(editingClient.id);
          fetchClients();
        }
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          fetchClients();
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save client:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // DETAIL VIEW
  if (selectedClientId) {
    if (detailLoading) {
      return (
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    if (!clientDetail) return null;

    const c = clientDetail;
    const budgetPercent = c.budgetMax ? (c.budgetMin && c.budgetMax ? ((c.budgetMin + c.budgetMax) / 2 / c.budgetMax) * 100 : 0) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 md:p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClientId(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-indigo/30 border border-brand-indigo/30 flex items-center justify-center">
                <User className="h-5 w-5 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk']">{c.name}</h2>
                <p className="text-sm text-muted-foreground">{c.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`status-${c.status} text-xs`}>{statusLabel(c.status)}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(c)}
              className="border-brand-indigo/30 hover:bg-brand-indigo/20"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-brand-surface-light border border-brand-indigo/20">
            {[
              { value: 'overview', icon: User, label: 'Overview' },
              { value: 'projects', icon: Briefcase, label: 'Projects' },
              { value: 'quotes', icon: FileText, label: 'Quotes' },
              { value: 'messages', icon: MessageSquare, label: 'Messages' },
              { value: 'activity', icon: ActivityIcon, label: 'Activity' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan"
              >
                <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Info */}
              <Card className="glass-card col-span-1 md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-['Space_Grotesk']">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-brand-cyan" />
                    <span>{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-brand-cyan" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {(c.address || c.city) && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-brand-cyan" />
                      <span>{[c.address, c.city, c.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-brand-cyan" />
                    <span>Source: <span className="text-brand-gold capitalize">{c.source || 'N/A'}</span></span>
                  </div>
                  {c.notes && (
                    <>
                      <Separator className="bg-brand-indigo/20" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Notes</p>
                        {c.notes}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Budget Range */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-['Space_Grotesk']">Budget Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-['Space_Grotesk'] gradient-gold-text">
                      {formatCurrency(c.budgetMin)} — {formatCurrency(c.budgetMax)}
                    </p>
                  </div>
                  {c.budgetMax && (
                    <div>
                      <Progress
                        value={budgetPercent}
                        className="h-2 bg-brand-surface-lighter"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Average budget position
                      </p>
                    </div>
                  )}
                  <Separator className="bg-brand-indigo/20" />
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-brand-cyan">{c.projects.length}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-brand-gold">{c.quotes.length}</p>
                      <p className="text-xs text-muted-foreground">Quotes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            {c.projects.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No projects yet for this client</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {c.projects.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="glass-card glass-hover cursor-pointer rounded-xl transition-all"
                      onClick={() => {
                        useAppStore.getState().setActiveModule('projects');
                        useAppStore.getState().setSelectedProjectId(p.id);
                      }}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-brand-cyan" />
                          <div>
                            <p className="font-medium text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p._count?.tasks || 0} tasks
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.budget && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                              </p>
                              <Progress
                                value={(p.spent / p.budget) * 100}
                                className={`h-1.5 w-24 mt-1 ${
                                  p.spent / p.budget > 0.85
                                    ? '[&>div]:bg-brand-gold'
                                    : '[&>div]:bg-brand-cyan'
                                }`}
                              />
                            </div>
                          )}
                          <Badge className={`status-${p.status} text-xs`}>
                            {statusLabel(p.status)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="mt-4">
            {c.quotes.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No quotes yet for this client</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {c.quotes.map((q) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="glass-card">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{q.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(q.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold gradient-gold-text">
                            {formatCurrency(q.total)}
                          </span>
                          <Badge className={`status-${q.status} text-xs`}>
                            {statusLabel(q.status)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            {c.messages.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No messages yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {c.messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={`glass-card ${m.status === 'unread' ? 'glow-cyan' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{channelIcons[m.channel] || '📧'}</span>
                            <Badge variant="outline" className={`text-xs ${channelColors[m.channel] || ''}`}>
                              {m.channel}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {m.direction === 'inbound' ? '↓ In' : '↑ Out'}
                            </Badge>
                            {m.isAiGenerated && (
                              <Badge variant="outline" className="text-xs text-brand-cyan">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                        </div>
                        {m.subject && (
                          <p className="font-medium text-sm mb-1">{m.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{m.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            {c.activities.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <ActivityIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No activity recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative pl-6 space-y-0">
                {/* Timeline line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-brand-indigo/30" />
                {c.activities.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="relative pb-6"
                  >
                    {/* Dot */}
                    <div className={`absolute -left-[17px] top-1 h-3 w-3 rounded-full border-2 ${
                      a.type === 'milestone'
                        ? 'bg-brand-gold border-brand-gold'
                        : a.type === 'message'
                        ? 'bg-brand-cyan border-brand-cyan'
                        : 'bg-brand-indigo border-brand-indigo'
                    }`} />
                    <Card className="glass-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">{a.description}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDate(a.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="+356 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Budget Min (€)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="25000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Budget Max (€)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                  placeholder="Client preferences, notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.name || !formData.email}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                {submitting ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // LIST VIEW
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Clients</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} client{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const exportData = clients.map(c => ({
                name: c.name,
                email: c.email,
                phone: c.phone ?? '',
                city: c.city ?? '',
                country: c.country,
                status: c.status,
                source: c.source ?? '',
                budgetMin: c.budgetMin ?? '',
                budgetMax: c.budgetMax ?? '',
                createdAt: c.createdAt,
              }));
              exportToCSV(exportData, 'clients');
            }}
            disabled={clients.length === 0}
            className="border-brand-indigo/30 hover:bg-brand-indigo/20"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, email, city..."
            className="pl-9 bg-brand-surface-light border-brand-indigo/20"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-brand-surface-light border-brand-indigo/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
            const [field, order] = v.split('-');
            setSortField(field);
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger className="w-[150px] bg-brand-surface-light border-brand-indigo/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">No clients found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first client to get started'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={openAddDialog} className="bg-brand-indigo hover:bg-brand-indigo-light text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Card
                  className="glass-card card-shine glass-hover cursor-pointer rounded-xl transition-all group"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-indigo/30 border border-brand-indigo/30 flex items-center justify-center group-hover:border-brand-cyan/50 transition-colors">
                          <span className="text-sm font-bold text-brand-cyan">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm group-hover:text-brand-cyan transition-colors">
                            {client.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <Badge className={`status-${client.status} text-[10px]`}>
                        {statusLabel(client.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      {client.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          <span>{client.city}, {client.country}</span>
                        </div>
                      )}
                      {(client.budgetMin != null || client.budgetMax != null) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-brand-gold">€</span>
                          <span>
                            {formatCurrency(client.budgetMin)} — {formatCurrency(client.budgetMax)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-3 bg-brand-indigo/15" />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {client._count.projects}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {client._count.quotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {client._count.messages}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-brand-cyan transition-colors rotate-[-90deg]" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="+356 ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-city">City</Label>
                <Input
                  id="add-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="City"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-budgetMin">Budget Min (€)</Label>
                <Input
                  id="add-budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-budgetMax">Budget Max (€)</Label>
                <Input
                  id="add-budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Client preferences, notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.name || !formData.email}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
