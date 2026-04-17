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
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Palette,
  Sparkles,
  Image as ImageIcon,
  X,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  Wand2,
  Download,
  Check,
  Loader2,
  FolderKanban,
  Eye,
} from 'lucide-react';

// Types
interface MoodBoardItem {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  style: string;
  colorPalette: string[];
  images: string[];
  notes: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

// Style definitions
const STYLES = [
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'art-deco', label: 'Art Deco' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'scandi', label: 'Scandinavian' },
  { value: 'industrial', label: 'Industrial' },
] as const;

const STYLE_COLORS: Record<string, string> = {
  contemporary: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  mediterranean: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'art-deco': 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
  minimalist: 'bg-gray-400/15 text-gray-300 border-gray-400/30',
  scandi: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  industrial: 'bg-amber-600/15 text-amber-500 border-amber-600/30',
};

const STYLE_ACCENTS: Record<string, string> = {
  contemporary: 'border-l-brand-cyan',
  mediterranean: 'border-l-orange-500',
  'art-deco': 'border-l-brand-gold',
  minimalist: 'border-l-gray-400',
  scandi: 'border-l-sky-500',
  industrial: 'border-l-amber-600',
};

// Predefined color palettes per style
const STYLE_PALETTES: Record<string, { name: string; colors: string[] }> = {
  mediterranean: {
    name: 'Mediterranean Warmth',
    colors: ['#C75B39', '#6B8E4E', '#4A90B8', '#F5E6C8', '#8B6914'],
  },
  'art-deco': {
    name: 'Art Deco Glamour',
    colors: ['#1A1A1A', '#D4AF37', '#2E8B57', '#F5F0E1', '#8B0000'],
  },
  contemporary: {
    name: 'Contemporary Chic',
    colors: ['#6B7B8D', '#F8F9FA', '#008B8B', '#8B6914', '#2C3E50'],
  },
  minimalist: {
    name: 'Minimalist Zen',
    colors: ['#FFFFFF', '#D3D3D3', '#1A1A1A', '#C4A882', '#F5F0E1'],
  },
  scandi: {
    name: 'Scandinavian Calm',
    colors: ['#FFFFFF', '#B8C4C0', '#D4B896', '#7BA7BC', '#4A4A4A'],
  },
  industrial: {
    name: 'Industrial Edge',
    colors: ['#36454F', '#B7410E', '#A9A9A9', '#F5DEB3', '#556B2F'],
  },
};

const ROOM_TYPES = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Bathroom',
  'Dining Room',
  'Home Office',
  'Hallway',
  'Outdoor Terrace',
  'Studio',
  'Loft',
];

const styleLabel = (s: string) => {
  const found = STYLES.find((st) => st.value === s);
  return found ? found.label : s.charAt(0).toUpperCase() + s.slice(1);
};

