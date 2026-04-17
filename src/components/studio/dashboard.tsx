'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
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
  FolderKanban,
  Users,
  Inbox,
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Star,
  Zap,
  X,
  Sparkles,
  BarChart3,
  Megaphone,
  Calendar,
  Truck,
  Eye,
  Palette,
  UsersRound,
  Ticket,
  ShoppingCart,
  ExternalLink,
  ThumbsUp,
  Target,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore, type ActiveModule } from '@/lib/store';
import { toast } from 'sonner';

interface DashboardData {
  totalClients: number;
  activeClients: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalQuotes: number;
  acceptedQuotesValue: number;
  unreadMessages: number;
  totalRevenue: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    budget: number | null;
    spent: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

/* ─── Static Announcements Data ─── */
interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: AnnouncementCategory;
  isNew?: boolean;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'New fabric catalog from Italy available',
    description: 'Brenta Fabrics 2026 collection now in our sample library. Request swatches through Procurement.',
    date: '2026-03-04',
    category: 'Design' as const,
    isNew: true,
  },
  {
    id: '2',
    title: 'Team meeting scheduled for Friday',
    description: 'All-hands design review at 10:00 AM. Bring updated mood boards for Valletta penthouse project.',
    date: '2026-03-06',
    category: 'Team' as const,
    isNew: true,
  },
  {
    id: '3',
    title: 'Malta Design Week 2026 registration open',
    description: 'Early-bird passes available until March 20. Studio gets 3 complimentary VIP tickets.',
    date: '2026-03-03',
    category: 'Events' as const,
  },
  {
    id: '4',
    title: 'Q2 supplier discount negotiated with Lumière Lighting',
    description: '12% off all orders through June. Updated pricing now reflected in procurement catalog.',
    date: '2026-03-02',
    category: 'Procurement' as const,
  },
];

type AnnouncementCategory = 'Design' | 'Team' | 'Events' | 'Procurement';

function getCategoryStyle(category: AnnouncementCategory) {
  const styles: Record<AnnouncementCategory, { badge: string; icon: React.ReactNode; border: string }> = {
    Design: {
      badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/20',
      icon: <Palette className="h-3 w-3" />,
      border: 'border-l-brand-cyan',
    },
    Team: {
      badge: 'bg-brand-indigo/15 text-brand-indigo-light border-brand-indigo/20',
      icon: <UsersRound className="h-3 w-3" />,
      border: 'border-l-brand-indigo',
    },
    Events: {
      badge: 'bg-brand-gold/15 text-brand-gold border-brand-gold/20',
      icon: <Ticket className="h-3 w-3" />,
      border: 'border-l-brand-gold',
    },
    Procurement: {
      badge: 'bg-green-500/15 text-green-400 border-green-500/20',
      icon: <ShoppingCart className="h-3 w-3" />,
      border: 'border-l-green-500',
    },
  };
  return styles[category];
}

/* ─── Static Schedule Data ─── */
const UPCOMING_SCHEDULE = [
  {
    id: 's1',
    time: '09:00',
    title: 'Client consultation — Sliema apartment',
    type: 'Meeting' as const,
  },
  {
    id: 's2',
    time: '11:30',
    title: 'Mood board review deadline',
    type: 'Deadline' as const,
  },
  {
    id: 's3',
    time: '14:00',
    title: 'Furniture delivery — Valletta penthouse',
    type: 'Delivery' as const,
  },
  {
    id: 's4',
    time: '16:00',
    title: 'Design review — Gozbo villa renovation',
    type: 'Review' as const,
  },
  {
    id: 's5',
    time: '17:30',
    title: 'Supplier call — Lumière Lighting Q2 terms',
    type: 'Meeting' as const,
  },
];

type ScheduleType = 'Meeting' | 'Deadline' | 'Delivery' | 'Review';

