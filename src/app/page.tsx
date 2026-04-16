'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Inbox,
  PenTool,
  ShoppingCart,
  Sparkles,
  Settings,
  Menu,
  X,
  Bot,
  ChevronRight,
  Search,
  Bell,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, type ActiveModule } from '@/lib/store';

// Module imports
import DashboardModule from '@/components/studio/dashboard';
import ClientsModule from '@/components/studio/clients';
import ProjectsModule from '@/components/studio/projects';
import QuotesModule from '@/components/studio/quotes';
import InboxModule from '@/components/studio/inbox';
import FloorplanModule from '@/components/studio/floorplan';
import ProcurementModule from '@/components/studio/procurement';
import AiDesignModule from '@/components/studio/ai-design';
import AgentsModule from '@/components/studio/agents';
import SettingsModule from '@/components/studio/settings';
import CommandPalette from '@/components/studio/command-palette';
import NotificationPanel from '@/components/studio/notifications';

const navItems: { id: ActiveModule; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="h-5 w-5" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-5 w-5" /> },
  { id: 'quotes', label: 'Quotes & Proposals', icon: <FileText className="h-5 w-5" /> },
  { id: 'inbox', label: 'AI Inbox', icon: <Inbox className="h-5 w-5" />, badge: '4' },
  { id: 'floorplan', label: 'Floor Plans', icon: <PenTool className="h-5 w-5" /> },
  { id: 'procurement', label: 'Procurement', icon: <ShoppingCart className="h-5 w-5" /> },
  { id: 'ai-design', label: 'AI Design', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-5 w-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
];

export default function Home() {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen, setCommandOpen } = useAppStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    fetch('/api/messages?status=unread')
      .then(r => r.json())
      .then(data => {
        const messages = data.messages || data;
        setUnreadCount(Array.isArray(messages) ? messages.length : 0);
      })
      .catch(() => {});
  }, [activeModule]);

  // Keyboard shortcut: Ctrl+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandOpen]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'clients':
        return <ClientsModule />;
      case 'projects':
        return <ProjectsModule />;
      case 'quotes':
        return <QuotesModule />;
      case 'inbox':
        return <InboxModule />;
      case 'floorplan':
        return <FloorplanModule />;
      case 'procurement':
        return <ProcurementModule />;
      case 'ai-design':
        return <AiDesignModule />;
      case 'agents':
        return <AgentsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="shrink-0 glass-strong flex flex-col h-screen sticky top-0 z-50"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-border/20">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-light flex items-center justify-center shrink-0 logo-pulse">
            <span className="text-white font-bold font-['Space_Grotesk'] text-sm tracking-tight">TI</span>
          </div>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <h1 className="font-bold font-['Space_Grotesk'] text-sm whitespace-nowrap tracking-wide">
                TANTI INTERIORS
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-brand-cyan whitespace-nowrap tracking-widest">STUDIOOS</p>
                <span className="pro-badge">PRO</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-1 px-2">
            {navItems.slice(0, 5).map((item) => {
              const isActive = activeModule === item.id;
              const itemBadge = item.id === 'inbox' && unreadCount > 0 ? String(unreadCount) : item.badge;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                    isActive
                      ? 'bg-brand-indigo/15 text-foreground glow-indigo'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand-surface-light/50'
                  }`}
                >
                  <div className={`shrink-0 transition-colors ${isActive ? 'text-brand-cyan' : 'text-muted-foreground group-hover:text-brand-cyan'}`}>
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="whitespace-nowrap flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {sidebarOpen && itemBadge && (
                    <Badge className="bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px] h-5 min-w-5 flex items-center justify-center">
                      {itemBadge}
                    </Badge>
                  )}
                  {isActive && sidebarOpen && (
                    <ChevronRight className="h-3 w-3 text-brand-cyan shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Divider */}
          <div className="nav-divider" />
          
          <nav className="space-y-1 px-2">
            {navItems.slice(5).map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                    isActive
                      ? 'bg-brand-indigo/15 text-foreground glow-indigo'
                      : 'text-muted-foreground hover:text-foreground hover:bg-brand-surface-light/50'
                  }`}
                >
                  <div className={`shrink-0 transition-colors ${isActive ? 'text-brand-cyan' : 'text-muted-foreground group-hover:text-brand-cyan'}`}>
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="whitespace-nowrap flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && sidebarOpen && (
                    <ChevronRight className="h-3 w-3 text-brand-cyan shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User + Toggle */}
        <div className="p-3 border-t border-border/20 space-y-2">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-indigo to-brand-cyan flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate">Tanti Admin</p>
                <p className="text-[10px] text-muted-foreground truncate">admin@tanti-interiors.com</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <X className="h-4 w-4 mr-2" /> : <Menu className="h-4 w-4" />}
            {sidebarOpen && <span className="text-xs">Collapse</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="shrink-0 h-14 glass flex items-center justify-between px-6 border-b border-border/20 z-40">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-muted-foreground hover:text-foreground -ml-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h2 className="font-semibold font-['Space_Grotesk'] text-sm">
              {navItems.find((n) => n.id === activeModule)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="relative text-muted-foreground hover:text-foreground h-8 gap-2 px-3"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Search</span>
              <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border border-border/40 bg-brand-surface-light/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground h-8 w-8"
              onClick={() => setNotificationOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand-cyan text-[10px] font-bold flex items-center justify-center text-background pulse-cyan">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              onClick={() => setActiveModule('ai-design')}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Module Content */}
        <div className="flex-1 overflow-auto">
          {renderModule()}
        </div>
      </main>

      {/* Command Palette Overlay */}
      <CommandPalette />

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        unreadCount={unreadCount}
      />
    </div>
  );
}
