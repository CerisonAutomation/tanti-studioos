'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Inbox,
  PenTool,
  ShoppingCart,
  Sparkles,
  Bot,
  Settings,
  Plus,
  Search,
  Clock,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { useAppStore, type ActiveModule } from '@/lib/store';

interface SearchItem {
  id: string;
  name: string;
  type: 'client' | 'project' | 'quote';
  module: ActiveModule;
}

const modules: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'quotes', label: 'Quotes & Proposals', icon: <FileText className="h-4 w-4" /> },
  { id: 'inbox', label: 'AI Inbox', icon: <Inbox className="h-4 w-4" /> },
  { id: 'floorplan', label: 'Floor Plans', icon: <PenTool className="h-4 w-4" /> },
  { id: 'procurement', label: 'Procurement', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'ai-design', label: 'AI Design', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4 w-4" /> },
];

export default function CommandPalette() {
  const { commandOpen, setCommandOpen, setActiveModule } = useAppStore();
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);

  const fetchSearchData = useCallback(async () => {
    try {
      const [clientsRes, projectsRes, quotesRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/projects'),
        fetch('/api/quotes'),
      ]);
      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();
      const quotesData = await quotesRes.json();

      const clientsList = (clientsData.clients || clientsData || []).slice(0, 10).map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
        type: 'client' as const,
        module: 'clients' as ActiveModule,
      }));
      const projectsList = (projectsData.projects || projectsData || []).slice(0, 10).map((p: { id: string; name: string }) => ({
        id: p.id,
        name: p.name,
        type: 'project' as const,
        module: 'projects' as ActiveModule,
      }));
      const quotesList = (quotesData.quotes || quotesData || []).slice(0, 10).map((q: { id: string; title: string }) => ({
        id: q.id,
        name: q.title,
        type: 'quote' as const,
        module: 'quotes' as ActiveModule,
      }));

      return [...clientsList, ...projectsList, ...quotesList];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (commandOpen) {
      fetchSearchData().then((items) => {
        setSearchItems(items);
      });
    }
  }, [commandOpen, fetchSearchData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandOpen, setCommandOpen]);

  const handleSelect = (targetModule: ActiveModule) => {
    setActiveModule(targetModule);
    setCommandOpen(false);
  };

  const clients = searchItems.filter((i) => i.type === 'client');
  const projects = searchItems.filter((i) => i.type === 'project');
  const quotes = searchItems.filter((i) => i.type === 'quote');

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      title="Command Palette"
      description="Search across clients, projects, quotes, and navigate modules"
      className="glass-strong border-border/30"
    >
      <CommandInput placeholder="Search clients, projects, quotes, or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect('clients')} className="cursor-pointer">
            <Plus className="h-4 w-4 text-brand-cyan" />
            <span>New Client</span>
            <CommandShortcut>⇧C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('projects')} className="cursor-pointer">
            <Plus className="h-4 w-4 text-brand-indigo-light" />
            <span>New Project</span>
            <CommandShortcut>⇧P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('quotes')} className="cursor-pointer">
            <Plus className="h-4 w-4 text-brand-gold" />
            <span>New Quote</span>
            <CommandShortcut>⇧Q</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {modules.map((mod) => (
            <CommandItem key={mod.id} onSelect={() => handleSelect(mod.id)} className="cursor-pointer">
              {mod.icon}
              <span>{mod.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {clients.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.module)} className="cursor-pointer">
                  <Users className="h-4 w-4 text-brand-gold" />
                  <span>{item.name}</span>
                  <Badge className="ml-auto bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[10px]">Client</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.module)} className="cursor-pointer">
                  <FolderKanban className="h-4 w-4 text-brand-indigo-light" />
                  <span>{item.name}</span>
                  <Badge className="ml-auto bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30 text-[10px]">Project</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {quotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quotes">
              {quotes.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item.module)} className="cursor-pointer">
                  <FileText className="h-4 w-4 text-brand-cyan" />
                  <span>{item.name}</span>
                  <Badge className="ml-auto bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30 text-[10px]">Quote</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Recent Items */}
        <CommandGroup heading="Recent">
          <CommandItem onSelect={() => handleSelect('dashboard')} className="cursor-pointer">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Dashboard Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('inbox')} className="cursor-pointer">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Check Unread Messages</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
