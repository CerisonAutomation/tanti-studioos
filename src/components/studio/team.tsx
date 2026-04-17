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
  Users,
  Plus,
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  Briefcase,
  BarChart3,
  GanttChart,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface ProjectInfo {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  spent: number;
  client?: { id: string; name: string } | null;
}

interface AssignmentInfo {
  id: string;
  teamMemberId: string;
  projectId: string;
  role: string;
  allocation: number;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: ProjectInfo;
}

interface TeamMemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  status: string;
  capacity: number;
  phone: string | null;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  assignments: AssignmentInfo[];
}

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  role: string;
}

const roleOptions = ['designer', 'architect', 'project-manager', 'contractor', 'admin'] as const;
const statusOptions = ['available', 'busy', 'on-leave', 'offboarded'] as const;
const assignmentRoleOptions = ['lead', 'support', 'consultant', 'reviewer'] as const;
const assignmentStatusOptions = ['active', 'completed', 'on-hold'] as const;

const roleLabel = (r: string) => r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const statusLabel = (s: string) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/* Hash-based gradient for avatar initials */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getAvatarGradient(name: string): string {
  const hash = hashString(name);
  const gradients = [
    'from-brand-indigo to-brand-indigo-light',
    'from-brand-cyan-dark to-brand-cyan',
    'from-brand-gold to-amber-400',
    'from-purple-500 to-pink-500',
    'from-brand-indigo to-brand-cyan',
    'from-brand-indigo-light to-brand-gold',
  ];
  return gradients[hash % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  return name.charAt(0).toUpperCase();
}

// Status colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'available': return 'bg-emerald-400';
    case 'busy': return 'bg-amber-400';
    case 'on-leave': return 'bg-gray-400';
    case 'offboarded': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
}

function getStatusPulse(status: string): string {
  return status === 'available' ? 'animate-pulse' : '';
}

// Project status colors for Gantt bars
function getProjectStatusColor(status: string): string {
  switch (status) {
    case 'planning': return 'bg-indigo-500/80';
    case 'design': return 'bg-purple-500/80';
    case 'execution': return 'bg-amber-500/80';
    case 'procurement': return 'bg-cyan-500/80';
    case 'completed': return 'bg-emerald-500/80';
    case 'on-hold': return 'bg-gray-500/80';
    default: return 'bg-brand-indigo/80';
  }
}

