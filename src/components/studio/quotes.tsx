'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  Check,
  X,
  Eye,
  Edit3,
  Download,
  ArrowLeft,
  Trash2,
  Crown,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface LineItem {
  name: string;
  qty: number;
  price: number;
}

interface Quote {
  id: string;
  title: string;
  clientId: string;
  projectId: string | null;
  status: string;
  tier: string;
  items: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; email: string };
  project: { id: string; name: string } | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'revision';

const statusConfig: Record<QuoteStatus, { label: string; class: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', class: 'status-draft', icon: <Edit3 className="h-3 w-3" /> },
  sent: { label: 'Sent', class: 'status-sent', icon: <Send className="h-3 w-3" /> },
  viewed: { label: 'Viewed', class: 'status-unread', icon: <Eye className="h-3 w-3" /> },
  accepted: { label: 'Accepted', class: 'status-accepted', icon: <Check className="h-3 w-3" /> },
  rejected: { label: 'Rejected', class: 'status-rejected', icon: <X className="h-3 w-3" /> },
  revision: { label: 'Revision', class: 'status-planning', icon: <Edit3 className="h-3 w-3" /> },
};

const tierConfig: Record<string, { label: string; color: string; accent: string; glow: string; icon: React.ReactNode }> = {
  good: {
    label: 'Good',
    color: 'text-brand-indigo',
    accent: 'border-brand-indigo/40',
    glow: 'glow-indigo',
    icon: <Star className="h-4 w-4" />,
  },
  better: {
    label: 'Better',
    color: 'text-brand-cyan',
    accent: 'border-brand-cyan/40',
    glow: 'glow-cyan',
    icon: <Sparkles className="h-4 w-4" />,
  },
  best: {
    label: 'Best',
    color: 'text-brand-gold',
    accent: 'border-brand-gold/40',
    glow: 'glow-gold',
    icon: <Crown className="h-4 w-4" />,
  },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR' }).format(amount);

const parseItems = (itemsStr: string): LineItem[] => {
  try {
    return JSON.parse(itemsStr);
  } catch {
    return [];
  }
};

export default function QuotesModule() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // New quote form state
  const [formTitle, setFormTitle] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formTier, setFormTier] = useState('good');
  const [formItems, setFormItems] = useState<LineItem[]>([{ name: '', qty: 1, price: 0 }]);
  const [formNotes, setFormNotes] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const [quotesRes, clientsRes, projectsRes] = await Promise.all([
        fetch(`/api/quotes?${params.toString()}`),
        fetch('/api/clients'),
        fetch('/api/projects'),
      ]);

      const quotesData = await quotesRes.json();
      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();

      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Quote marked as ${status}`);
      if (selectedQuote?.id === quoteId) {
        const updated = await res.json();
        setSelectedQuote(updated);
      }
      fetchData();
    } catch {
      toast.error('Failed to update quote status');
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormClientId('');
    setFormProjectId('');
    setFormTier('good');
    setFormItems([{ name: '', qty: 1, price: 0 }]);
    setFormNotes('');
    setFormValidUntil('');
  };

  const calculateTotals = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmitQuote = async (isEdit: boolean) => {
    if (!formTitle || !formClientId) {
      toast.error('Please fill in title and select a client');
      return;
    }
    const validItems = formItems.filter((i) => i.name && i.price > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    try {
      setFormLoading(true);
      const url = isEdit ? `/api/quotes/${selectedQuote?.id}` : '/api/quotes';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        title: formTitle,
        clientId: formClientId,
        projectId: formProjectId || null,
        tier: formTier,
        items: validItems,
        notes: formNotes,
        validUntil: formValidUntil || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      toast.success(isEdit ? 'Quote updated' : 'Quote created');
      setShowNewDialog(false);
      setShowEditDialog(false);
      resetForm();
      fetchData();
    } catch {
      toast.error('Failed to save quote');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (quote: Quote) => {
    const items = parseItems(quote.items);
    setFormTitle(quote.title);
    setFormClientId(quote.clientId);
    setFormProjectId(quote.projectId || '');
    setFormTier(quote.tier);
    setFormItems(items.length > 0 ? items : [{ name: '', qty: 1, price: 0 }]);
    setFormNotes(quote.notes || '');
    setFormValidUntil(quote.validUntil ? quote.validUntil.split('T')[0] : '');
    setShowEditDialog(true);
  };

  // Group quotes by project+title for tier comparison
  const getTierGroup = (quote: Quote): Quote[] => {
    if (!quote.projectId) return [quote];
    return quotes.filter(
      (q) =>
        q.projectId === quote.projectId &&
        q.title === quote.title &&
        q.clientId === quote.clientId
    );
  };

  const filteredProjects = formClientId
    ? projects.filter((p) => p.clientId === formClientId)
    : projects;

  // Skeleton loading
  if (loading && quotes.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-brand-surface-light" />
          <div className="h-10 w-32 animate-pulse rounded bg-brand-surface-light" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-brand-surface-light"
          />
        ))}
      </div>
    );
  }

  // Detail view
  if (selectedQuote) {
    const tierGroup = getTierGroup(selectedQuote);
    const items = parseItems(selectedQuote.items);
    const hasMultipleTiers = tierGroup.length > 1;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedQuote(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-['Space_Grotesk']">
              {selectedQuote.title}
            </h2>
            <p className="text-muted-foreground text-sm">
              {selectedQuote.client.name} • {selectedQuote.project?.name || 'No project'}
            </p>
          </div>
          <Badge className={statusConfig[selectedQuote.status as QuoteStatus]?.class || 'status-draft'}>
            {statusConfig[selectedQuote.status as QuoteStatus]?.icon}
            <span className="ml-1">{statusConfig[selectedQuote.status as QuoteStatus]?.label || selectedQuote.status}</span>
          </Badge>
          <Badge
            variant="outline"
            className={`${tierConfig[selectedQuote.tier]?.accent} ${tierConfig[selectedQuote.tier]?.color}`}
          >
            {tierConfig[selectedQuote.tier]?.icon}
            <span className="ml-1">{tierConfig[selectedQuote.tier]?.label}</span>
          </Badge>
        </div>

        {/* Tier Comparison */}
        {hasMultipleTiers && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['good', 'better', 'best'].map((tier) => {
              const tierQuote = tierGroup.find((q) => q.tier === tier);
              if (!tierQuote) return null;
              const tierItems = parseItems(tierQuote.items);
              const config = tierConfig[tier];
              const isSelected = tierQuote.id === selectedQuote.id;

              return (
                <motion.div
                  key={tier}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedQuote(tierQuote)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? `${config.accent} ${config.glow} bg-brand-surface-light`
                      : 'border-border bg-brand-surface-light/50 hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-2 ${config.color}`}>
                      {config.icon}
                      <span className="font-semibold font-['Space_Grotesk']">
                        {config.label}
                      </span>
                    </div>
                    {tier === 'best' && (
                      <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-xs">
                        <Crown className="h-3 w-3 mr-1" /> Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    {tierItems.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <span>{item.name}</span>
                      </div>
                    ))}
                    {tierItems.length > 3 && (
                      <div className="text-xs">+{tierItems.length - 3} more items</div>
                    )}
                  </div>
                  <Separator className="bg-border/30 mb-2" />
                  <div className={`text-lg font-bold ${config.color} font-['Space_Grotesk']`}>
                    {formatCurrency(tierQuote.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">incl. 18% VAT</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Line Items Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-['Space_Grotesk'] flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-cyan" /> Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Item</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Qty</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Unit Price</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-border/10">
                      <td className="py-3 px-2">{item.name}</td>
                      <td className="py-3 px-2 text-center">{item.qty}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-end gap-1 pt-4">
            <div className="flex gap-8 text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium w-28 text-right">{formatCurrency(selectedQuote.subtotal)}</span>
            </div>
            <div className="flex gap-8 text-sm">
              <span className="text-muted-foreground">Tax (18% Malta VAT):</span>
              <span className="font-medium w-28 text-right">{formatCurrency(selectedQuote.tax)}</span>
            </div>
            <Separator className="bg-border/30 my-1 w-full max-w-64" />
            <div className="flex gap-8 text-base">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-brand-cyan w-28 text-right">
                {formatCurrency(selectedQuote.total)}
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Notes */}
        {selectedQuote.notes && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-['Space_Grotesk'] text-muted-foreground">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{selectedQuote.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {selectedQuote.status === 'draft' && (
            <Button
              onClick={() => updateQuoteStatus(selectedQuote.id, 'sent')}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              <Send className="h-4 w-4 mr-2" /> Mark as Sent
            </Button>
          )}
          {selectedQuote.status === 'sent' && (
            <>
              <Button
                onClick={() => updateQuoteStatus(selectedQuote.id, 'viewed')}
                variant="outline"
                className="border-brand-cyan/30 text-brand-cyan"
              >
                <Eye className="h-4 w-4 mr-2" /> Mark as Viewed
              </Button>
              <Button
                onClick={() => updateQuoteStatus(selectedQuote.id, 'accepted')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" /> Mark as Accepted
              </Button>
              <Button
                onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                variant="outline"
                className="border-destructive/30 text-destructive"
              >
                <X className="h-4 w-4 mr-2" /> Mark as Rejected
              </Button>
            </>
          )}
          {selectedQuote.status === 'viewed' && (
            <>
              <Button
                onClick={() => updateQuoteStatus(selectedQuote.id, 'accepted')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" /> Mark as Accepted
              </Button>
              <Button
                onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                variant="outline"
                className="border-destructive/30 text-destructive"
              >
                <X className="h-4 w-4 mr-2" /> Mark as Rejected
              </Button>
            </>
          )}
          {(selectedQuote.status === 'accepted' || selectedQuote.status === 'rejected') && (
            <Button
              onClick={() => updateQuoteStatus(selectedQuote.id, 'revision')}
              variant="outline"
              className="border-brand-indigo/30"
            >
              <Edit3 className="h-4 w-4 mr-2" /> Request Revision
            </Button>
          )}
          <Button
            onClick={() => {
              toast.success('PDF generation would be triggered here');
            }}
            variant="outline"
            className="border-brand-gold/30 text-brand-gold"
          >
            <Download className="h-4 w-4 mr-2" /> Generate PDF
          </Button>
          <Button
            onClick={() => openEditDialog(selectedQuote)}
            variant="outline"
          >
            <Edit3 className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Quotes & Proposals</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Good/Better/Best tier proposals
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowNewDialog(true);
          }}
          className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> New Quote
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-brand-surface-light/50 border-border/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-brand-surface-light/50 border-border/30">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revision">Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold font-['Space_Grotesk']">No quotes found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first quote to get started
          </p>
          <Button
            onClick={() => {
              resetForm();
              setShowNewDialog(true);
            }}
            className="mt-4 bg-brand-indigo hover:bg-brand-indigo-light text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Quote
          </Button>
        </motion.div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="space-y-3">
            <AnimatePresence>
              {quotes.map((quote, index) => {
                const tierCfg = tierConfig[quote.tier] || tierConfig.good;
                const statusCfg = statusConfig[quote.status as QuoteStatus] || statusConfig.draft;
                return (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedQuote(quote)}
                    className="cursor-pointer"
                  >
                    <Card className="glass-card hover:border-brand-indigo/30 transition-all hover:glow-indigo">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-lg bg-brand-surface ${tierCfg.color}`}>
                            {tierCfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold font-['Space_Grotesk'] truncate">
                                {quote.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${tierCfg.accent} ${tierCfg.color} text-xs shrink-0`}
                              >
                                {tierCfg.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {quote.client.name} • {quote.project?.name || 'No project'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold font-['Space_Grotesk'] text-brand-cyan">
                              {formatCurrency(quote.total)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(quote.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <Badge className={statusCfg.class}>
                            {statusCfg.icon}
                            <span className="ml-1">{statusCfg.label}</span>
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* New/Edit Quote Dialog */}
      <Dialog
        open={showNewDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewDialog(false);
            setShowEditDialog(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] text-xl">
              {showEditDialog ? 'Edit Quote' : 'New Quote'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="quote-title">Quote Title</Label>
              <Input
                id="quote-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Villa Aurora - Living Areas"
                className="bg-brand-surface-light/50 border-border/30"
              />
            </div>

            {/* Client & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formClientId} onValueChange={(val) => {
                  setFormClientId(val);
                  setFormProjectId('');
                }}>
                  <SelectTrigger className="bg-brand-surface-light/50 border-border/30">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger className="bg-brand-surface-light/50 border-border/30">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {filteredProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tier */}
            <div className="space-y-2">
              <Label>Tier</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['good', 'better', 'best'] as const).map((tier) => {
                  const cfg = tierConfig[tier];
                  const isSelected = formTier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setFormTier(tier)}
                      className={`rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? `${cfg.accent} ${cfg.glow} bg-brand-surface-light`
                          : 'border-border/30 bg-brand-surface-light/30 hover:border-border/60'
                      }`}
                    >
                      <div className={`flex items-center justify-center gap-1 mb-1 ${isSelected ? cfg.color : 'text-muted-foreground'}`}>
                        {cfg.icon}
                        <span className="font-semibold text-sm">{cfg.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormItems([...formItems, { name: '', qty: 1, price: 0 }])}
                  className="text-brand-cyan hover:text-brand-cyan-dark"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {formItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Name</Label>}
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[i] = { ...newItems[i], name: e.target.value };
                        setFormItems(newItems);
                      }}
                      placeholder="Item name"
                      className="bg-brand-surface-light/50 border-border/30 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[i] = { ...newItems[i], qty: parseInt(e.target.value) || 1 };
                        setFormItems(newItems);
                      }}
                      className="bg-brand-surface-light/50 border-border/30 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Unit Price (€)</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...formItems];
                        newItems[i] = { ...newItems[i], price: parseFloat(e.target.value) || 0 };
                        setFormItems(newItems);
                      }}
                      className="bg-brand-surface-light/50 border-border/30 text-sm"
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Total</Label>}
                    {formatCurrency(item.qty * item.price)}
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <div className="h-5" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormItems(formItems.filter((_, idx) => idx !== i))}
                      disabled={formItems.length <= 1}
                      className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t border-border/30 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(calculateTotals(formItems).subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (18% Malta VAT):</span>
                  <span>{formatCurrency(calculateTotals(formItems).tax)}</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-brand-cyan">
                    {formatCurrency(calculateTotals(formItems).total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label htmlFor="valid-until">Valid Until</Label>
              <Input
                id="valid-until"
                type="date"
                value={formValidUntil}
                onChange={(e) => setFormValidUntil(e.target.value)}
                className="bg-brand-surface-light/50 border-border/30"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Additional notes for the client..."
                rows={3}
                className="bg-brand-surface-light/50 border-border/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmitQuote(showEditDialog)}
              disabled={formLoading}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {formLoading ? 'Saving...' : showEditDialog ? 'Update Quote' : 'Create Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
