'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  FolderKanban,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, type ActiveModule } from '@/lib/store';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  project: { name: string };
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
    case 'message': return <MessageSquare className="h-4 w-4" />;
    case 'milestone': return <CheckCircle2 className="h-4 w-4" />;
    case 'quote': return <FileText className="h-4 w-4" />;
    case 'note': return <AlertCircle className="h-4 w-4" />;
    case 'created': return <Users className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
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

function getModuleForType(type: string): ActiveModule {
  switch (type) {
    case 'message': return 'inbox';
    case 'milestone': return 'projects';
    case 'quote': return 'quotes';
    case 'created': return 'clients';
    default: return 'dashboard';
  }
}

export default function NotificationPanel({
  open,
  onOpenChange,
  unreadCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
}) {
  const { setActiveModule } = useAppStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readItems, setReadItems] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [actRes, tasksRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/tasks'),
      ]);
      const actData = await actRes.json();
      const tasksData = await tasksRes.json();
      setActivities((actData.activities || actData || []).slice(0, 15));
      setUpcomingDeadlines(
        (tasksData.tasks || tasksData || [])
          .filter((t: TaskItem) => t.dueDate && t.status !== 'completed')
          .slice(0, 5)
      );
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const markAllRead = () => {
    setReadItems(new Set(activities.map((a) => a.id)));
  };

  const handleActivityClick = (type: string) => {
    const targetModule = getModuleForType(type);
    setActiveModule(targetModule);
    onOpenChange(false);
  };

  const handleDeadlineClick = () => {
    setActiveModule('projects');
    onOpenChange(false);
  };

  const unreadActivities = activities.filter((a) => !readItems.has(a.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md glass-strong border-l border-border/30 p-0">
        <SheetHeader className="p-4 pb-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base font-['Space_Grotesk']">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px]">
                  {unreadActivities.length} new
                </Badge>
              )}
            </div>
            {unreadActivities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                className="text-brand-cyan hover:text-brand-cyan text-xs h-7"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Recent activity, messages, and upcoming deadlines
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-muted/30" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-muted/30 rounded" />
                    <div className="h-2 w-1/3 bg-muted/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Unread Messages Section */}
              {unreadCount > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-brand-cyan" />
                    <h3 className="text-sm font-semibold font-['Space_Grotesk']">Unread Messages</h3>
                    <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px]">{unreadCount}</Badge>
                  </div>
                  <button
                    onClick={() => handleActivityClick('message')}
                    className="w-full p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 hover:border-brand-cyan/40 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-brand-cyan">{unreadCount} unread messages</p>
                      <ExternalLink className="h-3.5 w-3.5 text-brand-cyan" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Click to open AI Inbox</p>
                  </button>
                </div>
              )}

              {/* Recent Activity Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-brand-gold" />
                  <h3 className="text-sm font-semibold font-['Space_Grotesk']">Recent Activity</h3>
                </div>
                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    activities.map((activity) => {
                      const isRead = readItems.has(activity.id);
                      return (
                        <button
                          key={activity.id}
                          onClick={() => handleActivityClick(activity.type)}
                          className={`w-full flex gap-3 p-3 rounded-xl border transition-colors text-left ${
                            isRead
                              ? 'bg-brand-surface-light/20 border-border/10 opacity-60'
                              : 'bg-brand-surface-light/30 border-border/20 hover:border-border/40'
                          }`}
                        >
                          <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug truncate">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.createdAt)}</p>
                          </div>
                          {!isRead && <span className="shrink-0 h-2 w-2 rounded-full bg-brand-cyan mt-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines Section */}
              {upcomingDeadlines.length > 0 && (
                <>
                  <Separator className="bg-border/20" />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-brand-indigo-light" />
                      <h3 className="text-sm font-semibold font-['Space_Grotesk']">Upcoming Deadlines</h3>
                    </div>
                    <div className="space-y-2">
                      {upcomingDeadlines.map((task) => {
                        const priorityColors: Record<string, string> = {
                          urgent: 'bg-red-500',
                          high: 'bg-brand-gold',
                          medium: 'bg-brand-cyan',
                          low: 'bg-muted-foreground',
                        };
                        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                        const isOverdue = dueDate ? dueDate < new Date() : false;
                        return (
                          <button
                            key={task.id}
                            onClick={handleDeadlineClick}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-surface-light/30 border border-border/20 hover:border-border/40 transition-colors text-left"
                          >
                            <span className={`shrink-0 h-2 w-2 rounded-full ${priorityColors[task.priority] || priorityColors.medium}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.project?.name || 'No project'}</p>
                            </div>
                            {dueDate && (
                              <div className="shrink-0 text-right">
                                <p className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {isOverdue ? 'Overdue' : dueDate.toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">{timeAgo(task.dueDate!)}</span>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Links */}
              <Separator className="bg-border/20" />
              <div>
                <h3 className="text-sm font-semibold font-['Space_Grotesk'] mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" /> Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Clients', icon: <Users className="h-4 w-4" />, module: 'clients' as ActiveModule, color: 'text-brand-gold' },
                    { label: 'Projects', icon: <FolderKanban className="h-4 w-4" />, module: 'projects' as ActiveModule, color: 'text-brand-indigo-light' },
                    { label: 'Quotes', icon: <FileText className="h-4 w-4" />, module: 'quotes' as ActiveModule, color: 'text-brand-cyan' },
                    { label: 'Inbox', icon: <MessageSquare className="h-4 w-4" />, module: 'inbox' as ActiveModule, color: 'text-green-400' },
                  ].map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        setActiveModule(link.module);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl bg-brand-surface-light/30 border border-border/20 hover:border-brand-cyan/30 transition-colors text-left"
                    >
                      <span className={link.color}>{link.icon}</span>
                      <span className="text-xs font-medium">{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
