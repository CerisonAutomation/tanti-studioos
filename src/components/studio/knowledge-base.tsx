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
import {
  Search,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  BookOpen,
  FileText,
  Layers,
  StickyNote,
  ClipboardList,
  Tag,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react';

// Types
interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'guides', label: 'Design Guides', icon: BookOpen },
  { value: 'materials', label: 'Material Specs', icon: Layers },
  { value: 'suppliers', label: 'Supplier Catalogs', icon: ClipboardList },
  { value: 'notes', label: 'Internal Notes', icon: StickyNote },
  { value: 'templates', label: 'Project Templates', icon: FileText },
] as const;

const categoryColors: Record<string, string> = {
  guides: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  materials: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
  suppliers: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  notes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  templates: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const categoryCardAccents: Record<string, string> = {
  guides: 'border-l-brand-cyan',
  materials: 'border-l-brand-gold',
  suppliers: 'border-l-purple-500',
  notes: 'border-l-emerald-500',
  templates: 'border-l-rose-500',
};

const categoryIcons: Record<string, typeof BookOpen> = {
  guides: BookOpen,
  materials: Layers,
  suppliers: ClipboardList,
  notes: StickyNote,
  templates: FileText,
};

const tagColors = [
  'bg-brand-cyan/20 text-brand-cyan',
  'bg-brand-gold/20 text-brand-gold',
  'bg-purple-500/20 text-purple-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-rose-500/20 text-rose-400',
  'bg-sky-500/20 text-sky-400',
  'bg-amber-500/20 text-amber-400',
];

function getTagColor(tag: string, index: number) {
  // Generate a consistent color based on tag string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash + index) % tagColors.length];
}

const categoryLabel = (c: string) => {
  const found = categories.find((cat) => cat.value === c);
  return found ? found.label : c.charAt(0).toUpperCase() + c.slice(1);
};

export default function KnowledgeBaseModule() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'guides',
    content: '',
    tags: [] as string[],
  });

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/knowledge?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge entries:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Open add dialog
  const openAddDialog = () => {
    setEditingEntry(null);
    setFormData({
      title: '',
      category: 'guides',
      content: '',
      tags: [],
    });
    setTagInput('');
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (entry: KnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      category: entry.category,
      content: entry.content,
      tags: [...entry.tags],
    });
    setTagInput('');
    setDialogOpen(true);
  };

  // Add tag
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed] });
    }
    setTagInput('');
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.title) return;
    setSubmitting(true);
    try {
      if (editingEntry) {
        const res = await fetch(`/api/knowledge/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setSelectedEntry(updated);
          fetchEntries();
        }
      } else {
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          fetchEntries();
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save knowledge entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!selectedEntry) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/knowledge/${selectedEntry.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedEntry(null);
        fetchEntries();
      }
    } catch (err) {
      console.error('Failed to delete knowledge entry:', err);
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (d: string) => {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Category count
  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return entries.length;
    return entries.filter((e) => e.category === cat).length;
  };

  // ==========================================
  // DETAIL VIEW
  // ==========================================
  if (selectedEntry) {
    const entry = selectedEntry;
    const CategoryIcon = categoryIcons[entry.category] || FileText;

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
              onClick={() => setSelectedEntry(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                entry.category === 'guides'
                  ? 'bg-brand-cyan/15 border-brand-cyan/30'
                  : entry.category === 'materials'
                  ? 'bg-brand-gold/15 border-brand-gold/30'
                  : entry.category === 'suppliers'
                  ? 'bg-purple-500/15 border-purple-500/30'
                  : entry.category === 'notes'
                  ? 'bg-emerald-500/15 border-emerald-500/30'
                  : 'bg-rose-500/15 border-rose-500/30'
              }`}>
                <CategoryIcon className={`h-5 w-5 ${
                  entry.category === 'guides'
                    ? 'text-brand-cyan'
                    : entry.category === 'materials'
                    ? 'text-brand-gold'
                    : entry.category === 'suppliers'
                    ? 'text-purple-400'
                    : entry.category === 'notes'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Space_Grotesk']">{entry.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`${categoryColors[entry.category] || 'bg-brand-surface-light text-muted-foreground'} text-[10px]`}>
                    {categoryLabel(entry.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(entry.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(entry)}
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

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {entry.tags.map((tag, i) => (
              <Badge
                key={tag}
                variant="outline"
                className={`text-[10px] ${getTagColor(tag, i)}`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <Card className="glass-card card-shine rounded-xl">
          <CardContent className="p-6">
            <div className="prose prose-invert max-w-none">
              {entry.content ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {entry.content}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No content yet. Click Edit to add content.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-medium">{categoryLabel(entry.category)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{formatDate(entry.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium">{formatDateTime(entry.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tags</p>
                <p className="text-sm font-medium">{entry.tags.length} tag{entry.tags.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">
                {editingEntry ? 'Edit Document' : 'New Document'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="kb-title">Title *</Label>
                <Input
                  id="kb-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Document title"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.value !== 'all')
                      .map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-content">Content</Label>
                <Textarea
                  id="kb-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[200px]"
                  placeholder="Write your document content here..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="bg-brand-surface-light border-brand-indigo/20"
                    placeholder="Type a tag and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    className="border-brand-indigo/30 hover:bg-brand-indigo/20 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.tags.map((tag, i) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-[10px] ${getTagColor(tag, i)} gap-1`}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 hover:text-white transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
                  : editingEntry
                  ? 'Update Document'
                  : 'Create Document'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="glass-strong max-w-md">
            <DialogHeader>
              <DialogTitle className="font-['Space_Grotesk']">Delete Document</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &ldquo;{entry.title}&rdquo;? This action cannot be
              undone.
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
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} document{entries.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-brand-indigo hover:bg-brand-indigo-light text-white glow-indigo"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by title, content, or tags..."
          className="pl-9 bg-brand-surface-light border-brand-indigo/20"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="bg-brand-surface-light border border-brand-indigo/20 flex-wrap h-auto gap-1 p-1">
          {categories.map((cat) => {
            const count = getCategoryCount(cat.value);
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-brand-indigo/30 data-[state=active]:text-brand-cyan text-xs gap-1.5"
              >
                <cat.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] text-muted-foreground data-[state=active]:text-brand-cyan/70">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Document Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 font-['Space_Grotesk']">
              No documents found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first document to get started'}
            </p>
            {!search && categoryFilter === 'all' && (
              <Button
                onClick={openAddDialog}
                className="bg-brand-indigo hover:bg-brand-indigo-light text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {entries.map((entry, i) => {
              const CategoryIcon = categoryIcons[entry.category] || FileText;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <Card
                    className={`glass-card card-shine glass-hover cursor-pointer rounded-xl transition-all group border-l-2 ${categoryCardAccents[entry.category] || 'border-l-brand-indigo'}`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <CardContent className="p-4">
                      {/* Title & Category */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            entry.category === 'guides'
                              ? 'bg-brand-cyan/15'
                              : entry.category === 'materials'
                              ? 'bg-brand-gold/15'
                              : entry.category === 'suppliers'
                              ? 'bg-purple-500/15'
                              : entry.category === 'notes'
                              ? 'bg-emerald-500/15'
                              : 'bg-rose-500/15'
                          }`}>
                            <CategoryIcon className={`h-4 w-4 ${
                              entry.category === 'guides'
                                ? 'text-brand-cyan'
                                : entry.category === 'materials'
                                ? 'text-brand-gold'
                                : entry.category === 'suppliers'
                                ? 'text-purple-400'
                                : entry.category === 'notes'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-brand-cyan transition-colors">
                              {entry.title}
                            </p>
                            <Badge className={`${categoryColors[entry.category] || ''} text-[10px] mt-0.5`}>
                              {categoryLabel(entry.category)}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-brand-cyan transition-colors shrink-0 mt-1" />
                      </div>

                      {/* Content Preview */}
                      {entry.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2 mb-3 leading-relaxed">
                          {entry.content}
                        </p>
                      )}

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {entry.tags.slice(0, 3).map((tag, idx) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`text-[9px] ${getTagColor(tag, idx)}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags.length > 3 && (
                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                              +{entry.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Separator className="my-2.5 bg-brand-indigo/15" />

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(entry.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-brand-cyan"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(entry);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntry(entry);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">
              {editingEntry ? 'Edit Document' : 'New Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Title *</Label>
              <Input
                id="kb-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20"
                placeholder="Document title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.value !== 'all')
                    .map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-content">Content</Label>
              <Textarea
                id="kb-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-brand-surface-light border-brand-indigo/20 min-h-[200px]"
                placeholder="Write your document content here..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="bg-brand-surface-light border-brand-indigo/20"
                  placeholder="Type a tag and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  className="border-brand-indigo/30 hover:bg-brand-indigo/20 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag, i) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-[10px] ${getTagColor(tag, i)} gap-1`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-white transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
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
                : editingEntry
                ? 'Update Document'
                : 'Create Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-strong max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk']">Delete Document</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &ldquo;{selectedEntry?.title}&rdquo;? This action
            cannot be undone.
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