function getScheduleBorder(type: ScheduleType): string {
  const colors: Record<ScheduleType, string> = {
    Meeting: 'border-l-brand-indigo',
    Deadline: 'border-l-red-500',
    Delivery: 'border-l-brand-cyan',
    Review: 'border-l-brand-gold',
  };
  return colors[type];
}

function getScheduleIcon(type: ScheduleType): React.ReactNode {
  const icons: Record<ScheduleType, React.ReactNode> = {
    Meeting: <UsersRound className="h-3.5 w-3.5 text-brand-indigo-light" />,
    Deadline: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
    Delivery: <Truck className="h-3.5 w-3.5 text-brand-cyan" />,
    Review: <Eye className="h-3.5 w-3.5 text-brand-gold" />,
  };
  return icons[type];
}

function getScheduleBadge(type: ScheduleType): string {
  const styles: Record<ScheduleType, string> = {
    Meeting: 'bg-brand-indigo/15 text-brand-indigo-light',
    Deadline: 'bg-red-500/15 text-red-400',
    Delivery: 'bg-brand-cyan/15 text-brand-cyan',
    Review: 'bg-brand-gold/15 text-brand-gold',
  };
  return styles[type];
}

/* ─── Brand Colors for Charts ─── */
const BRAND_COLORS = {
  indigo: '#3A0CA3',
  cyan: '#00F5D4',
  gold: '#D4AF37',
};

const PIE_COLORS: Record<string, string> = {
  planning: '#3A0CA3',
  design: '#5A2DC8',
  procurement: '#00F5D4',
  execution: '#D4AF37',
  completion: '#22C55E',
  delivered: '#00B4D8',
};

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { name: string };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'message': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'milestone': return <CheckCircle2 className="h-3.5 w-3.5" />;
    case 'quote': return <FileText className="h-3.5 w-3.5" />;
    case 'note': return <Activity className="h-3.5 w-3.5" />;
    case 'created': return <Plus className="h-3.5 w-3.5" />;
    default: return <Activity className="h-3.5 w-3.5" />;
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'message': return 'bg-brand-cyan/20 text-brand-cyan';
    case 'milestone': return 'bg-brand-gold/20 text-brand-gold';
    case 'quote': return 'bg-brand-indigo/20 text-brand-indigo-light';
    case 'note': return 'bg-purple-500/20 text-purple-400';
    case 'created': return 'bg-green-500/20 text-green-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getActivityDotColor(type: string): string {
  switch (type) {
    case 'message': return 'border-brand-cyan bg-brand-cyan/30';
    case 'milestone': return 'border-brand-gold bg-brand-gold/30';
    case 'quote': return 'border-brand-indigo-light bg-brand-indigo-light/30';
    case 'note': return 'border-purple-400 bg-purple-400/30';
    case 'created': return 'border-green-400 bg-green-400/30';
    default: return 'border-muted-foreground bg-muted-foreground/30';
  }
}

