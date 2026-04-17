'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Filter,
  TrendingUp,
  Wallet,
  Receipt,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ProjectInfo {
  id: string;
  name: string;
  budget: number | null;
}

interface ClientInfo {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  vendor: string | null;
  projectId: string | null;
  clientId: string | null;
  status: string;
  date: string;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: ProjectInfo | null;
  client: ClientInfo | null;
}

interface ExpenseSummary {
  totalExpenses: number;
  pendingTotal: number;
  pendingCount: number;
  paidTotal: number;
  approvedTotal: number;
  paidThisMonth: number;
  totalBudget: number;
  totalSpent: number;
  byCategory: { category: string; total: number; count: number }[];
  byStatus: { status: string; total: number; count: number }[];
  monthlyBreakdown: { month: string; total: number }[];
}

// Constants
const CATEGORIES = [
  { value: 'materials', label: 'Materials', emoji: '🧱' },
  { value: 'labor', label: 'Labor', emoji: '👷' },
  { value: 'furniture', label: 'Furniture', emoji: '🪑' },
  { value: 'shipping', label: 'Shipping', emoji: '📦' },
  { value: 'misc', label: 'Misc', emoji: '📎' },
] as const;

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', icon: CheckCircle2, label: 'Approved' },
  paid: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Wallet, label: 'Paid' },
  reimbursed: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Receipt, label: 'Reimbursed' },
};

const CATEGORY_COLORS: Record<string, string> = {
  materials: '#3A0CA3',
  labor: '#00F5D4',
  furniture: '#D4AF37',
  shipping: '#7C3AED',
  misc: '#64748B',
};

const CHART_COLORS = ['#3A0CA3', '#00F5D4', '#D4AF37', '#7C3AED', '#64748B', '#EC4899'];

const categoryLabel = (c: string) => {
  const found = CATEGORIES.find((cat) => cat.value === c);
  return found ? `${found.emoji} ${found.label}` : c;
};

const categoryEmoji = (c: string) => {
  const found = CATEGORIES.find((cat) => cat.value === c);
  return found ? found.emoji : '📎';
};

const statusLabel = (s: string) => STATUS_CONFIG[s]?.label || s;