export default function MoodBoardModule() {
  const [boards, setBoards] = useState<MoodBoardItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const [selectedBoard, setSelectedBoard] = useState<MoodBoardItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<MoodBoardItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI Inspiration state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiStyle, setAiStyle] = useState('contemporary');
  const [aiRoom, setAiRoom] = useState('Living Room');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<{ base64: string; prompt: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    style: 'contemporary',
    colorPalette: [] as string[],
    images: [] as string[],
    notes: '',
    isPublic: false,
  });
  const [colorInput, setColorInput] = useState('#000000');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (styleFilter !== 'all') params.set('style', styleFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/moodboards?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (err) {
      console.error('Failed to fetch mood boards:', err);
    } finally {
      setLoading(false);
    }
  }, [styleFilter, search]);

  // Fetch projects for dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Open add dialog
  const openAddDialog = () => {
    setEditingBoard(null);
    setFormData({
      title: '',
      description: '',
      projectId: '',
      style: 'contemporary',
      colorPalette: [],
      images: [],
      notes: '',
      isPublic: false,
    });
    setColorInput('#000000');
    setImageUrlInput('');
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (board: MoodBoardItem) => {
    setEditingBoard(board);
    setFormData({
      title: board.title,
      description: board.description || '',
      projectId: board.projectId || '',
      style: board.style,
      colorPalette: [...board.colorPalette],
      images: [...board.images],
      notes: board.notes || '',
      isPublic: board.isPublic,
    });
    setColorInput('#000000');
    setImageUrlInput('');
    setDialogOpen(true);
  };

  // Add color to palette
  const addColor = () => {
    if (!formData.colorPalette.includes(colorInput)) {
      setFormData({ ...formData, colorPalette: [...formData.colorPalette, colorInput] });
    }
  };

  // Remove color from palette
  const removeColor = (color: string) => {
    setFormData({ ...formData, colorPalette: formData.colorPalette.filter((c) => c !== color) });
  };

  // Apply a predefined palette
  const applyPalette = (colors: string[]) => {
    setFormData({ ...formData, colorPalette: [...colors] });
  };

  // Add image URL
  const addImageUrl = () => {
    if (imageUrlInput.trim() && !formData.images.includes(imageUrlInput.trim())) {
      setFormData({ ...formData, images: [...formData.images, imageUrlInput.trim()] });
      setImageUrlInput('');
    }
  };

  // Remove image
  const removeImage = (img: string) => {
    setFormData({ ...formData, images: formData.images.filter((i) => i !== img) });
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.title) return;
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        projectId: formData.projectId || null,
        style: formData.style,
        colorPalette: formData.colorPalette,
        images: formData.images,
        notes: formData.notes || null,
        isPublic: formData.isPublic,
      };

      if (editingBoard) {
        const res = await fetch(`/api/moodboards/${editingBoard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setSelectedBoard(updated);
          fetchBoards();
        }
      } else {
        const res = await fetch('/api/moodboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchBoards();
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save mood board:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete board
  const handleDelete = async () => {
    if (!selectedBoard) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/moodboards/${selectedBoard.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedBoard(null);
        fetchBoards();
      }
    } catch (err) {
      console.error('Failed to delete mood board:', err);
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Generate AI inspiration image
  const generateAiImage = async () => {
    setAiGenerating(true);
    setAiGeneratedImage(null);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt || `${styleLabel(aiStyle)} interior design concept`,
          style: aiStyle,
          room: aiRoom,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiGeneratedImage({ base64: data.base64, prompt: data.prompt });
      }
    } catch (err) {
      console.error('Failed to generate AI image:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Add AI generated image to current board
  const addAiImageToBoard = async () => {
    if (!aiGeneratedImage || !selectedBoard) return;
    const newImages = [...selectedBoard.images, `data:image/png;base64,${aiGeneratedImage.base64}`];
    try {
      const res = await fetch(`/api/moodboards/${selectedBoard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newImages }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedBoard(updated);
        fetchBoards();
      }
    } catch (err) {
      console.error('Failed to add AI image to board:', err);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name || null;
  };

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedBoard) {
    const board = selectedBoard;

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
              onClick={() => setSelectedBoard(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${STYLE_COLORS[board.style] || 'bg-brand-indigo/15 border-brand-indigo/30'}`}>
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk']">{board.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`${STYLE_COLORS[board.style] || ''} text-[10px]`}>
                    {styleLabel(board.style)}
                  </Badge>
                  {board.isPublic ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <Globe className="h-2.5 w-2.5 mr-0.5" /> Public
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/15 text-gray-400 border-gray-500/30 text-[10px]">
                      <Lock className="h-2.5 w-2.5 mr-0.5" /> Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAiDialogOpen(true)}
              className="border-brand-cyan/30 hover:bg-brand-cyan/20 text-brand-cyan"
            >
              <Wand2 className="h-3.5 w-3.5 mr-1" />
              Generate Inspiration
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(board)}
              className="border-brand-indigo/30 hover:bg-brand-indigo/20"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Description */}
        {board.description && (
          <p className="text-sm text-muted-foreground max-w-3xl">{board.description}</p>
        )}

        {/* Project info */}
        {board.project && (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-brand-cyan" />
            <span className="text-sm text-muted-foreground">Project:</span>
            <Badge variant="outline" className="text-xs border-brand-cyan/30 text-brand-cyan">
              {board.project.name}
            </Badge>
          </div>
        )}

        {/* Color Palette */}
        {board.colorPalette.length > 0 && (
          <Card className="glass-card card-shine rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-['Space_Grotesk'] flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand-cyan" />
                Color Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-3">
                {board.colorPalette.map((color, i) => (
                  <motion.div
                    key={`${color}-${i}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-14 h-14 rounded-xl border-2 border-white/10 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images Grid */}
        <Card className="glass-card card-shine rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-['Space_Grotesk'] flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-brand-gold" />
              Visual Inspiration ({board.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {board.images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No images yet. Generate inspiration or add images via Edit.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAiDialogOpen(true)}
                  className="mt-3 border-brand-cyan/30 hover:bg-brand-cyan/20 text-brand-cyan"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Generate with AI
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {board.images.map((img, i) => (
                  <motion.div
                    key={`${img.substring(0, 20)}-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 group"
                  >
                    <img
                      src={img}
                      alt={`Inspiration ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70 text-white"
                        onClick={async () => {
                          const newImages = board.images.filter((_, idx) => idx !== i);
                          const res = await fetch(`/api/moodboards/${board.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ images: newImages }),
                          });
                          if (res.ok) {
                            const updated = await res.json();
                            setSelectedBoard(updated);
                            fetchBoards();
                          }
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {board.notes && (
          <Card className="glass-card rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Notes</p>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{board.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Style</p>
                <p className="text-sm font-medium">{styleLabel(board.style)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{formatDate(board.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium">{formatDate(board.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Images</p>
                <p className="text-sm font-medium">{board.images.length} visual{board.images.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Inspiration Dialog */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk'] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-cyan" />
                AI Visual Inspiration Generator
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Design Style</Label>
                <Select value={aiStyle} onValueChange={setAiStyle}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select value={aiRoom} onValueChange={setAiRoom}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Custom Prompt (optional)</Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                  placeholder="Describe your vision... e.g. 'Sunlit living room with terracotta tiles and exposed wooden beams'"
                />
              </div>

              {/* Style Color Reference */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Style Color Reference</Label>
                <div className="flex gap-1.5">
                  {STYLE_PALETTES[aiStyle]?.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg border border-white/10"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={generateAiImage}
                disabled={aiGenerating}
                className="w-full bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-90 text-white glow-indigo"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Visual Concept...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Visual Concept
                  </>
                )}
              </Button>

              {/* Generated Image */}
              {aiGeneratedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={`data:image/png;base64,${aiGeneratedImage.base64}`}
                      alt="AI Generated Inspiration"
                      className="w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-[60%]">
                      {aiGeneratedImage.prompt}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `data:image/png;base64,${aiGeneratedImage.base64}`;
                          link.download = `moodboard-inspiration-${Date.now()}.png`;
                          link.click();
                        }}
                        className="border-brand-gold/30 hover:bg-brand-gold/20 text-brand-gold"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        onClick={addAiImageToBoard}
                        className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add to Board
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="glass-strong max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">Delete Mood Board</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &ldquo;{board.title}&rdquo;? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
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

  // ==========================================
  // LIST VIEW
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
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Mood Boards</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {boards.length} board{boards.length !== 1 ? 's' : ''} — Visual inspiration & concept development
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAiDialogOpen(true)}
            variant="outline"
            className="border-brand-cyan/30 hover:bg-brand-cyan/20 text-brand-cyan"
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            AI Generate
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Board
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mood boards by title, description, or notes..."
          className="pl-9 bg-brand-surface-light border-brand-indigo/20"
        />
      </div>

      {/* Style Tabs */}
      <Tabs value={styleFilter} onValueChange={setStyleFilter}>
        <TabsList className="bg-brand-surface-light border border-brand-indigo/20 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan text-xs"
          >
            All
          </TabsTrigger>
          {STYLES.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan text-xs"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Color Palette Suggestions (shown when no search/filter active) */}
      {!search && styleFilter === 'all' && boards.length > 0 && (
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-3 font-medium flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Quick Palette Suggestions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(STYLE_PALETTES).map(([style, palette]) => (
                <button
                  key={style}
                  onClick={() => {
                    setStyleFilter(style);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-brand-surface-light/50 transition-colors group"
                >
                  <div className="flex gap-0.5">
                    {palette.colors.slice(0, 4).map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-white/10 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {palette.name}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Board Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-16 w-24 rounded-lg" />
                  <Skeleton className="h-16 w-24 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : boards.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <Palette className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">
              No mood boards found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || styleFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first mood board to start collecting visual inspiration'}
            </p>
            {!search && styleFilter === 'all' && (
              <Button
                onClick={openAddDialog}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Board
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {boards.map((board, i) => {
              const projectName = board.project?.name || getProjectName(board.projectId);
              return (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card
                    className={`glass-card card-shine glass-hover cursor-pointer rounded-xl transition-all group border-l-2 ${STYLE_ACCENTS[board.style] || 'border-l-brand-indigo'}`}
                    onClick={() => setSelectedBoard(board)}
                  >
                    <CardContent className="p-4">
                      {/* Title & Style */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-brand-cyan transition-colors">
                            {board.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${STYLE_COLORS[board.style] || ''} text-[10px]`}>
                              {styleLabel(board.style)}
                            </Badge>
                            {board.isPublic ? (
                              <Globe className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-brand-cyan transition-colors shrink-0 mt-1" />
                      </div>

                      {/* Description preview */}
                      {board.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-2">
                          {board.description}
                        </p>
                      )}

                      {/* Color Palette Swatches */}
                      {board.colorPalette.length > 0 && (
                        <div className="flex items-center gap-1 mt-3">
                          {board.colorPalette.slice(0, 6).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full border border-white/10 shrink-0"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                          {board.colorPalette.length > 6 && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              +{board.colorPalette.length - 6}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Image Thumbnails */}
                      {board.images.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-hidden">
                          {board.images.slice(0, 3).map((img, idx) => (
                            <div
                              key={idx}
                              className="h-14 w-20 rounded-lg overflow-hidden border border-white/10 shrink-0"
                            >
                              <img
                                src={img}
                                alt={`${board.title} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {board.images.length > 3 && (
                            <div className="h-14 w-14 rounded-lg bg-brand-surface-light border border-white/10 flex items-center justify-center shrink-0">
                              <span className="text-xs text-muted-foreground">+{board.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Separator className="my-3 bg-brand-indigo/15" />

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(board.updatedAt)}</span>
                          </div>
                          {projectName && (
                            <div className="flex items-center gap-1">
                              <FolderKanban className="h-3 w-3" />
                              <span className="truncate max-w-[80px]">{projectName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{board.images.length}</span>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">
              {editingBoard ? 'Edit Mood Board' : 'New Mood Board'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mb-title">Title *</Label>
              <Input
                id="mb-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="e.g. Valletta Penthouse Living Concept"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mb-desc">Description</Label>
              <Textarea
                id="mb-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Describe the mood board concept..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(v) => setFormData({ ...formData, style: v })}
                >
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={formData.projectId || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, projectId: v === 'none' ? '' : v })}
                >
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Color Palette Picker */}
            <div className="space-y-2">
              <Label>Color Palette</Label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <input
                    type="color"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                  />
                </div>
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="bg-brand-surface-light border-brand-indigo/20 w-28 font-mono text-xs"
                  placeholder="#000000"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addColor}
                  className="border-brand-indigo/30 hover:bg-brand-indigo/20 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.colorPalette.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.colorPalette.map((color, i) => (
                    <div
                      key={`${color}-${i}`}
                      className="flex items-center gap-1 rounded-lg bg-brand-surface-light px-2 py-1 group"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
                      <button
                        onClick={() => removeColor(color)}
                        className="ml-0.5 text-muted-foreground hover:text-white transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Predefined Palettes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Apply Style Palette</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(STYLE_PALETTES).map(([style, palette]) => (
                  <button
                    key={style}
                    onClick={() => applyPalette(palette.colors)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-white/10 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all text-left"
                  >
                    <div className="flex gap-0.5">
                      {palette.colors.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-white/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{palette.name}</span>
                    {formData.style === style && (
                      <Check className="h-3 w-3 text-brand-cyan ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Image URLs */}
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex gap-2">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Paste image URL and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="border-brand-indigo/30 hover:bg-brand-indigo/20 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {formData.images.map((img, i) => (
                    <div key={`${img.substring(0, 20)}-${i}`} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10 group">
                      <img
                        src={img}
                        alt={`Upload ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(img)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="mb-notes">Notes</Label>
              <Textarea
                id="mb-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Design notes, material references, inspiration sources..."
              />
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formData.isPublic ? <Globe className="h-4 w-4 text-emerald-400" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="mb-public" className="text-sm">Share publicly</Label>
              </div>
              <Switch
                id="mb-public"
                checked={formData.isPublic}
                onCheckedChange={(v) => setFormData({ ...formData, isPublic: v })}
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
              disabled={submitting || !formData.title}
              className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
            >
              {submitting
                ? 'Saving...'
                : editingBoard
                ? 'Update Board'
                : 'Create Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Inspiration Dialog (List View) */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-cyan" />
              AI Visual Inspiration Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Design Style</Label>
              <Select value={aiStyle} onValueChange={setAiStyle}>
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={aiRoom} onValueChange={setAiRoom}>
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-prompt-list">Custom Prompt (optional)</Label>
              <Textarea
                id="ai-prompt-list"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[80px]"
                placeholder="Describe your vision... e.g. 'Sunlit living room with terracotta tiles and exposed wooden beams'"
              />
            </div>

            {/* Style Color Reference */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Style Color Reference</Label>
              <div className="flex gap-1.5">
                {STYLE_PALETTES[aiStyle]?.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg border border-white/10"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={generateAiImage}
              disabled={aiGenerating}
              className="w-full bg-gradient-to-r from-brand-indigo to-brand-cyan hover:opacity-90 text-white glow-indigo"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Visual Concept...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Visual Concept
                </>
              )}
            </Button>

            {/* Generated Image */}
            {aiGeneratedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={`data:image/png;base64,${aiGeneratedImage.base64}`}
                    alt="AI Generated Inspiration"
                    className="w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-[60%]">
                    {aiGeneratedImage.prompt}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${aiGeneratedImage.base64}`;
                        link.download = `moodboard-inspiration-${Date.now()}.png`;
                        link.click();
                      }}
                      className="border-brand-gold/30 hover:bg-brand-gold/20 text-brand-gold"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        // Create a new board with this image
                        const res = await fetch('/api/moodboards', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: `${styleLabel(aiStyle)} ${aiRoom} Concept`,
                            style: aiStyle,
                            colorPalette: STYLE_PALETTES[aiStyle]?.colors || [],
                            images: [`data:image/png;base64,${aiGeneratedImage.base64}`],
                            isPublic: false,
                          }),
                        });
                        if (res.ok) {
                          fetchBoards();
                          setAiDialogOpen(false);
                          setAiGeneratedImage(null);
                        }
                      }}
                      className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create Board
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Delete Mood Board</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this mood board? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
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
