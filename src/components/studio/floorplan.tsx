'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2, Square, Minus, DoorOpen, AppWindow, Armchair, Trash2,
  ZoomIn, ZoomOut, Save, Download, Plus, ArrowLeft, X, RotateCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

// Types
type Tool = 'select' | 'room' | 'wall' | 'door' | 'window' | 'furniture' | 'delete';

interface FloorplanItem {
  id: string;
  type: 'room' | 'wall' | 'door' | 'window' | 'furniture';
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  roomType?: string;
  furnitureType?: string;
  rotation: number;
  color: string;
}

interface FloorplanData {
  items: FloorplanItem[];
  zoom: number;
}

interface FloorplanRecord {
  id: string;
  name: string;
  projectId: string;
  data: string;
  thumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
}

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

const ROOM_TYPES = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Hallway', 'Dining Room', 'Office', 'Balcony', 'Utility'];
const ROOM_COLORS: Record<string, string> = {
  'Living Room': 'rgba(58, 12, 163, 0.25)',
  'Kitchen': 'rgba(0, 245, 212, 0.15)',
  'Bedroom': 'rgba(212, 175, 55, 0.15)',
  'Bathroom': 'rgba(0, 196, 167, 0.2)',
  'Hallway': 'rgba(155, 143, 194, 0.15)',
  'Dining Room': 'rgba(94, 23, 196, 0.2)',
  'Office': 'rgba(255, 107, 157, 0.15)',
  'Balcony': 'rgba(0, 245, 212, 0.1)',
  'Utility': 'rgba(155, 143, 194, 0.1)',
};

const FURNITURE_CATEGORIES = {
  Seating: [
    { name: 'Sofa', width: 80, height: 40, color: 'rgba(58, 12, 163, 0.4)', icon: '🛋️' },
    { name: 'Armchair', width: 40, height: 40, color: 'rgba(94, 23, 196, 0.4)', icon: '💺' },
    { name: 'Dining Chair', width: 20, height: 20, color: 'rgba(155, 143, 194, 0.3)', icon: '🪑' },
  ],
  Tables: [
    { name: 'Dining Table', width: 80, height: 50, color: 'rgba(212, 175, 55, 0.3)', icon: '🍽️' },
    { name: 'Coffee Table', width: 50, height: 30, color: 'rgba(212, 175, 55, 0.25)', icon: '☕' },
    { name: 'Desk', width: 60, height: 35, color: 'rgba(212, 175, 55, 0.2)', icon: '🖥️' },
    { name: 'Side Table', width: 25, height: 25, color: 'rgba(212, 175, 55, 0.2)', icon: '🔲' },
  ],
  Storage: [
    { name: 'Wardrobe', width: 70, height: 30, color: 'rgba(0, 196, 167, 0.3)', icon: '🗄️' },
    { name: 'Bookshelf', width: 50, height: 20, color: 'rgba(0, 196, 167, 0.25)', icon: '📚' },
    { name: 'Cabinet', width: 40, height: 25, color: 'rgba(0, 196, 167, 0.2)', icon: '📦' },
  ],
  Lighting: [
    { name: 'Floor Lamp', width: 20, height: 20, color: 'rgba(255, 215, 0, 0.3)', icon: '💡' },
    { name: 'Pendant Light', width: 25, height: 25, color: 'rgba(255, 215, 0, 0.25)', icon: '🔦' },
  ],
  Decor: [
    { name: 'Plant', width: 20, height: 20, color: 'rgba(0, 245, 212, 0.3)', icon: '🪴' },
    { name: 'Rug', width: 60, height: 40, color: 'rgba(155, 143, 194, 0.15)', icon: '🟫' },
  ],
};

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select', icon: <MousePointer2 className="size-4" />, label: 'Select' },
  { id: 'room', icon: <Square className="size-4" />, label: 'Room' },
  { id: 'wall', icon: <Minus className="size-4" />, label: 'Wall' },
  { id: 'door', icon: <DoorOpen className="size-4" />, label: 'Door' },
  { id: 'window', icon: <AppWindow className="size-4" />, label: 'Window' },
  { id: 'furniture', icon: <Armchair className="size-4" />, label: 'Furniture' },
  { id: 'delete', icon: <Trash2 className="size-4" />, label: 'Delete' },
];