function getProjectStatusBorder(status: string): string {
  switch (status) {
    case 'planning': return 'border-indigo-400/60';
    case 'design': return 'border-purple-400/60';
    case 'execution': return 'border-amber-400/60';
    case 'procurement': return 'border-cyan-400/60';
    case 'completed': return 'border-emerald-400/60';
    case 'on-hold': return 'border-gray-400/60';
    default: return 'border-brand-indigo/60';
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'architect': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'designer': return 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30';
    case 'project-manager': return 'bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30';
    case 'contractor': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'admin': return 'bg-brand-gold/20 text-brand-gold border-brand-gold/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

function getAssignmentRoleBadgeColor(role: string): string {
  switch (role) {
    case 'lead': return 'bg-brand-gold/20 text-brand-gold border-brand-gold/30';
    case 'support': return 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30';
    case 'consultant': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'reviewer': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMonthYear = (d: Date) => {
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
};

// Calculate total allocation for a team member
function getTotalAllocation(member: TeamMemberInfo): number {
  return member.assignments
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + a.allocation, 0);
}

// Animated counter component
function AnimatedCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return <>{count}</>;
}

export default function TeamModule() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMemberInfo | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberInfo | null>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  // Form states
  const [memberForm, setMemberForm] = useState({
    name: '', email: '', role: 'designer', status: 'available', capacity: '100', phone: '',
  });
  const [assignmentForm, setAssignmentForm] = useState({
    teamMemberId: '', projectId: '', role: 'lead', allocation: '50', startDate: '', endDate: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Timeline view state
  const [timelineStartMonth, setTimelineStartMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  });

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.teamMembers || []);
      }
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects for dropdowns
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const projectList = Array.isArray(data) ? data : (data.projects || []);
        setProjects(projectList.map((p: { id: string; name: string; status: string }) => ({
          id: p.id, name: p.name, status: p.status,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
    fetchProjects();
  }, [fetchTeamMembers, fetchProjects]);

  // Computed stats
  const availableCount = teamMembers.filter(m => m.status === 'available').length;
  const activeProjectIds = new Set(teamMembers.flatMap(m => m.assignments.filter(a => a.status === 'active').map(a => a.projectId)));
  const activeProjectsCount = activeProjectIds.size;
  const totalUtilization = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((sum, m) => sum + Math.min(getTotalAllocation(m), m.capacity), 0) / teamMembers.length)
    : 0;

  // Member form handlers
  const openAddMemberDialog = () => {
    setEditingMember(null);
    setMemberForm({ name: '', email: '', role: 'designer', status: 'available', capacity: '100', phone: '' });
    setMemberDialogOpen(true);
  };

  const openEditMemberDialog = (member: TeamMemberInfo) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      capacity: String(member.capacity),
      phone: member.phone || '',
    });
    setMemberDialogOpen(true);
  };

  const handleMemberSubmit = async () => {
    if (!memberForm.name || !memberForm.email) return;
    setSubmitting(true);
    try {
      if (editingMember) {
        const res = await fetch(`/api/team/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...memberForm,
            capacity: parseInt(memberForm.capacity),
          }),
        });
        if (res.ok) {
          toast.success('Team member updated');
          fetchTeamMembers();
          // Update detail view if viewing this member
          if (selectedMember?.id === editingMember.id) {
            const detailRes = await fetch(`/api/team/${editingMember.id}`);
            if (detailRes.ok) setSelectedMember(await detailRes.json());
          }
        }
      } else {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...memberForm,
            capacity: parseInt(memberForm.capacity),
          }),
        });
        if (res.ok) {
          toast.success('Team member added');
          fetchTeamMembers();
        }
      }
      setMemberDialogOpen(false);
    } catch (err) {
      console.error('Failed to save team member:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member? All their assignments will also be deleted.')) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Team member removed');
        setSelectedMember(null);
        fetchTeamMembers();
      }
    } catch (err) {
      console.error('Failed to delete team member:', err);
    }
  };

  // Assignment form handlers
  const openAddAssignmentDialog = (member?: TeamMemberInfo) => {
    setAssignmentForm({
      teamMemberId: member?.id || '',
      projectId: '',
      role: 'lead',
      allocation: '50',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentForm.teamMemberId || !assignmentForm.projectId || !assignmentForm.startDate || !assignmentForm.endDate) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm),
      });
      if (res.ok) {
        toast.success('Assignment created');
        setAssignmentDialogOpen(false);
        fetchTeamMembers();
        // Refresh detail view
        if (selectedMember) {
          const detailRes = await fetch(`/api/team/${selectedMember.id}`);
          if (detailRes.ok) setSelectedMember(await detailRes.json());
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Failed to create assignment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Assignment removed');
        fetchTeamMembers();
        if (selectedMember) {
          const detailRes = await fetch(`/api/team/${selectedMember.id}`);
          if (detailRes.ok) setSelectedMember(await detailRes.json());
        }
      }
    } catch (err) {
      console.error('Failed to delete assignment:', err);
    }
  };

  // Timeline helpers
  const MONTHS_SHOWN = 8;
  const timelineMonths: Date[] = [];
  for (let i = 0; i < MONTHS_SHOWN; i++) {
    timelineMonths.push(new Date(timelineStartMonth.getFullYear(), timelineStartMonth.getMonth() + i, 1));
  }

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (timelineMonths[timelineMonths.length - 1].getTime() - timelineMonths[0].getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = Math.max(0, (start.getTime() - timelineMonths[0].getTime()) / (1000 * 60 * 60 * 24));
    const endOffset = Math.min(totalDays, (end.getTime() - timelineMonths[0].getTime()) / (1000 * 60 * 60 * 24));
    const width = Math.max(2, ((endOffset - startOffset) / totalDays) * 100);
    const left = (startOffset / totalDays) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), width)}%` };
  };

  // =========== DETAIL VIEW ===========
  if (selectedMember) {
    const m = selectedMember;
    const totalAlloc = getTotalAllocation(m);
    const utilizationPercent = m.capacity > 0 ? Math.round((totalAlloc / m.capacity) * 100) : 0;
    const activeAssignments = m.assignments.filter(a => a.status === 'active');
    const completedAssignments = m.assignments.filter(a => a.status === 'completed');

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
              onClick={() => setSelectedMember(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarGradient(m.name)} flex items-center justify-center shrink-0`}>
                <span className="text-lg font-bold text-white">{getInitials(m.name)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk']">{m.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={getRoleBadgeColor(m.role)} variant="outline">
                    {roleLabel(m.role)}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(m.status)} ${getStatusPulse(m.status)}`} />
                    <span className="text-xs text-muted-foreground">{statusLabel(m.status)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openAddAssignmentDialog(m)}
              className="border-brand-cyan/30 hover:bg-brand-cyan/20"
            >
              <Link2 className="h-3.5 w-3.5 mr-1" />
              Assign
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditMemberDialog(m)}
              className="border-brand-indigo/30 hover:bg-brand-indigo/20"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteMember(m.id)}
              className="border-red-500/30 hover:bg-red-500/20 text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Profile + Utilization row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Info */}
          <Card className="glass-card col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-['Space_Grotesk']">Contact & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-brand-cyan" />
                <span>{m.email}</span>
              </div>
              {m.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-brand-cyan" />
                  <span>{m.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-brand-cyan" />
                <span>Started {formatDate(m.startDate)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-brand-cyan" />
                <span>Capacity: <span className="text-brand-gold font-medium">{m.capacity}%</span></span>
              </div>
            </CardContent>
          </Card>

          {/* Utilization */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-['Space_Grotesk']">Utilization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className={`text-4xl font-bold font-['Space_Grotesk'] ${utilizationPercent > 90 ? 'text-red-400' : utilizationPercent > 70 ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                  {utilizationPercent}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAlloc}% of {m.capacity}% capacity allocated
                </p>
              </div>
              <div className="relative h-4 rounded-full bg-brand-surface-lighter overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    utilizationPercent > 90 ? 'bg-red-500' : utilizationPercent > 70 ? 'bg-brand-gold' : 'bg-brand-cyan'
                  }`}
                  style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                />
                {m.capacity < 100 && (
                  <div
                    className="absolute top-0 h-full w-px bg-brand-gold/60"
                    style={{ left: `${m.capacity}%` }}
                  />
                )}
              </div>
              <Separator className="bg-brand-indigo/20" />
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-brand-cyan">{activeAssignments.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-brand-gold">{completedAssignments.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-['Space_Grotesk']">Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {m.assignments.length === 0 ? (
              <div className="py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No assignments yet</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-brand-cyan/30 hover:bg-brand-cyan/20"
                  onClick={() => openAddAssignmentDialog(m)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Assign to Project
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {m.assignments.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={`glass-card rounded-xl p-4 border-l-4 ${getProjectStatusBorder(a.project.status)}`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{a.project.name}</p>
                          <Badge className={getAssignmentRoleBadgeColor(a.role)} variant="outline">
                            {roleLabel(a.role)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              a.status === 'active' ? 'border-emerald-500/30 text-emerald-400' :
                              a.status === 'completed' ? 'border-gray-500/30 text-gray-400' :
                              'border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {statusLabel(a.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(a.startDate)} — {formatDate(a.endDate)}
                          </span>
                          <span className="text-brand-gold font-medium">{a.allocation}% allocation</span>
                        </div>
                        {a.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {/* Mini timeline bar */}
                    <div className="mt-3 relative h-2 rounded-full bg-brand-surface-lighter overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProjectStatusColor(a.project.status)}`}
                        style={getBarPosition(a.startDate, a.endDate)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Member Dialog */}
        <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
          <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="m-name">Name *</Label>
                  <Input
                    id="m-name"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-email">Email *</Label>
                  <Input
                    id="m-email"
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="email@studio.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={memberForm.status} onValueChange={(v) => setMemberForm({ ...memberForm, status: v })}>
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
                  <Label htmlFor="m-capacity">Capacity (%)</Label>
                  <Input
                    id="m-capacity"
                    type="number"
                    min={0}
                    max={100}
                    value={memberForm.capacity}
                    onChange={(e) => setMemberForm({ ...memberForm, capacity: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-phone">Phone</Label>
                  <Input
                    id="m-phone"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="+356 ..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMemberDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleMemberSubmit}
                disabled={submitting || !memberForm.name || !memberForm.email}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                {submitting ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">Add Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Team Member *</Label>
                <Select value={assignmentForm.teamMemberId} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, teamMemberId: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((tm) => (
                      <SelectItem key={tm.id} value={tm.id}>{tm.name} — {roleLabel(tm.role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project *</Label>
                <Select value={assignmentForm.projectId} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, projectId: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={assignmentForm.role} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, role: v })}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentRoleOptions.map((r) => (
                        <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Allocation (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={assignmentForm.allocation}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, allocation: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={assignmentForm.startDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, startDate: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={assignmentForm.endDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, endDate: e.target.value })}
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[60px]"
                  placeholder="Optional notes about this assignment..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAssignmentDialogOpen(false)} className="text-muted-foreground">
                Cancel
              </Button>
              <Button
                onClick={handleAssignmentSubmit}
                disabled={submitting || !assignmentForm.teamMemberId || !assignmentForm.projectId}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                {submitting ? 'Creating...' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  // =========== MAIN LIST VIEW ===========
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
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Team & Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''} · {activeProjectsCount} active project{activeProjectsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openAddAssignmentDialog()}
            variant="outline"
            className="border-brand-cyan/30 hover:bg-brand-cyan/20"
          >
            <Link2 className="h-4 w-4 mr-1.5" />
            Assign
          </Button>
          <Button
            onClick={openAddMemberDialog}
            className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Member
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card card-shine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Team Size</p>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] text-brand-cyan">
                    <AnimatedCounter target={teamMembers.length} />
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-brand-cyan" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card card-shine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Available</p>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-400">
                    <AnimatedCounter target={availableCount} />
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card card-shine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active Projects</p>
                  <p className="text-2xl font-bold font-['Space_Grotesk'] text-brand-gold">
                    <AnimatedCounter target={activeProjectsCount} />
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-brand-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card card-shine">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                  <p className={`text-2xl font-bold font-['Space_Grotesk'] ${totalUtilization > 90 ? 'text-red-400' : totalUtilization > 70 ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                    <AnimatedCounter target={totalUtilization} />%
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-brand-indigo-light" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs: Overview / Timeline */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-brand-surface-light border border-brand-indigo/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Team Overview</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan">
            <GanttChart className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Timeline</span>
            <span className="sm:hidden">Gantt</span>
          </TabsTrigger>
        </TabsList>

        {/* Team Grid */}
        <TabsContent value="overview" className="mt-4">
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
          ) : teamMembers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">No team members yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your first team member to get started</p>
                <Button onClick={openAddMemberDialog} className="bg-brand-indigo hover:bg-brand-indigo-light text-white">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {teamMembers.map((member, i) => {
                  const totalAlloc = getTotalAllocation(member);
                  const utilPercent = member.capacity > 0 ? Math.round((totalAlloc / member.capacity) * 100) : 0;
                  const activeAssignments = member.assignments.filter(a => a.status === 'active');
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <Card
                        className="glass-card card-shine card-lift cursor-pointer rounded-xl transition-all group"
                        onClick={() => setSelectedMember(member)}
                      >
                        <CardContent className="p-4">
                          {/* Header row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(member.name)} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                                <span className="text-sm font-bold text-white">{getInitials(member.name)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm group-hover:text-brand-cyan transition-colors">
                                  {member.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge className={getRoleBadgeColor(member.role)} variant="outline">
                                    {roleLabel(member.role)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(member.status)} ${getStatusPulse(member.status)}`} />
                              <span className="text-xs text-muted-foreground">{statusLabel(member.status)}</span>
                            </div>
                          </div>

                          {/* Capacity bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {totalAlloc}% allocated
                              </span>
                              <span className={`text-xs font-medium ${utilPercent > 90 ? 'text-red-400' : utilPercent > 70 ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                                {utilPercent}% of {member.capacity}%
                              </span>
                            </div>
                            <div className="relative h-2 rounded-full bg-brand-surface-lighter overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  utilPercent > 90 ? 'bg-red-500' : utilPercent > 70 ? 'bg-brand-gold' : 'bg-brand-cyan'
                                }`}
                                style={{ width: `${Math.min(100, utilPercent)}%` }}
                              />
                            </div>
                          </div>

                          {/* Current projects */}
                          {activeAssignments.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className="text-xs text-muted-foreground font-medium">Current Projects</p>
                              {activeAssignments.slice(0, 3).map((a) => (
                                <div key={a.id} className="flex items-center gap-2 text-xs">
                                  <div className={`h-1.5 w-1.5 rounded-full ${getProjectStatusColor(a.project.status).replace('/80', '')}`} />
                                  <span className="truncate text-foreground/80">{a.project.name}</span>
                                  <Badge className={getAssignmentRoleBadgeColor(a.role)} variant="outline" style={{ fontSize: '9px', padding: '0 4px', height: '16px' }}>
                                    {roleLabel(a.role)}
                                  </Badge>
                                </div>
                              ))}
                              {activeAssignments.length > 3 && (
                                <p className="text-xs text-muted-foreground">+{activeAssignments.length - 3} more</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No active assignments</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Gantt / Timeline View */}
        <TabsContent value="timeline" className="mt-4">
          {loading ? (
            <Card className="glass-card">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : teamMembers.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <GanttChart className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">No timeline data</h3>
                <p className="text-sm text-muted-foreground">Add team members and assignments to see the timeline</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card card-shine overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-['Space_Grotesk'] flex items-center gap-2">
                    <GanttChart className="h-4 w-4 text-brand-cyan" />
                    Project Timeline
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setTimelineStartMonth(new Date(timelineStartMonth.getFullYear(), timelineStartMonth.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground w-32 text-center">
                      {formatMonthYear(timelineMonths[0])} — {formatMonthYear(timelineMonths[MONTHS_SHOWN - 1])}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setTimelineStartMonth(new Date(timelineStartMonth.getFullYear(), timelineStartMonth.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
                  {[
                    { label: 'Planning', color: 'bg-indigo-500' },
                    { label: 'Design', color: 'bg-purple-500' },
                    { label: 'Execution', color: 'bg-amber-500' },
                    { label: 'Procurement', color: 'bg-cyan-500' },
                    { label: 'Completed', color: 'bg-emerald-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`h-2 w-4 rounded-sm ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Month Headers */}
                    <div className="flex border-b border-brand-indigo/20">
                      <div className="w-40 shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground">
                        Team Member
                      </div>
                      <div className="flex-1 grid grid-cols-8">
                        {timelineMonths.map((month, i) => (
                          <div key={i} className="px-2 py-2 text-xs text-muted-foreground text-center border-l border-brand-indigo/10">
                            {formatMonthYear(month)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rows */}
                    {teamMembers.map((member, idx) => {
                      const activeAssignments = member.assignments.filter(a => a.status === 'active' || a.status === 'on-hold');
                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex border-b border-brand-indigo/10 hover:bg-brand-indigo/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedMember(member)}
                        >
                          {/* Member Info */}
                          <div className="w-40 shrink-0 px-4 py-3 flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${getAvatarGradient(member.name)} flex items-center justify-center shrink-0`}>
                              <span className="text-[10px] font-bold text-white">{getInitials(member.name)}</span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium truncate">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{roleLabel(member.role)}</p>
                            </div>
                          </div>

                          {/* Timeline Bars */}
                          <div className="flex-1 relative py-2">
                            {/* Grid lines */}
                            <div className="absolute inset-0 grid grid-cols-8">
                              {timelineMonths.map((_, i) => (
                                <div key={i} className="border-l border-brand-indigo/5 h-full" />
                              ))}
                            </div>

                            {/* Today marker */}
                            {(() => {
                              const now = new Date();
                              const totalMs = timelineMonths[timelineMonths.length - 1].getTime() - timelineMonths[0].getTime();
                              const offsetMs = now.getTime() - timelineMonths[0].getTime();
                              if (offsetMs >= 0 && offsetMs <= totalMs) {
                                const leftPct = (offsetMs / totalMs) * 100;
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 w-px bg-brand-cyan/40 z-10"
                                    style={{ left: `${leftPct}%` }}
                                  >
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-brand-cyan" />
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Assignment Bars */}
                            <div className="relative h-full flex flex-col justify-center gap-1 px-1">
                              {activeAssignments.length === 0 ? (
                                <div className="h-5 flex items-center">
                                  <span className="text-[10px] text-muted-foreground/40 italic">No assignments</span>
                                </div>
                              ) : (
                                activeAssignments.map((a) => {
                                  const pos = getBarPosition(a.startDate, a.endDate);
                                  return (
                                    <div key={a.id} className="h-5 relative" title={`${a.project.name} — ${roleLabel(a.role)} — ${a.allocation}%`}>
                                      <div
                                        className={`absolute top-0 h-full rounded-md ${getProjectStatusColor(a.project.status)} border ${getProjectStatusBorder(a.project.status)} flex items-center px-1.5 overflow-hidden group/bar hover:z-20 hover:h-auto hover:min-h-[20px] transition-all`}
                                        style={{ left: pos.left, width: pos.width, minWidth: '20px' }}
                                      >
                                        <span className="text-[9px] font-medium text-white truncate whitespace-nowrap">
                                          {a.project.name}
                                        </span>
                                        <span className="text-[8px] text-white/60 ml-1 shrink-0">
                                          {a.allocation}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ml-name">Name *</Label>
                <Input
                  id="ml-name"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ml-email">Email *</Label>
                <Input
                  id="ml-email"
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="email@studio.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={memberForm.role} onValueChange={(v) => setMemberForm({ ...memberForm, role: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={memberForm.status} onValueChange={(v) => setMemberForm({ ...memberForm, status: v })}>
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
                <Label htmlFor="ml-capacity">Capacity (%)</Label>
                <Input
                  id="ml-capacity"
                  type="number"
                  min={0}
                  max={100}
                  value={memberForm.capacity}
                  onChange={(e) => setMemberForm({ ...memberForm, capacity: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ml-phone">Phone</Label>
                <Input
                  id="ml-phone"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="+356 ..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMemberDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleMemberSubmit}
              disabled={submitting || !memberForm.name || !memberForm.email}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent className="glass-strong max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Add Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Team Member *</Label>
              <Select value={assignmentForm.teamMemberId} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, teamMemberId: v })}>
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((tm) => (
                    <SelectItem key={tm.id} value={tm.id}>{tm.name} — {roleLabel(tm.role)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={assignmentForm.projectId} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, projectId: v })}>
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={assignmentForm.role} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, role: v })}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentRoleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allocation (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={assignmentForm.allocation}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, allocation: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={assignmentForm.startDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, startDate: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={assignmentForm.endDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, endDate: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[60px]"
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignmentDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleAssignmentSubmit}
              disabled={submitting || !assignmentForm.teamMemberId || !assignmentForm.projectId}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
