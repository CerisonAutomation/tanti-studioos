'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

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
}

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

export default function DashboardModule() {
  const { setActiveModule } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
              <div className="h-4 w-20 bg-muted/30 rounded mb-3" />
              <div className="h-8 w-28 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-xl p-6 animate-pulse h-80" />
          <div className="glass-card rounded-xl p-6 animate-pulse h-80" />
        </div>
      </div>
    );
  }

  const projectStatuses = ['planning', 'design', 'procurement', 'execution', 'completion', 'delivered'];
  const totalPipelineProjects = projectStatuses.reduce((sum, s) => sum + (data.projectsByStatus[s] || 0), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Welcome to StudioOS</h2>
          <p className="text-muted-foreground mt-1 text-sm">Tanti Interiors — Luxury Design Management Platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setActiveModule('ai-design')}
            className="bg-gradient-to-r from-brand-indigo to-brand-indigo-light hover:from-brand-indigo-light hover:to-brand-indigo text-white"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" /> AI Assistant
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/20 hover:glow-cyan transition-shadow cursor-pointer" onClick={() => setActiveModule('projects')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <div className="h-8 w-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-brand-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">{formatCurrency(data.acceptedQuotesValue || data.totalRevenue || 0)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+12.5% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/20 hover:glow-indigo transition-shadow cursor-pointer" onClick={() => setActiveModule('projects')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <div className="h-8 w-8 rounded-lg bg-brand-indigo/10 flex items-center justify-center">
                <FolderKanban className="h-4 w-4 text-brand-indigo-light" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">{data.totalProjects}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">{data.projectsByStatus['execution'] || 0} in execution</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/20 hover:glow-gold transition-shadow cursor-pointer" onClick={() => setActiveModule('clients')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active Clients</p>
              <div className="h-8 w-8 rounded-lg bg-brand-gold/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-brand-gold" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">{data.activeClients} <span className="text-sm text-muted-foreground font-normal">/ {data.totalClients}</span></p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/20 hover:glow-cyan transition-shadow cursor-pointer" onClick={() => setActiveModule('inbox')}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Unread Messages</p>
              <div className="h-8 w-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                <Inbox className="h-4 w-4 text-brand-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold font-['Space_Grotesk'] mt-2">{data.unreadMessages}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="h-2 w-2 rounded-full bg-brand-cyan pulse-cyan" />
              <span className="text-xs text-brand-cyan">Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Pipeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card border-border/20">
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
                    planning: 'bg-brand-indigo/60',
                    design: 'bg-brand-indigo-light/60',
                    procurement: 'bg-brand-cyan-dark/60',
                    execution: 'bg-brand-gold/60',
                    completion: 'bg-green-500/60',
                    delivered: 'bg-brand-cyan/60',
                  };
                  return (
                    <div
                      key={status}
                      className={`${colors[status]} flex items-center justify-center text-xs font-medium transition-all`}
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
                    <div key={project.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{project.name}</span>
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
          <Card className="glass-card border-border/20 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-['Space_Grotesk']">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-brand-cyan" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {(data.recentActivities || []).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Upcoming Tasks + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass-card border-border/20">
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
                  {tasks.map((task) => {
                    const priorityColors: Record<string, string> = {
                      urgent: 'bg-red-500',
                      high: 'bg-brand-gold',
                      medium: 'bg-brand-cyan',
                      low: 'bg-muted-foreground',
                    };
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-brand-surface-light/30 hover:bg-brand-surface-light/50 transition-colors">
                        <span className={`shrink-0 h-2 w-2 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-border/20">
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
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-surface-light/30 border border-border/20 hover:border-brand-cyan/30 hover:glow-cyan transition-all group"
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
      </div>
    </motion.div>
  );
}
