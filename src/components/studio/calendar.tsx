'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  MapPin,
  Users,
  Eye,
  Trash2,
  Edit,
  AlertCircle,
  Truck,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  location?: string;
  clientId?: string;
  projectId?: string;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent: number;
}

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting', color: '#00F5D4', bg: 'rgba(0, 245, 212, 0.15)', icon: Users },
  { value: 'deadline', label: 'Deadline', color: '#FF4757', bg: 'rgba(255, 71, 87, 0.15)', icon: AlertCircle },
  { value: 'delivery', label: 'Delivery', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', icon: Truck },
  { value: 'review', label: 'Review', color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.15)', icon: Eye },
  { value: 'milestone', label: 'Milestone', color: '#3A0CA3', bg: 'rgba(58, 12, 163, 0.2)', icon: Flag },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getTypeConfig(type: string) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

export default function CalendarModule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'timeline'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('meeting');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndDate, setFormEndDate] = useState('');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formLocation, setFormLocation] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      params.set('startAfter', monthStart.toISOString());
      params.set('startBefore', monthEnd.toISOString());
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();
      return data.events || [];
    } catch {
      return [];
    }
  }, [currentDate, filterType]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      return Array.isArray(data) ? data : (data.projects || []);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchEvents(), fetchProjects()]).then(([evts, projs]) => {
      if (mounted) {
        setEvents(evts);
        setProjects(projs);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [fetchEvents, fetchProjects]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      const d = new Date(e.startDate);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const openCreate = (day?: number) => {
    const d = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : new Date();
    const dateStr = d.toISOString().split('T')[0];
    setFormTitle('');
    setFormType('meeting');
    setFormStartDate(dateStr);
    setFormStartTime('09:00');
    setFormEndDate(dateStr);
    setFormAllDay(false);
    setFormLocation('');
    setFormProjectId('');
    setFormDescription('');
    setIsEditing(false);
    setEditingId('');
    setCreateDate(dateStr);
    setShowCreate(true);
  };

  const openEdit = (event: CalendarEvent) => {
    const sd = new Date(event.startDate);
    setFormTitle(event.title);
    setFormType(event.type);
    setFormStartDate(sd.toISOString().split('T')[0]);
    setFormStartTime(sd.toISOString().split('T')[1]?.substring(0, 5) || '09:00');
    setFormEndDate(event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '');
    setFormAllDay(event.allDay);
    setFormLocation(event.location || '');
    setFormProjectId(event.projectId || '');
    setFormDescription(event.description || '');
    setIsEditing(true);
    setEditingId(event.id);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error('Title is required'); return; }

    const startDate = formAllDay ? `${formStartDate}T00:00:00` : `${formStartDate}T${formStartTime}:00`;
    const endDate = formEndDate ? (formAllDay ? `${formEndDate}T23:59:00` : `${formEndDate}T${formStartTime}:00`) : null;

    const payload = {
      title: formTitle,
      type: formType,
      startDate,
      endDate,
      allDay: formAllDay,
      location: formLocation || undefined,
      projectId: formProjectId || null,
      description: formDescription || undefined,
    };

    try {
      if (isEditing && editingId) {
        await fetch(`/api/calendar/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        toast.success('Event updated');
      } else {
        await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        toast.success('Event created');
      }
      setShowCreate(false);
      fetchEvents().then(evts => setEvents(evts));
    } catch {
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
      toast.success('Event deleted');
      setSelectedEvent(null);
      fetchEvents().then(evts => setEvents(evts));
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const calendarDays: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, month: month - 1, year, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, month, year, isCurrentMonth: true });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, month: month + 1, year, isCurrentMonth: false });
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="shimmer h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Calendar</h2>
          <div className="gradient-line w-24" />
        </div>
        <div className="flex items-center gap-3">
          {/* Type filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-8 text-xs glass-card">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EVENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* View toggle */}
          <div className="flex items-center glass-card rounded-lg overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'month' ? 'bg-brand-indigo/30 text-brand-cyan' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'timeline' ? 'bg-brand-indigo/30 text-brand-cyan' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Timeline
            </button>
          </div>
          <Button onClick={() => openCreate()} size="sm" className="bg-brand-indigo hover:bg-brand-indigo-light text-white gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Event
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      {view === 'month' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold font-['Space_Grotesk'] min-w-[200px] text-center">
              {MONTHS[month]} {year}
            </h3>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/10">
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" /> Today
          </Button>
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="glass-card card-shine rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/20">
            {DAYS.map(day => (
              <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground font-['Space_Grotesk'] uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cd, idx) => {
              const dayEvents = cd.isCurrentMonth ? getEventsForDay(cd.day) : [];
              const today = isToday(cd.day) && cd.isCurrentMonth;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.005 }}
                  className={`calendar-day p-1.5 ${!cd.isCurrentMonth ? 'calendar-day-other' : ''} ${today ? 'calendar-day-today' : ''}`}
                  onClick={() => cd.isCurrentMonth && dayEvents.length === 0 && openCreate(cd.day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${today ? 'h-6 w-6 rounded-full bg-brand-cyan text-background flex items-center justify-center font-bold' : 'text-muted-foreground'}`}>
                      {cd.day}
                    </span>
                    {cd.isCurrentMonth && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreate(cd.day); }}
                        className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors opacity-0 group-hover:opacity-100"
                        style={{ opacity: cd.isCurrentMonth ? 0.3 : 0 }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5 max-h-[70px] overflow-y-auto">
                    {dayEvents.slice(0, 3).map(event => {
                      const typeConf = getTypeConfig(event.type);
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          className="calendar-event-pill"
                          style={{ background: typeConf.bg, color: typeConf.color, borderLeft: `2px solid ${typeConf.color}` }}
                        >
                          {event.allDay ? '' : new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }) + ' '}
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline / Gantt View */}
      {view === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold font-['Space_Grotesk']">
                {MONTHS[month]} {year}
              </h3>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="glass-card card-shine rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-semibold font-['Space_Grotesk'] text-muted-foreground uppercase tracking-wider">Project Timelines</h4>
            <div className="space-y-3">
              {projects.map(project => {
                const statusColors: Record<string, string> = {
                  planning: '#3A0CA3', design: '#5E17C4', procurement: '#00F5D4',
                  execution: '#D4AF37', delivered: '#22C55E',
                };
                const color = statusColors[project.status] || '#9B8FC2';
                const start = project.startDate ? new Date(project.startDate) : new Date(year, month, 1);
                const end = project.endDate ? new Date(project.endDate) : new Date(year, month, daysInMonth);
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                const totalDays = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
                const startOffset = Math.max(0, (start.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
                const duration = Math.min(totalDays - startOffset, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const widthPct = Math.max(5, (duration / totalDays) * 100);
                const leftPct = (startOffset / totalDays) * 100;
                const budgetPct = project.budget ? (project.spent / project.budget) * 100 : 0;

                return (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{project.status}</p>
                    </div>
                    <div className="flex-1 relative h-7">
                      <div className="absolute inset-0 rounded bg-brand-surface-light/30">
                        {/* Day grid lines */}
                        {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                          <div key={i} className="absolute top-0 bottom-0 w-px bg-border/10" style={{ left: `${(i * 7 / totalDays) * 100}%` }} />
                        ))}
                      </div>
                      <div
                        className="gantt-bar absolute"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          background: `linear-gradient(135deg, ${color}, ${color}88)`,
                          color: color,
                        }}
                      >
                        <div className="px-2 h-full flex items-center">
                          <span className="text-[10px] font-medium text-white/90 truncate">{project.name}</span>
                        </div>
                        {/* Budget progress overlay */}
                        {project.budget && (
                          <div
                            className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b"
                            style={{ width: `${Math.min(100, budgetPct)}%` }}
                          />
                        )}
                      </div>
                    </div>
                    {project.budget && (
                      <div className="w-24 shrink-0 text-right">
                        <p className="text-[10px] text-muted-foreground">€{(project.spent / 1000).toFixed(0)}k / €{(project.budget / 1000).toFixed(0)}k</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="section-divider" />
            <h4 className="text-sm font-semibold font-['Space_Grotesk'] text-muted-foreground uppercase tracking-wider">Upcoming Events</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No events this month</p>}
              {events.map(event => {
                const typeConf = getTypeConfig(event.type);
                const Icon = typeConf.icon;
                return (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg glass-hover card-interactive" onClick={() => setSelectedEvent(event)}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: typeConf.bg }}>
                      <Icon className="h-4 w-4" style={{ color: typeConf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(event.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        {!event.allDay && <span>{new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>}
                        {event.projectId && <span className="text-brand-cyan">• {projects.find(p => p.id === event.projectId)?.name || 'Project'}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0" style={{ color: typeConf.color, borderColor: typeConf.color + '40' }}>
                      {typeConf.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="glass-premium border-brand-cyan/20 max-w-md">
          {selectedEvent && (() => {
            const typeConf = getTypeConfig(selectedEvent.type);
            const Icon = typeConf.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-['Space_Grotesk']">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: typeConf.bg }}>
                      <Icon className="h-4 w-4" style={{ color: typeConf.color }} />
                    </div>
                    {selectedEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Badge style={{ background: typeConf.bg, color: typeConf.color, border: `1px solid ${typeConf.color}40` }}>
                      {typeConf.label}
                    </Badge>
                    {selectedEvent.allDay && <Badge variant="outline" className="text-[10px]">All Day</Badge>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(selectedEvent.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {!selectedEvent.allDay && (
                        <span>{new Date(selectedEvent.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                      )}
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    {selectedEvent.projectId && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flag className="h-4 w-4" />
                        <span className="text-brand-cyan">{projects.find(p => p.id === selectedEvent.projectId)?.name || 'Project'}</span>
                      </div>
                    )}
                  </div>
                  {selectedEvent.description && (
                    <div className="glass-card rounded-lg p-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => { openEdit(selectedEvent); setSelectedEvent(null); }} className="text-xs gap-1.5">
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(selectedEvent.id)} className="text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/20">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Event Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass-premium border-brand-cyan/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">{isEditing ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Event title" className="mt-1 h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              {!formAllDay && (
                <div>
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <Input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="mt-1 h-9 text-sm" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formAllDay} onCheckedChange={setFormAllDay} />
              <Label className="text-xs text-muted-foreground">All Day</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Optional location" className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Optional notes" className="mt-1 text-sm h-20" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} size="sm" className="bg-brand-indigo hover:bg-brand-indigo-light text-white">
                {isEditing ? 'Update Event' : 'Create Event'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