/* ─── Animated Number Counter ─── */
function AnimatedNumber({ value, format = 'number' }: { value: number; format?: 'number' | 'currency' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (format === 'currency') {
    return <span className="animate-count">{formatCurrency(display)}</span>;
  }
  return <span className="animate-count">{display}</span>;
}

/* ─── Micro Sparkline (CSS bars for KPI cards) ─── */
function MicroSparkline({ data, color = '#00F5D4' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-5">
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-sm min-w-[3px]"
          style={{
            height: `${Math.max((v / max) * 100, 15)}%`,
            width: 4,
            backgroundColor: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Onboarding Banner (minimized) ─── */
function OnboardingBanner() {
  const { setActiveModule } = useAppStore();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tanti-onboarding-dismissed') === 'true';
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tanti-onboarding-dismissed', 'true');
  };

  if (dismissed) return null;

  const steps = [
    { num: 1, label: 'Add Clients', icon: <Users className="h-4 w-4" />, module: 'clients' as ActiveModule, color: 'from-brand-gold to-amber-400', done: true },
    { num: 2, label: 'Create Projects', icon: <FolderKanban className="h-4 w-4" />, module: 'projects' as ActiveModule, color: 'from-brand-indigo to-brand-indigo-light', done: true },
    { num: 3, label: 'Send Quotes', icon: <FileText className="h-4 w-4" />, module: 'quotes' as ActiveModule, color: 'from-brand-cyan to-brand-cyan-dark', done: false },
    { num: 4, label: 'Enable AI', icon: <Sparkles className="h-4 w-4" />, module: 'ai-design' as ActiveModule, color: 'from-purple-500 to-pink-500', done: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 border border-border/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo/10 via-transparent to-brand-cyan/10 pointer-events-none" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {steps.map((step, idx) => (
            <button
              key={step.num}
              onClick={() => setActiveModule(step.module)}
              className="flex items-center gap-2 group"
            >
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform ${step.done ? 'opacity-70' : ''}`}>
                {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.icon}
              </div>
              <span className="text-[11px] font-medium group-hover:text-brand-cyan transition-colors hidden sm:inline">{step.label}</span>
              {idx < steps.length - 1 && (
                <div className="w-4 border-t border-dashed border-border/40 hidden sm:block" />
              )}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Live Clock ─── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono text-xs text-muted-foreground">
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function DashboardModule() {
  const { setActiveModule } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, tasksRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/tasks'),
      ]);
      const dashData = await dashRes.json();
      const tasksData = await tasksRes.json();
      setData(dashData);
      setTasks((tasksData.tasks || tasksData || []).slice(0, 5));
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Welcome toast — once per session
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('tanti-welcome-toast')) {
      sessionStorage.setItem('tanti-welcome-toast', '1');
      toast.success('Welcome back to StudioOS!', {
        description: 'You have 8 unread messages and 2 tasks due today.',
      });
    }
  }, []);

  const dismissAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-6 shimmer">
              <div className="h-4 w-20 bg-muted/30 rounded mb-3" />
              <div className="h-8 w-28 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-xl p-6 shimmer h-80" />
          <div className="glass-card rounded-xl p-6 shimmer h-80" />
        </div>
      </div>
    );
  }

  const projectStatuses = ['planning', 'design', 'procurement', 'execution', 'completion', 'delivered'];
  const totalPipelineProjects = projectStatuses.reduce((sum, s) => sum + (data.projectsByStatus[s] || 0), 0);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  /* Mock sparkline data for KPI cards */
  const revenueSparkline = [28, 35, 32, 42, 38, 48, 54];
  const projectsSparkline = [5, 6, 5, 7, 8, 7, 8];
  const clientsSparkline = [9, 10, 11, 11, 12, 13, 13];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6 dashboard-bg"
    >
      {/* ─── Hero Welcome Section ─── */}
      <motion.div variants={itemVariants}>
        <div className="dot-pattern relative rounded-2xl overflow-hidden p-8 -m-6 mb-0">
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 via-transparent to-brand-cyan/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-gold/5 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-['Space_Grotesk'] shimmer-text">
                Welcome back to StudioOS
              </h2>
              <div className="gradient-line w-64 mt-2" />
              <p className="text-muted-foreground mt-3 text-sm">
                <span className="text-brand-cyan font-semibold">Tanti Admin</span> • {today}
              </p>
              {/* Quick stats row */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="h-3.5 w-3.5 text-brand-cyan" />
                  <span className="font-semibold">{data.totalClients}</span>
                  <span className="text-muted-foreground text-xs">Clients</span>
                </div>
                <span className="text-border/40">•</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <FolderKanban className="h-3.5 w-3.5 text-brand-indigo-light" />
                  <span className="font-semibold">{data.totalProjects}</span>
                  <span className="text-muted-foreground text-xs">Projects</span>
                </div>
                <span className="text-border/40">•</span>
                <div className="flex items-center gap-1.5 text-sm">
                  <DollarSign className="h-3.5 w-3.5 text-brand-gold" />
                  <span className="font-semibold sparkle-text">{formatCurrency(data.acceptedQuotesValue || data.totalRevenue || 0)}</span>
                  <span className="text-muted-foreground text-xs">Revenue</span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex gap-2">
              <Button
                size="sm"
                onClick={() => setActiveModule('ai-design')}
                className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" /> AI Assistant
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveModule('projects')}
                className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Project
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Onboarding Banner (minimized) */}
      <motion.div variants={itemVariants}>
        <OnboardingBanner />
      </motion.div>

      {/* Today's Focus Card */}
      <motion.div variants={itemVariants}>
        <Card className="glass-card glow-border border-brand-gold/20 rounded-xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-gold to-amber-400 flex items-center justify-center shrink-0 float-animation">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-medium text-brand-gold uppercase tracking-wider">Today's Focus</p>
                <span className="h-1 w-1 rounded-full bg-brand-gold" />
                <p className="text-xs text-muted-foreground">Urgent</p>
              </div>
              <p className="text-sm font-medium truncate">{tasks.length > 0 ? tasks[0].title : 'No urgent tasks today'}</p>
              {tasks.length > 0 && tasks[0].project && (
                <p className="text-xs text-muted-foreground mt-0.5">{tasks[0].project.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tasks.length > 0 && tasks[0].dueDate && (
                <Badge variant="outline" className="urgency-bg-warning text-brand-gold text-[10px] border-0">
                  Due {new Date(tasks[0].dueDate).toLocaleDateString()}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveModule('projects')}
                className="text-brand-cyan hover:text-brand-cyan text-xs"
              >
                View <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── KPI Cards (Enhanced) ─── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card className="glass-card gradient-border-animated card-shine glass-hover border-border/20 rounded-xl cursor-pointer group" onClick={() => setActiveModule('projects')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-brand-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2 sparkle-text">
              <AnimatedNumber value={data.acceptedQuotesValue || data.totalRevenue || 0} format="currency" />
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">+12.5%</span>
                <span className="text-xs text-muted-foreground">this month</span>
              </div>
              <MicroSparkline data={revenueSparkline} color="#00F5D4" />
            </div>
          </CardContent>
        </Card>

        {/* Active Projects Card */}
        <Card className="glass-card gradient-border-animated card-shine glass-hover border-border/20 rounded-xl cursor-pointer group" onClick={() => setActiveModule('projects')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-indigo/20 to-brand-indigo/5 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-brand-indigo-light" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">
              <AnimatedNumber value={data.totalProjects} />
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">+2</span>
                <span className="text-xs text-muted-foreground">new this month</span>
              </div>
              <MicroSparkline data={projectsSparkline} color="#5E17C4" />
            </div>
          </CardContent>
        </Card>

        {/* Active Clients Card */}
        <Card className="glass-card gradient-border-animated card-shine glass-hover border-border/20 rounded-xl cursor-pointer group" onClick={() => setActiveModule('clients')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Clients</p>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-gold" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">
              <AnimatedNumber value={data.activeClients} />
              <span className="text-sm text-muted-foreground font-normal"> / {data.totalClients}</span>
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">+2</span>
                <span className="text-xs text-muted-foreground">this month</span>
              </div>
              <MicroSparkline data={clientsSparkline} color="#D4AF37" />
            </div>
          </CardContent>
        </Card>

        {/* Unread Messages Card */}
        <Card className="glass-card gradient-border-animated card-shine glass-hover border-border/20 rounded-xl cursor-pointer group" onClick={() => setActiveModule('inbox')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Unread Messages</p>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-indigo/5 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-brand-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">
              <AnimatedNumber value={data.unreadMessages} />
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-medium">-3</span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Pipeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card card-shine border-border/20 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Project Pipeline</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveModule('projects')} className="text-brand-cyan hover:text-brand-cyan">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pipeline Bar */}
              <div className="flex rounded-xl overflow-hidden h-10">
                {projectStatuses.map((status) => {
                  const count = data.projectsByStatus[status] || 0;
                  const pct = totalPipelineProjects > 0 ? (count / totalPipelineProjects) * 100 : 0;
                  const colors: Record<string, string> = {
                    planning: 'bg-brand-indigo/60 text-brand-indigo-light',
                    design: 'bg-brand-indigo-light/60 text-white',
                    procurement: 'bg-brand-cyan-dark/60 text-brand-cyan',
                    execution: 'bg-brand-gold/60 text-brand-gold',
                    completion: 'bg-green-500/60 text-green-300',
                    delivered: 'bg-brand-cyan/60 text-brand-cyan',
                  };
                  return (
                    <div
                      key={status}
                      className={`${colors[status]} pipeline-bar flex items-center justify-center text-xs font-medium`}
                      style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}
                      title={`${status}: ${count}`}
                    >
                      {count > 0 && <span>{count}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Pipeline Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                {projectStatuses.map((status) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full status-${status}`} />
                    <span className="text-muted-foreground capitalize">{status}</span>
                    <span className="font-medium">{data.projectsByStatus[status] || 0}</span>
                  </div>
                ))}
              </div>

              {/* Project Budget Bars */}
              <Separator className="bg-border/20" />
              <div className="space-y-3">
                {(data.projects || []).slice(0, 4).map((project) => {
                  const budgetPct = project.budget ? Math.min((project.spent / project.budget) * 100, 100) : 0;
                  const isOverBudget = project.budget ? project.spent > project.budget * 0.85 : false;
                  return (
                    <div key={project.id} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate group-hover:text-brand-cyan transition-colors">{project.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(project.spent)} / {project.budget ? formatCurrency(project.budget) : '—'}
                        </span>
                      </div>
                      <Progress
                        value={budgetPct}
                        className={`h-1.5 ${isOverBudget ? '[&>div]:bg-brand-gold' : '[&>div]:bg-brand-cyan'}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-border/20 rounded-xl h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-brand-cyan" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative pl-8 space-y-0 max-h-80 overflow-y-auto">
                {/* Timeline connecting line */}
                {(data.recentActivities || []).length > 0 && (
                  <div className="timeline-line" />
                )}
                {(data.recentActivities || []).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="relative pb-5"
                  >
                    {/* Timeline dot */}
                    <div className={`timeline-dot ${getActivityDotColor(activity.type)}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <p className="text-sm leading-snug">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Revenue Overview Section (Enhanced) ─── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold font-['Space_Grotesk']">Revenue Overview</h3>
          <BarChart3 className="h-4 w-4 text-brand-cyan" />
          {/* Last 6 Months badge */}
          <Badge variant="outline" className="text-[10px] border-brand-cyan/20 text-brand-cyan bg-brand-cyan/5">
            Last 6 Months
          </Badge>
          <div className="gradient-line flex-1" />
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 bg-brand-surface-light/50 rounded-lg p-0.5 border border-border/20">
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                chartType === 'area'
                  ? 'bg-brand-cyan/20 text-brand-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-brand-indigo/20 text-brand-indigo-light'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <Card className="glass-card card-shine border-border/20 rounded-xl lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Monthly Revenue Trend</CardTitle>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-brand-cyan" />
                  <span className="text-xs text-brand-cyan">Trending up</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={data.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.4} />
                          <stop offset="50%" stopColor="#3A0CA3" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3A0CA3" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3A0CA3" />
                          <stop offset="50%" stopColor="#00F5D4" />
                          <stop offset="100%" stopColor="#D4AF37" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="month"
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 10, 40, 0.95)',
                          border: '1px solid rgba(0, 245, 212, 0.2)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                          padding: '12px 16px',
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}
                        itemStyle={{ color: '#00F5D4', fontSize: 14, fontWeight: 600 }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="url(#lineGradient)"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        dot={{ r: 4, fill: '#00F5D4', stroke: '#0F0A28', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#D4AF37', stroke: '#0F0A28', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={data.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00F5D4" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#3A0CA3" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="month"
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 10, 40, 0.95)',
                          border: '1px solid rgba(0, 245, 212, 0.2)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                          padding: '12px 16px',
                        }}
                        labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 }}
                        itemStyle={{ color: '#00F5D4', fontSize: 14, fontWeight: 600 }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project Status Pie Chart */}
          <Card className="glass-card card-shine border-border/20 rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Project Status</CardTitle>
                <FolderKanban className="h-4 w-4 text-brand-indigo-light" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(data.projectsByStatus || {}).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="rgba(15, 10, 40, 0.8)"
                      strokeWidth={2}
                    >
                      {Object.entries(data.projectsByStatus || {}).map(([status], index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[status] || '#6B7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 10, 40, 0.95)',
                        border: '1px solid rgba(0, 245, 212, 0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        padding: '12px 16px',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      itemStyle={{ color: '#00F5D4', fontSize: 13, fontWeight: 600 }}
                      formatter={(value: number, name: string) => [`${value} project${value !== 1 ? 's' : ''}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Pie Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                {Object.entries(data.projectsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[status] || '#6B7280' }}
                    />
                    <span className="text-xs text-muted-foreground truncate capitalize">{status}</span>
                    <span className="text-xs font-semibold ml-auto">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ─── Studio Performance Mini-Section ─── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold font-['Space_Grotesk']">Studio Performance</h3>
          <Target className="h-4 w-4 text-brand-gold" />
          <div className="gradient-line flex-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Client Satisfaction */}
          <Card className="glass-card card-shine glass-hover border-border/20 rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 flex items-center justify-center shrink-0">
                <ThumbsUp className="h-6 w-6 text-brand-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Client Satisfaction</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold font-['Space_Grotesk'] shimmer-text">96%</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < 5 ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project On-Time Rate */}
          <Card className="glass-card card-shine glass-hover border-border/20 rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center shrink-0">
                <Timer className="h-6 w-6 text-brand-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">On-Time Rate</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold font-['Space_Grotesk']">87%</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-green-400">+4%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Per Project */}
          <Card className="glass-card card-shine glass-hover border-border/20 rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-indigo/20 to-brand-indigo/5 flex items-center justify-center shrink-0">
                <DollarSign className="h-6 w-6 text-brand-indigo-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue Per Project</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold font-['Space_Grotesk']">€19.3K</span>
                  <span className="text-xs text-muted-foreground">avg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ─── Upcoming Schedule (Enhanced) ─── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold font-['Space_Grotesk']">Upcoming Schedule</h3>
          <Calendar className="h-4 w-4 text-brand-gold" />
          <div className="gradient-line flex-1" />
          {/* Live clock */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 pulse-cyan" />
            <LiveClock />
          </div>
        </div>
        <Card className="glass-card card-shine border-border/20 rounded-xl">
          <CardContent className="p-5">
            <div className="space-y-3 relative pl-6">
              {/* Timeline connecting line (dotted) */}
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 timeline-connector-line" style={{
                background: 'repeating-linear-gradient(to bottom, rgba(58, 12, 163, 0.4) 0px, rgba(58, 12, 163, 0.4) 4px, transparent 4px, transparent 8px, rgba(0, 245, 212, 0.3) 8px, rgba(0, 245, 212, 0.3) 12px, transparent 12px, transparent 16px)',
              }} />
              {UPCOMING_SCHEDULE.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className={`relative flex items-center gap-4 p-3 rounded-xl bg-brand-surface-light/30 hover:bg-brand-surface-light/50 transition-all group border-l-3 ${getScheduleBorder(event.type)}`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border-2 z-10 ${
                    event.type === 'Meeting' ? 'border-brand-indigo bg-brand-indigo/40' :
                    event.type === 'Deadline' ? 'border-red-400 bg-red-400/40' :
                    event.type === 'Delivery' ? 'border-brand-cyan bg-brand-cyan/40' :
                    'border-brand-gold bg-brand-gold/40'
                  }`} />
                  <div className="shrink-0 text-right w-14">
                    <p className="text-sm font-mono font-semibold text-foreground">{event.time}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8 bg-border/30" />
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {getScheduleIcon(event.type)}
                    <p className="text-sm font-medium truncate group-hover:text-brand-cyan transition-colors">{event.title}</p>
                  </div>
                  <Badge variant="outline" className={`${getScheduleBadge(event.type)} text-[10px] border-0 shrink-0`}>
                    {event.type}
                  </Badge>
                </motion.div>
              ))}
            </div>
            {/* View Full Calendar button */}
            <div className="mt-4 pt-3 border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                View Full Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row: Upcoming Tasks + Quick Actions + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-border/20 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Upcoming Tasks</CardTitle>
                <Clock className="h-4 w-4 text-brand-gold" />
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, i) => {
                    const priorityColors: Record<string, string> = {
                      urgent: 'bg-red-500',
                      high: 'bg-brand-gold',
                      medium: 'bg-brand-cyan',
                      low: 'bg-muted-foreground',
                    };
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface-light/30 hover:bg-brand-surface-light/50 transition-all group"
                      >
                        <span className={`shrink-0 h-2 w-2 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-brand-cyan transition-colors">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.project?.name || 'No project'}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant="outline" className={`status-${task.status} text-[10px]`}>
                            {task.status}
                          </Badge>
                          {task.dueDate && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-border/20 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-['Space_Grotesk']">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: 'New Client', icon: <Users className="h-5 w-5" />, module: 'clients' as ActiveModule, color: 'text-brand-gold' },
                { label: 'New Project', icon: <FolderKanban className="h-5 w-5" />, module: 'projects' as ActiveModule, color: 'text-brand-indigo-light' },
                { label: 'New Quote', icon: <FileText className="h-5 w-5" />, module: 'quotes' as ActiveModule, color: 'text-brand-cyan' },
                { label: 'Check Inbox', icon: <Inbox className="h-5 w-5" />, module: 'inbox' as ActiveModule, color: 'text-green-400' },
                { label: 'AI Design', icon: <Star className="h-5 w-5" />, module: 'ai-design' as ActiveModule, color: 'text-brand-gold' },
                { label: 'Floor Plans', icon: <Zap className="h-5 w-5" />, module: 'floorplan' as ActiveModule, color: 'text-brand-cyan' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setActiveModule(action.module)}
                  className="gradient-border-animated flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-surface-light/30 border border-border/20 hover:border-brand-cyan/30 hover:glow-cyan transition-all group"
                >
                  <div className={`${action.color} group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Studio Announcements (Enhanced) ─── */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card card-shine border-border/20 rounded-xl h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Studio Announcements</CardTitle>
                <Megaphone className="h-4 w-4 text-brand-cyan" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {announcements.map((announcement, i) => {
                  const catStyle = getCategoryStyle(announcement.category);
                  return (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      className={`relative p-3 rounded-xl bg-brand-surface-light/30 hover:bg-brand-surface-light/50 transition-all group border-l-3 ${catStyle.border}`}
                    >
                      {/* Dismiss button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAnnouncement(announcement.id)}
                        className="absolute top-1 right-1 h-5 w-5 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={`${catStyle.badge} text-[10px] gap-1 border px-1.5 py-0`}>
                          {catStyle.icon}
                          {announcement.category}
                        </Badge>
                        {/* New badge */}
                        {announcement.isNew && (
                          <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[9px] h-4 px-1.5 font-bold">
                            NEW
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(announcement.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm font-medium group-hover:text-brand-cyan transition-colors leading-snug">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.description}</p>
                    </motion.div>
                  );
                })}
              </div>
              <Separator className="bg-border/20 my-3" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10"
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