const formatCurrency = (n: number) => `€${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Animated counter component
function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = display;
    const end = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{display.toLocaleString('en-US')}</span>;
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs border border-border/30 shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: €{entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function ExpensesModule() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'materials',
    vendor: '',
    projectId: '',
    clientId: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch projects & clients for dropdowns
  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([projectsData, clientsData]) => {
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.projects || []);
      setClients(Array.isArray(clientsData) ? clientsData : clientsData.clients || []);
    }).catch(() => {});
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch expense summary:', err);
    }
  }, []);

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (projectFilter !== 'all') params.set('projectId', projectFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, projectFilter, search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    else if (sortBy === 'amount') cmp = a.amount - b.amount;
    else cmp = a.category.localeCompare(b.category);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  // Toggle sort
  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  // Dialog handlers
  const openAddDialog = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: 0,
      category: 'materials',
      vendor: '',
      projectId: '',
      clientId: '',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      vendor: expense.vendor || '',
      projectId: expense.projectId || '',
      clientId: expense.clientId || '',
      status: expense.status,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.description || formData.amount <= 0) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        vendor: formData.vendor || undefined,
        projectId: formData.projectId || undefined,
        clientId: formData.clientId || undefined,
        notes: formData.notes || undefined,
      };

      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Expense updated successfully');
          fetchExpenses();
          fetchSummary();
        } else {
          toast.error('Failed to update expense');
        }
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Expense created successfully');
          fetchExpenses();
          fetchSummary();
        } else {
          toast.error('Failed to create expense');
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save expense:', err);
      toast.error('Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted');
        fetchExpenses();
        fetchSummary();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      toast.error('Failed to delete expense');
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
      setDeletingExpense(null);
    }
  };

  // Quick status change
  const changeStatus = async (expense: Expense, newStatus: string) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Expense marked as ${statusLabel(newStatus)}`);
        fetchExpenses();
        fetchSummary();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Budget utilization for selected project
  const selectedProjectData = projectFilter !== 'all'
    ? projects.find((p) => p.id === projectFilter)
    : null;

  // Project expense total for budget progress
  const projectExpenseTotal = projectFilter !== 'all'
    ? expenses.reduce((sum, e) => sum + e.amount, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-indigo/15 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-brand-cyan" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Financial Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Manage expenses, approvals, and budget utilization
          </p>
        </div>
        <div className="gradient-line flex-1" />
      </div>

      {/* Financial Overview Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card card-shine rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Total Expenses</span>
                <DollarSign className="h-4 w-4 text-brand-indigo" />
              </div>
              <p className="text-2xl font-bold font-['Space_Grotesk']">
                <AnimatedCounter value={summary?.totalExpenses || 0} prefix="€" />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card card-shine rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Pending Approval</span>
                <AlertCircle className="h-4 w-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold font-['Space_Grotesk']">
                <AnimatedCounter value={summary?.pendingCount || 0} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                €{(summary?.pendingTotal || 0).toLocaleString()} total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card card-shine rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Paid This Month</span>
                <Wallet className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold font-['Space_Grotesk']">
                <AnimatedCounter value={summary?.paidThisMonth || 0} prefix="€" />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Approved: €{(summary?.approvedTotal || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card card-shine rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Budget Utilization</span>
                <TrendingUp className="h-4 w-4 text-brand-gold" />
              </div>
              <p className="text-2xl font-bold font-['Space_Grotesk']">
                {summary?.totalBudget ? Math.round((summary.totalSpent / summary.totalBudget) * 100) : 0}%
              </p>
              <div className="w-full bg-brand-surface-light rounded-full h-1.5 mt-2">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-brand-cyan to-brand-gold transition-all"
                  style={{ width: `${Math.min(summary?.totalBudget ? (summary.totalSpent / summary.totalBudget) * 100 : 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Project Budget Progress (when project filter is active) */}
      {selectedProjectData && (() => {
        const proj = expenses[0]?.project;
        const budget = proj?.budget || 0;
        const pct = budget > 0 ? Math.min(Math.round((projectExpenseTotal / budget) * 100), 100) : 0;
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card card-shine rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium font-['Space_Grotesk']">
                      Project: {selectedProjectData.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Budget vs Expenses
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-['Space_Grotesk']">
                      {formatCurrency(projectExpenseTotal)} / {formatCurrency(budget)}
                    </p>
                    <p className="text-xs text-muted-foreground">{pct}% utilized</p>
                  </div>
                </div>
                <div className="w-full bg-brand-surface-light rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-brand-gold' : 'bg-gradient-to-r from-brand-cyan to-brand-indigo'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* Financial Charts Section */}
      {summary && (summary.monthlyBreakdown.length > 0 || summary.byCategory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Expense Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card card-shine rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-['Space_Grotesk'] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-brand-cyan" />
                  Monthly Expense Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthlyBreakdown} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="total" name="Expenses" radius={[6, 6, 0, 0]}>
                        {summary.monthlyBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown Donut Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card card-shine rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-['Space_Grotesk'] flex items-center gap-2">
                  <Filter className="h-4 w-4 text-brand-gold" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.byCategory}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {summary.byCategory.map((entry, i) => (
                          <Cell
                            key={entry.category}
                            fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[i % CHART_COLORS.length]}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`€${value.toLocaleString()}`, '']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 10, 40, 0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                  {summary.byCategory.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748B' }}
                      />
                      <span className="text-muted-foreground truncate">
                        {categoryEmoji(cat.category)} {cat.category}
                      </span>
                      <span className="ml-auto text-foreground font-medium">
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Expense List Section */}
      <div className="space-y-4">
        {/* List Header with Search & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold font-['Space_Grotesk']">Expenses</h3>
            <Badge variant="outline" className="text-[10px] border-brand-cyan/30 text-brand-cyan">
              {expenses.length} items
            </Badge>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Expense
          </Button>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses by description, vendor, notes..."
              className="pl-9 bg-brand-surface-light border-brand-indigo/20"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px] bg-brand-surface-light border-brand-indigo/20 text-xs h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] bg-brand-surface-light border-brand-indigo/20 text-xs h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[150px] bg-brand-surface-light border-brand-indigo/20 text-xs h-9">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpDown className="h-3 w-3" />
          <span>Sort by:</span>
          {(['date', 'amount', 'category'] as const).map((field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-2 py-0.5 rounded transition-colors capitalize ${
                sortBy === field
                  ? 'bg-brand-indigo/20 text-brand-cyan'
                  : 'hover:bg-brand-surface-light'
              }`}
            >
              {field}
              {sortBy === field && (
                <ChevronDown className={`h-3 w-3 inline ml-0.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </button>
          ))}
          {(categoryFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all' || search) && (
            <button
              onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setProjectFilter('all'); setSearch(''); }}
              className="ml-auto flex items-center gap-1 text-brand-cyan hover:text-brand-cyan/80"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Expense Table / Cards */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="glass-card rounded-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedExpenses.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <DollarSign className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">
                No expenses found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || categoryFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first expense to get started'}
              </p>
              {!search && categoryFilter === 'all' && statusFilter === 'all' && projectFilter === 'all' && (
                <Button
                  onClick={openAddDialog}
                  className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Expense
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {sortedExpenses.map((expense, i) => {
                const statusCfg = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                  >
                    <Card className="glass-card glass-hover rounded-xl transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                          {/* Category Icon */}
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: `${CATEGORY_COLORS[expense.category] || '#64748B'}20` }}
                          >
                            {categoryEmoji(expense.category)}
                          </div>

                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate group-hover:text-brand-cyan transition-colors">
                                {expense.description}
                              </p>
                              <Badge className={`${statusCfg.color} text-[10px] border`}>
                                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                                {statusCfg.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              {expense.vendor && <span>Vendor: {expense.vendor}</span>}
                              {expense.project && <span>Project: {expense.project.name}</span>}
                              {expense.client && <span>Client: {expense.client.name}</span>}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(expense.date)}
                              </span>
                            </div>
                          </div>

                          {/* Amount & Actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            <p className="text-lg font-bold font-['Space_Grotesk'] whitespace-nowrap">
                              {formatCurrency(expense.amount)}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {expense.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    onClick={() => changeStatus(expense, 'approved')}
                                  >
                                    Approve
                                  </Button>
                                </>
                              )}
                              {expense.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                  onClick={() => changeStatus(expense, 'paid')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                              {expense.status === 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                  onClick={() => changeStatus(expense, 'reimbursed')}
                                >
                                  Reimbursed
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-brand-cyan"
                                onClick={() => openEditDialog(expense)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                                onClick={() => { setDeletingExpense(expense); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description *</Label>
              <Input
                id="exp-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="e.g., Carrara marble slab procurement"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-amount">Amount (€) *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-vendor">Vendor</Label>
                <Input
                  id="exp-vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="e.g., Marmi Italiani S.r.l."
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={formData.projectId || '_none'} onValueChange={(v) => setFormData({ ...formData, projectId: v === '_none' ? '' : v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={formData.clientId || '_none'} onValueChange={(v) => setFormData({ ...formData, clientId: v === '_none' ? '' : v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-notes">Notes</Label>
              <Textarea
                id="exp-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.description || formData.amount <= 0}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting
                ? 'Saving...'
                : editingExpense
                ? 'Update Expense'
                : 'Create Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeletingExpense(null); }}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &ldquo;{deletingExpense?.description}&rdquo; (€{(deletingExpense?.amount || 0).toLocaleString()})? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setDeleteDialogOpen(false); setDeletingExpense(null); }}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