export default function FloorplanEditor() {
  // State
  const [floorplans, setFloorplans] = useState<FloorplanRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFloorplan, setActiveFloorplan] = useState<FloorplanRecord | null>(null);
  const [items, setItems] = useState<FloorplanItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [placingFurniture, setPlacingFurniture] = useState<{ name: string; width: number; height: number; color: string; icon: string } | null>(null);
  const [furniturePanelOpen, setFurniturePanelOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [fpRes, projRes] = await Promise.all([
          fetch('/api/floorplans'),
          fetch('/api/projects'),
        ]);
        if (cancelled) return;
        if (fpRes.ok) {
          const data = await fpRes.json();
          if (!cancelled) setFloorplans(data);
        }
        if (projRes.ok) {
          const data = await projRes.json();
          if (!cancelled) {
            setProjects(data);
            if (data.length > 0 && !newProjectId) setNewProjectId(data[0].id);
          }
        }
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [newProjectId]);

  // Load floorplan data
  const openFloorplan = (fp: FloorplanRecord) => {
    setActiveFloorplan(fp);
    try {
      const data: FloorplanData = JSON.parse(fp.data);
      setItems(data.items || []);
      setZoom(data.zoom || 1);
    } catch {
      setItems([]);
      setZoom(1);
    }
  };

  // Save floorplan
  const saveFloorplan = async () => {
    if (!activeFloorplan) return;
    setSaving(true);
    try {
      const data: FloorplanData = { items, zoom };
      await fetch(`/api/floorplans/${activeFloorplan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      await fetchFloorplans();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // Create new floorplan
  const createFloorplan = async () => {
    if (!newName || !newProjectId) return;
    try {
      const res = await fetch('/api/floorplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, projectId: newProjectId, data: { items: [], zoom: 1 } }),
      });
      if (res.ok) {
        const fp = await res.json();
        setShowNewDialog(false);
        setNewName('');
        await fetchFloorplans();
        openFloorplan(fp);
      }
    } catch (e) { console.error(e); }
  };

  // Delete floorplan
  const deleteFloorplan = async (id: string) => {
    try {
      await fetch(`/api/floorplans/${id}`, { method: 'DELETE' });
      if (activeFloorplan?.id === id) setActiveFloorplan(null);
      await fetchFloorplans();
    } catch (e) { console.error(e); }
  };

  // Export as JSON
  const exportJSON = () => {
    const data: FloorplanData = { items, zoom };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFloorplan?.name || 'floorplan'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Canvas interactions
  const getCanvasPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (selectedTool === 'select') {
      // Check if clicking on an item
      const clickedItem = [...items].reverse().find(
        (item) => pos.x >= item.x && pos.x <= item.x + item.width && pos.y >= item.y && pos.y <= item.y + item.height
      );
      if (clickedItem) {
        setSelectedItem(clickedItem.id);
        setDragging(clickedItem.id);
        setDragOffset({ x: pos.x - clickedItem.x, y: pos.y - clickedItem.y });
      } else {
        setSelectedItem(null);
      }
      return;
    }

    if (selectedTool === 'delete') {
      const clickedItem = [...items].reverse().find(
        (item) => pos.x >= item.x && pos.x <= item.x + item.width && pos.y >= item.y && pos.y <= item.y + item.height
      );
      if (clickedItem) {
        setItems((prev) => prev.filter((i) => i.id !== clickedItem.id));
        setSelectedItem(null);
      }
      return;
    }

    if (selectedTool === 'room' || selectedTool === 'wall') {
      setDrawing(true);
      setDrawStart(pos);
      setDrawCurrent(pos);
      return;
    }

    if (selectedTool === 'door') {
      const newItem: FloorplanItem = {
        id: `door-${Date.now()}`,
        type: 'door',
        x: pos.x - 15,
        y: pos.y - 5,
        width: 30,
        height: 10,
        name: 'Door',
        rotation: 0,
        color: 'rgba(0, 245, 212, 0.5)',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItem(newItem.id);
      return;
    }

    if (selectedTool === 'window') {
      const newItem: FloorplanItem = {
        id: `window-${Date.now()}`,
        type: 'window',
        x: pos.x - 20,
        y: pos.y - 5,
        width: 40,
        height: 10,
        name: 'Window',
        rotation: 0,
        color: 'rgba(94, 23, 196, 0.5)',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItem(newItem.id);
      return;
    }

    if (selectedTool === 'furniture' && placingFurniture) {
      const newItem: FloorplanItem = {
        id: `furn-${Date.now()}`,
        type: 'furniture',
        x: pos.x - placingFurniture.width / 2,
        y: pos.y - placingFurniture.height / 2,
        width: placingFurniture.width,
        height: placingFurniture.height,
        name: placingFurniture.name,
        furnitureType: placingFurniture.name,
        rotation: 0,
        color: placingFurniture.color,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItem(newItem.id);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (drawing && drawStart) {
      setDrawCurrent(pos);
      return;
    }

    if (dragging) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === dragging ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : item
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (drawing && drawStart && drawCurrent) {
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      if (width > 10 && height > 10) {
        const roomType = selectedTool === 'room' ? 'Living Room' : 'Wall';
        const newItem: FloorplanItem = {
          id: `${selectedTool}-${Date.now()}`,
          type: selectedTool as 'room' | 'wall',
          x,
          y,
          width,
          height,
          name: roomType,
          roomType,
          rotation: 0,
          color: selectedTool === 'room' ? ROOM_COLORS[roomType] || 'rgba(58, 12, 163, 0.2)' : 'rgba(240, 236, 244, 0.6)',
        };
        setItems((prev) => [...prev, newItem]);
        setSelectedItem(newItem.id);
      }
    }
    setDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setDragging(null);
  };

  // Update item property
  const updateItemProperty = (id: string, key: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const selectedItemData = items.find((i) => i.id === selectedItem);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Floorplan List View
  if (!activeFloorplan) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-heading gradient-text">Floorplan Editor</h2>
            <p className="text-muted-foreground text-sm mt-1">Design and manage interactive 2D floor plans</p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glow-cyan bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30">
                <Plus className="size-4 mr-2" /> New Floorplan
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-brand-indigo/30">
              <DialogHeader>
                <DialogTitle className="gradient-text">Create New Floorplan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ground Floor Layout"
                    className="bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={newProjectId} onValueChange={setNewProjectId}>
                    <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20 w-full">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNewDialog(false)}>Cancel</Button>
                <Button onClick={createFloorplan} disabled={!newName || !newProjectId} className="bg-brand-indigo hover:bg-brand-indigo-light">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {floorplans.length === 0 ? (
          <Card className="glass-card border-brand-indigo/20">
            <CardContent className="py-16 text-center">
              <Square className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Floorplans Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Create your first floorplan to start designing room layouts, placing furniture, and visualizing spaces.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorplans.map((fp) => (
              <motion.div
                key={fp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => openFloorplan(fp)}
              >
                <Card className="glass-card border-brand-indigo/20 hover:border-brand-cyan/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{fp.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteFloorplan(fp.id); }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="floorplan-grid rounded-lg h-32 mb-3 overflow-hidden relative bg-brand-surface">
                      {(() => {
                        try {
                          const data: FloorplanData = JSON.parse(fp.data);
                          return (data.items || []).slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="absolute rounded-sm border border-white/10"
                              style={{
                                left: `${Math.min(item.x / 6, 90)}%`,
                                top: `${Math.min(item.y / 4, 80)}%`,
                                width: `${Math.min(item.width / 6, 50)}%`,
                                height: `${Math.min(item.height / 4, 50)}%`,
                                background: item.color,
                              }}
                            />
                          ));
                        } catch { return null; }
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs status-design">{fp.project.name}</Badge>
                      <span>{new Date(fp.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Editor View
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="glass-strong border-b border-brand-indigo/20 px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { setActiveFloorplan(null); setSelectedItem(null); }} className="mr-2">
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h3 className="text-sm font-semibold ml-2 mr-4 truncate max-w-48">{activeFloorplan.name}</h3>

        <TooltipProvider>
          <div className="flex items-center gap-1 bg-brand-surface-light/50 rounded-lg p-1">
            {TOOLS.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`size-8 p-0 ${selectedTool === tool.id ? 'bg-brand-indigo text-white' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      if (tool.id !== 'furniture') setPlacingFurniture(null);
                    }}
                  >
                    {tool.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
            <ZoomIn className="size-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={exportJSON}>
          <Download className="size-4 mr-1" /> Export
        </Button>
        <Button size="sm" className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30" onClick={saveFloorplan} disabled={saving}>
          <Save className="size-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-brand-surface">
          <div
            ref={canvasRef}
            className={`floorplan-grid absolute inset-0 ${selectedTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* Items */}
            {items.map((item) => (
              <div
                key={item.id}
                className={`absolute border transition-shadow ${
                  selectedItem === item.id
                    ? 'border-brand-cyan shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                    : item.type === 'room'
                    ? 'border-white/20'
                    : 'border-white/15'
                }`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  background: item.color,
                  transform: `rotate(${item.rotation}deg)`,
                  cursor: selectedTool === 'select' ? 'move' : undefined,
                  zIndex: item.type === 'room' ? 1 : item.type === 'furniture' ? 3 : 2,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'select') setSelectedItem(item.id);
                  if (selectedTool === 'delete') {
                    setItems((prev) => prev.filter((i) => i.id !== item.id));
                    setSelectedItem(null);
                  }
                }}
              >
                {/* Room label */}
                {item.type === 'room' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white/70 truncate px-1">
                      {item.name}
                    </span>
                  </div>
                )}
                {/* Furniture icon */}
                {item.type === 'furniture' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm">
                      {Object.values(FURNITURE_CATEGORIES).flat().find((f) => f.name === item.furnitureType)?.icon || '📦'}
                    </span>
                  </div>
                )}
                {/* Door arc indicator */}
                {item.type === 'door' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr-full" />
                  </div>
                )}
                {/* Window indicator */}
                {item.type === 'window' && (
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan/50" />
                  </div>
                )}
                {/* Measurement */}
                {item.type === 'room' && (item.width > 60 || item.height > 40) && (
                  <>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-white/40 whitespace-nowrap">
                      {(item.width / 20).toFixed(1)}m
                    </div>
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-[8px] text-white/40 whitespace-nowrap">
                      {(item.height / 20).toFixed(1)}m
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Drawing preview */}
            {drawing && drawStart && drawCurrent && (
              <div
                className="absolute border-2 border-dashed border-brand-cyan/60 bg-brand-cyan/5"
                style={{
                  left: Math.min(drawStart.x, drawCurrent.x),
                  top: Math.min(drawStart.y, drawCurrent.y),
                  width: Math.abs(drawCurrent.x - drawStart.x),
                  height: Math.abs(drawCurrent.y - drawStart.y),
                }}
              />
            )}

            {/* Placing furniture indicator */}
            {placingFurniture && selectedTool === 'furniture' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-strong rounded-lg px-3 py-1.5 text-xs text-brand-cyan z-10">
                Click on canvas to place: {placingFurniture.icon} {placingFurniture.name}
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-64 glass-strong border-l border-brand-indigo/20 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-brand-indigo/10">
            <h4 className="text-sm font-semibold text-muted-foreground">Properties</h4>
          </div>
          <ScrollArea className="flex-1">
            {selectedItemData ? (
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={selectedItemData.name}
                    onChange={(e) => updateItemProperty(selectedItemData.id, 'name', e.target.value)}
                    className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                  />
                </div>
                {selectedItemData.type === 'room' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Room Type</Label>
                    <Select
                      value={selectedItemData.roomType || 'Living Room'}
                      onValueChange={(v) => {
                        updateItemProperty(selectedItemData.id, 'roomType', v);
                        updateItemProperty(selectedItemData.id, 'name', v);
                        updateItemProperty(selectedItemData.id, 'color', ROOM_COLORS[v] || 'rgba(58, 12, 163, 0.2)');
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={selectedItemData.x}
                      onChange={(e) => updateItemProperty(selectedItemData.id, 'x', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={selectedItemData.y}
                      onChange={(e) => updateItemProperty(selectedItemData.id, 'y', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={selectedItemData.width}
                      onChange={(e) => updateItemProperty(selectedItemData.id, 'width', parseInt(e.target.value) || 10)}
                      className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Height</Label>
                    <Input
                      type="number"
                      value={selectedItemData.height}
                      onChange={(e) => updateItemProperty(selectedItemData.id, 'height', parseInt(e.target.value) || 10)}
                      className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rotation</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedItemData.rotation}
                      onChange={(e) => updateItemProperty(selectedItemData.id, 'rotation', parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-brand-surface-light border-brand-indigo/20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => updateItemProperty(selectedItemData.id, 'rotation', (selectedItemData.rotation + 90) % 360)}
                    >
                      <RotateCw className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {selectedItemData.type === 'room' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t border-brand-indigo/10 space-y-1">
                    <p>📐 {(selectedItemData.width / 20).toFixed(1)}m × {(selectedItemData.height / 20).toFixed(1)}m</p>
                    <p>📊 {(selectedItemData.width * selectedItemData.height / 400).toFixed(1)}m² area</p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-xs mt-2"
                  onClick={() => {
                    setItems((prev) => prev.filter((i) => i.id !== selectedItemData.id));
                    setSelectedItem(null);
                  }}
                >
                  <Trash2 className="size-3.5 mr-1" /> Delete Item
                </Button>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs">
                {selectedTool === 'select'
                  ? 'Select an item to view properties'
                  : selectedTool === 'room'
                  ? 'Click and drag to draw a room'
                  : selectedTool === 'furniture'
                  ? 'Choose furniture from the palette below, then click on canvas to place'
                  : `Click on canvas to place a ${selectedTool}`}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Furniture Palette */}
      <AnimatePresence>
        {furniturePanelOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="glass-strong border-t border-brand-indigo/20 overflow-hidden flex-shrink-0"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Furniture Palette</h4>
                <Button variant="ghost" size="sm" className="size-6 p-0 text-muted-foreground" onClick={() => setFurniturePanelOpen(false)}>
                  <X className="size-3" />
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {Object.entries(FURNITURE_CATEGORIES).map(([category, furnitureItems]) => (
                  <div key={category} className="flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">{category}</p>
                    <div className="flex gap-1.5">
                      {furnitureItems.map((fi) => (
                        <Button
                          key={fi.name}
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 text-xs gap-1 ${
                            placingFurniture?.name === fi.name
                              ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                              : 'text-muted-foreground hover:text-foreground bg-brand-surface-light/50'
                          }`}
                          onClick={() => {
                            setSelectedTool('furniture');
                            setPlacingFurniture(fi);
                          }}
                        >
                          <span>{fi.icon}</span> {fi.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Furniture panel toggle when closed */}
      {!furniturePanelOpen && (
        <div className="glass-strong border-t border-brand-indigo/20 p-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setFurniturePanelOpen(true)}
          >
            <Armchair className="size-3.5 mr-1" /> Show Furniture Palette
          </Button>
        </div>
      )}
    </motion.div>
  );
}
