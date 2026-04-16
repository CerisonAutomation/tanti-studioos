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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  ArrowLeft,
  Edit2,
  LayoutGrid,
  List,
  MapPin,
  Calendar,
  FileText,
  GripVertical,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Layers,
  PenTool,
  Users,
  Sparkles,
} from 'lucide-react';

// Types
interface ProjectClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  status: string;
  priority: string;
  budget: number | null;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  client: ProjectClient;
  _count: { tasks: number; quotes: number; documents: number; floorplans: number };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  dueDate: string | null;
  projectId: string;
  createdAt: string;
  project?: { id: string; name: string };
}

interface Quote {
  id: string;
  title: string;
  status: string;
  tier: string;
  total: number;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  createdAt: string;
}

interface Floorplan {
  id: string;
  name: string;
  thumbnail: string | null;
  createdAt: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  status: string;
  priority: string;
  budget: number | null;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  client: ProjectClient;
  tasks: Task[];
  quotes: Quote[];
  documents: Document[];
  floorplans: Floorplan[];
}

interface ClientOption {
  id: string;
  name: string;
}

const projectStatuses = ['planning', 'design', 'procurement', 'execution', 'completion', 'delivered'] as const;
const priorityOptions = ['urgent', 'high', 'medium', 'low'] as const;
const taskStatuses = ['todo', 'in-progress', 'review', 'done'] as const;

const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

const priorityColors: Record<string, string> = {
  urgent: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-brand-cyan',
  low: 'text-muted-foreground',
};

const priorityDotColors: Record<string, string> = {
  urgent: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-brand-cyan',
  low: 'bg-muted-foreground',
};

const taskStatusIcons: Record<string, typeof Circle> = {
  'todo': Circle,
  'in-progress': Clock,
  'review': AlertCircle,
  'done': CheckCircle2,
};

const taskStatusColors: Record<string, string> = {
  'todo': 'text-muted-foreground',
  'in-progress': 'text-blue-400',
  'review': 'text-brand-gold',
  'done': 'text-brand-cyan',
};

export default function ProjectsModule() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    budget: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      const res = await fetch(`/api/projects?${params}`);
      if (res.ok) {
        let data = await res.json();
        if (search) {
          const q = search.toLowerCase();
          data = data.filter((p: ProjectListItem) =>
            p.name.toLowerCase().includes(q) ||
            p.client.name.toLowerCase().includes(q) ||
            (p.location && p.location.toLowerCase().includes(q))
          );
        }
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  // Fetch clients for dropdown
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  // Fetch project detail
  const fetchProjectDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);
      }
    } catch (err) {
      console.error('Failed to fetch project detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [fetchProjects, fetchClients]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetail(selectedProjectId);
      setActiveTab('overview');
    } else {
      setProjectDetail(null);
    }
  }, [selectedProjectId, fetchProjectDetail]);

  // Open add dialog
  const openAddDialog = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      clientId: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      budget: '',
      startDate: '',
      endDate: '',
      location: '',
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (project: ProjectDetail) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      budget: project.budget?.toString() || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      location: project.location || '',
    });
    setDialogOpen(true);
  };

  // Submit project form
  const handleSubmit = async () => {
    if (!formData.name || !formData.clientId) return;
    setSubmitting(true);
    try {
      if (editingProject) {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchProjectDetail(editingProject.id);
          fetchProjects();
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          fetchProjects();
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit task form
  const handleTaskSubmit = async () => {
    if (!taskFormData.title || !selectedProjectId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskFormData, projectId: selectedProjectId }),
      });
      if (res.ok) {
        await fetchProjectDetail(selectedProjectId);
        setTaskDialogOpen(false);
        setTaskFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assignee: '',
          dueDate: '',
        });
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok && selectedProjectId) {
        await fetchProjectDetail(selectedProjectId);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getBudgetPercent = (spent: number, budget: number | null) => {
    if (!budget) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  // Group projects by status for kanban
  const kanbanColumns = projectStatuses.map((status) => ({
    status,
    projects: projects.filter((p) => p.status === status),
  }));

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedProjectId) {
    if (detailLoading) {
      return (
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    if (!projectDetail) return null;

    const p = projectDetail;
    const budgetPercent = getBudgetPercent(p.spent, p.budget);
    const isNearBudget = p.budget ? p.spent / p.budget > 0.85 : false;
    const daysRemaining = getDaysRemaining(p.endDate);

    // Group tasks by status for task kanban
    const taskColumns = taskStatuses.map((status) => ({
      status,
      tasks: p.tasks.filter((t) => t.status === status),
    }));

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
              onClick={() => setSelectedProjectId(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk']">{p.name}</h2>
              <p className="text-sm text-muted-foreground">{p.client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`status-${p.status} text-xs`}>{statusLabel(p.status)}</Badge>
            <span className={`text-xs font-medium ${priorityColors[p.priority]}`}>
              {statusLabel(p.priority)} priority
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(p)}
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
              { value: 'overview', icon: Briefcase, label: 'Overview' },
              { value: 'tasks', icon: CheckCircle2, label: 'Tasks' },
              { value: 'quotes', icon: FileText, label: 'Quotes' },
              { value: 'documents', icon: Layers, label: 'Documents' },
              { value: 'floorplans', icon: PenTool, label: 'Floorplans' },
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
              {/* Project Info */}
              <Card className="glass-card card-shine rounded-xl col-span-1 md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-['Space_Grotesk']">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.description && (
                    <p className="text-sm text-muted-foreground">{p.description}</p>
                  )}
                  <Separator className="bg-brand-indigo/20" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-brand-cyan" />
                      <span>Client: <span className="text-foreground">{p.client.name}</span></span>
                    </div>
                    {p.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-cyan" />
                        <span>{p.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-cyan" />
                      <span>Start: {formatDate(p.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-cyan" />
                      <span>End: {formatDate(p.endDate)}</span>
                    </div>
                  </div>
                  {daysRemaining !== null && (
                    <div className={`text-sm font-medium ${
                      daysRemaining < 0 ? 'text-red-400' : daysRemaining < 30 ? 'text-brand-gold' : 'text-brand-cyan'
                    }`}>
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days remaining`}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Budget Card */}
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-['Space_Grotesk']">Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-['Space_Grotesk']">
                      <span className={isNearBudget ? 'text-brand-gold' : 'text-brand-cyan'}>
                        {formatCurrency(p.spent)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {formatCurrency(p.budget)} budget
                    </p>
                  </div>
                  <Progress
                    value={budgetPercent}
                    className={`h-3 bg-brand-surface-lighter ${
                      isNearBudget ? '[&>div]:bg-brand-gold' : '[&>div]:bg-brand-cyan'
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{budgetPercent.toFixed(0)}% used</span>
                    <span>{formatCurrency((p.budget || 0) - p.spent)} remaining</span>
                  </div>
                  <Separator className="bg-brand-indigo/20" />
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-brand-cyan">{p.tasks.length}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-brand-gold">{p.quotes.length}</p>
                      <p className="text-xs text-muted-foreground">Quotes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab - Mini Kanban */}
          <TabsContent value="tasks" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium font-['Space_Grotesk']">Task Board</h3>
              <Button
                size="sm"
                onClick={() => {
                  setTaskFormData({
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: 'medium',
                    assignee: '',
                    dueDate: '',
                  });
                  setTaskDialogOpen(true);
                }}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {taskColumns.map((col) => (
                <div key={col.status} className="space-y-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = taskStatusIcons[col.status] || Circle;
                        return <Icon className={`h-4 w-4 ${taskStatusColors[col.status]}`} />;
                      })()}
                      <span className="text-sm font-medium">{statusLabel(col.status)}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {col.tasks.length}
                    </Badge>
                  </div>

                  {/* Column Content */}
                  <div className="kanban-column space-y-2 min-h-[120px] p-2 rounded-lg bg-brand-surface/30 border border-brand-indigo/10">
                    {col.tasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                        No tasks
                      </div>
                    ) : (
                      col.tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Card className="kanban-card glass-card cursor-pointer group">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-tight">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pl-5">
                                <div className="flex items-center gap-2">
                                  <div className={`h-1.5 w-1.5 rounded-full ${priorityDotColors[task.priority]}`} />
                                  <span className={`text-[10px] ${priorityColors[task.priority]}`}>
                                    {statusLabel(task.priority)}
                                  </span>
                                </div>
                                {task.dueDate && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDate(task.dueDate)}
                                  </span>
                                )}
                              </div>
                              {task.assignee && (
                                <div className="pl-5">
                                  <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="mt-4">
            {p.quotes.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No quotes yet for this project</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {p.quotes.map((q) => (
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
                          <p className="text-xs text-muted-foreground">
                            {statusLabel(q.tier)} tier · {formatDate(q.createdAt)}
                          </p>
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            {p.documents.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {p.documents.map((doc) => (
                  <Card key={doc.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-indigo/20 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-brand-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} · {doc.size ? `${(doc.size / 1024).toFixed(0)}KB` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Floorplans Tab */}
          <TabsContent value="floorplans" className="mt-4">
            {p.floorplans.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <PenTool className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No floorplans yet</p>
                  <Button
                    variant="outline"
                    className="mt-3 border-brand-indigo/30 hover:bg-brand-indigo/20"
                    onClick={() => {
                      useAppStore.getState().setActiveModule('floorplan');
                    }}
                  >
                    <PenTool className="h-4 w-4 mr-1.5" />
                    Open Floorplan Editor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {p.floorplans.map((fp) => (
                  <Card key={fp.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-brand-indigo/20 flex items-center justify-center">
                            <PenTool className="h-5 w-5 text-brand-gold" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{fp.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(fp.createdAt)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-brand-indigo/30 hover:bg-brand-indigo/20 text-xs"
                          onClick={() => {
                            useAppStore.getState().setActiveModule('floorplan');
                          }}
                        >
                          Open Editor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Project Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="proj-name">Project Name *</Label>
                <Input
                  id="proj-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-desc">Description</Label>
                <Textarea
                  id="proj-desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                  placeholder="Project description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p}>{statusLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-budget">Budget (€)</Label>
                <Input
                  id="proj-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="100000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-start">Start Date</Label>
                  <Input
                    id="proj-start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-end">End Date</Label>
                  <Input
                    id="proj-end"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-location">Location</Label>
                <Input
                  id="proj-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="City, Country"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !formData.name || !formData.clientId}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                {submitting ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
          <DialogContent className="glass-strong max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title *</Label>
                <Input
                  id="task-title"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-desc">Description</Label>
                <Textarea
                  id="task-desc"
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[60px]"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={taskFormData.priority} onValueChange={(v) => setTaskFormData({ ...taskFormData, priority: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p}>{statusLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Input
                    id="task-assignee"
                    value={taskFormData.assignee}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignee: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="Name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTaskDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleTaskSubmit}
                disabled={submitting || !taskFormData.title}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                {submitting ? 'Adding...' : 'Add Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // ==========================================
  // LIST / KANBAN VIEW
  // ==========================================
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
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-brand-indigo/20 rounded-md overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              onClick={() => setViewMode('kanban')}
              className={`rounded-none ${viewMode === 'kanban' ? 'bg-brand-indigo text-white' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className={`rounded-none ${viewMode === 'list' ? 'bg-brand-indigo text-white' : 'text-muted-foreground'}`}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Project
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
            placeholder="Search projects, clients, locations..."
            className="pl-9 bg-brand-surface-light border-brand-indigo/20"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-brand-surface-light border-brand-indigo/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {projectStatuses.map((s) => (
                <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] bg-brand-surface-light border-brand-indigo/20">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorityOptions.map((p) => (
                <SelectItem key={p} value={p}>{statusLabel(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Briefcase className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first project to get started'}
            </p>
            {!search && statusFilter === 'all' && priorityFilter === 'all' && (
              <Button onClick={openAddDialog} className="bg-brand-indigo hover:bg-brand-indigo-light text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => (
            <div
              key={col.status}
              className="kanban-column flex-shrink-0 w-[280px] sm:w-[300px] space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <Badge className={`status-${col.status} text-[10px]`}>
                    {statusLabel(col.status)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{col.projects.length}</span>
              </div>

              {/* Column Content */}
              <div className="space-y-3 p-1 min-h-[200px]">
                {col.projects.map((project, i) => {
                  const budgetPct = getBudgetPercent(project.spent, project.budget);
                  const days = getDaysRemaining(project.endDate);
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <Card
                        className="kanban-card glass-card cursor-pointer group"
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Header with grip */}
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight group-hover:text-brand-cyan transition-colors">
                                {project.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {project.client.name}
                              </p>
                            </div>
                          </div>

                          {/* Priority */}
                          <div className="flex items-center gap-2 pl-6">
                            <div className={`h-2 w-2 rounded-full ${priorityDotColors[project.priority]}`} />
                            <span className={`text-[10px] ${priorityColors[project.priority]}`}>
                              {statusLabel(project.priority)}
                            </span>
                          </div>

                          {/* Budget Progress */}
                          {project.budget && (
                            <div className="pl-6">
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>{formatCurrency(project.spent)}</span>
                                <span>{formatCurrency(project.budget)}</span>
                              </div>
                              <Progress
                                value={budgetPct}
                                className={`h-1.5 bg-brand-surface-lighter ${
                                  project.spent / project.budget > 0.85
                                    ? '[&>div]:bg-brand-gold'
                                    : '[&>div]:bg-brand-cyan'
                                }`}
                              />
                            </div>
                          )}

                          {/* Days Remaining */}
                          {days !== null && (
                            <div className="flex items-center justify-between pl-6 text-[10px]">
                              <span className="text-muted-foreground">
                                {days < 0
                                  ? `${Math.abs(days)}d overdue`
                                  : `${days}d remaining`}
                              </span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-brand-cyan transition-colors" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <Card className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-indigo/15 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Project</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Priority</TableHead>
                  <TableHead className="text-muted-foreground">Budget</TableHead>
                  <TableHead className="text-muted-foreground">Spent</TableHead>
                  <TableHead className="text-muted-foreground">Progress</TableHead>
                  <TableHead className="text-muted-foreground">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => {
                  const budgetPct = getBudgetPercent(project.spent, project.budget);
                  const days = getDaysRemaining(project.endDate);
                  return (
                    <TableRow
                      key={project.id}
                      className="border-brand-indigo/10 cursor-pointer hover:bg-brand-indigo/10 transition-colors"
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${priorityDotColors[project.priority]}`} />
                          {project.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {project.client.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={`status-${project.status} text-[10px]`}>
                          {statusLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs ${priorityColors[project.priority]}`}>
                          {statusLabel(project.priority)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(project.budget)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={project.budget && project.spent / project.budget > 0.85 ? 'text-brand-gold' : 'text-brand-cyan'}>
                          {formatCurrency(project.spent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <Progress
                            value={budgetPct}
                            className={`h-1.5 bg-brand-surface-lighter ${
                              project.budget && project.spent / project.budget > 0.85
                                ? '[&>div]:bg-brand-gold'
                                : '[&>div]:bg-brand-cyan'
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {days !== null ? (
                          <span className={days < 0 ? 'text-red-400' : days < 30 ? 'text-brand-gold' : ''}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Add New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-proj-name">Project Name *</Label>
              <Input
                id="new-proj-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="Project name"
              />
            </div>
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-proj-desc">Description</Label>
              <Textarea
                id="new-proj-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Project description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p} value={p}>{statusLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-proj-budget">Budget (€)</Label>
              <Input
                id="new-proj-budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="100000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-proj-start">Start Date</Label>
                <Input
                  id="new-proj-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-proj-end">End Date</Label>
                <Input
                  id="new-proj-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-proj-location">Location</Label>
              <Input
                id="new-proj-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="City, Country"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.name || !formData.clientId}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting ? 'Adding...' : 'Add Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
