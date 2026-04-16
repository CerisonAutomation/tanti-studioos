'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Star, Phone, Mail, Globe, Clock, Truck, Package,
  Edit, Trash2, Send, ChevronDown, ChevronUp, Building2, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  rating: number;
  leadTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['All', 'Furniture', 'Lighting', 'Fabrics', 'Materials', 'Art', 'Accessories'];

const CATEGORY_COLORS: Record<string, string> = {
  Furniture: 'bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30',
  Lighting: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Fabrics: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  Materials: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  Art: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
  Accessories: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            className={`size-4 ${
              star <= rating
                ? 'fill-brand-gold text-brand-gold'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProcurementModule() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [rfqText, setRfqText] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Furniture');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formRating, setFormRating] = useState(0);
  const [formLeadTime, setFormLeadTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (categoryFilter !== 'All') params.set('category', categoryFilter);
        if (search) params.set('search', search);
        const res = await fetch(`/api/suppliers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSuppliers(data);
        }
      } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [categoryFilter, search]);

  const resetForm = () => {
    setFormName(''); setFormCategory('Furniture'); setFormContact('');
    setFormEmail(''); setFormPhone(''); setFormWebsite('');
    setFormRating(0); setFormLeadTime(''); setFormNotes('');
    setEditingSupplier(null);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormCategory(supplier.category);
    setFormContact(supplier.contact || '');
    setFormEmail(supplier.email || '');
    setFormPhone(supplier.phone || '');
    setFormWebsite(supplier.website || '');
    setFormRating(supplier.rating);
    setFormLeadTime(supplier.leadTime || '');
    setFormNotes(supplier.notes || '');
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    const payload = {
      name: formName,
      category: formCategory,
      contact: formContact || null,
      email: formEmail || null,
      phone: formPhone || null,
      website: formWebsite || null,
      rating: formRating,
      leadTime: formLeadTime || null,
      notes: formNotes || null,
    };

    try {
      if (editingSupplier) {
        await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowAddDialog(false);
      resetForm();
      await fetchSuppliers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      setShowDetailDialog(false);
      setSelectedSupplier(null);
      await fetchSuppliers();
    } catch (e) { console.error(e); }
  };

  const openRFQ = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setRfqText(`Dear ${supplier.contact || supplier.name},\n\nWe would like to request a quotation for the following items:\n\n[Item description and specifications]\n\nQuantity: [qty]\nDelivery address: [address]\n\nPlease provide your best pricing and lead time.\n\nKind regards,\nTanti Interiors`);
    setShowRFQDialog(true);
  };

  // Dashboard stats
  const totalSuppliers = suppliers.length;
  const avgRating = suppliers.length > 0 ? suppliers.reduce((a, s) => a + s.rating, 0) / suppliers.length : 0;
  const topRated = suppliers.filter((s) => s.rating >= 4);
  const categoryCounts = CATEGORIES.slice(1).map((cat) => ({
    category: cat,
    count: suppliers.filter((s) => s.category === cat).length,
  }));
  const maxCategoryCount = Math.max(...categoryCounts.map((c) => c.count), 1);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading gradient-text">Procurement & Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage supplier relationships and procurement workflows</p>
        </div>
        <Button
          className="glow-cyan bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30"
          onClick={() => { resetForm(); setShowAddDialog(true); }}
        >
          <Plus className="size-4 mr-2" /> Add Supplier
        </Button>
      </div>

      {/* Dashboard Overview */}
      <Card className="glass-card border-brand-indigo/20">
        <CardHeader
          className="cursor-pointer pb-2"
          onClick={() => setDashboardExpanded(!dashboardExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Dashboard Overview</CardTitle>
            {dashboardExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <AnimatePresence>
          {dashboardExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="glass rounded-lg p-4 text-center">
                    <Building2 className="size-5 mx-auto text-brand-indigo-light mb-2" />
                    <p className="text-2xl font-bold">{totalSuppliers}</p>
                    <p className="text-xs text-muted-foreground">Total Suppliers</p>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <Star className="size-5 mx-auto text-brand-gold mb-2" />
                    <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <Truck className="size-5 mx-auto text-brand-cyan mb-2" />
                    <p className="text-2xl font-bold">{topRated.length}</p>
                    <p className="text-xs text-muted-foreground">Top Rated (4+)</p>
                  </div>
                  <div className="glass rounded-lg p-4 text-center">
                    <Clock className="size-5 mx-auto text-purple-400 mb-2" />
                    <p className="text-2xl font-bold">~2-4w</p>
                    <p className="text-xs text-muted-foreground">Avg Lead Time</p>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Category Breakdown</p>
                  <div className="space-y-1.5">
                    {categoryCounts.map((cat) => (
                      <div key={cat.category} className="flex items-center gap-3">
                        <span className="text-xs w-20 text-muted-foreground">{cat.category}</span>
                        <div className="flex-1 h-4 bg-brand-surface-light rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                            className="h-full rounded-full"
                            style={{
                              background: cat.category === 'Furniture' ? 'linear-gradient(90deg, #3A0CA3, #5E17C4)' :
                                cat.category === 'Lighting' ? 'linear-gradient(90deg, #D4AF37, #FFD700)' :
                                cat.category === 'Fabrics' ? 'linear-gradient(90deg, #FF6B9D, #FF8FB1)' :
                                cat.category === 'Materials' ? 'linear-gradient(90deg, #00C4A7, #00F5D4)' :
                                cat.category === 'Art' ? 'linear-gradient(90deg, #5E17C4, #9B59B6)' :
                                'linear-gradient(90deg, #9B8FC2, #B088F9)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="pl-9 bg-brand-surface-light border-brand-indigo/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              className={`text-xs h-8 ${categoryFilter === cat ? 'bg-brand-indigo text-white' : 'text-muted-foreground'}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Supplier Cards */}
      {suppliers.length === 0 ? (
        <Card className="glass-card border-brand-indigo/20">
          <CardContent className="py-16 text-center">
            <Package className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Suppliers Found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {search || categoryFilter !== 'All'
                ? 'Try adjusting your search or filter criteria.'
                : 'Add your first supplier to start managing procurement relationships.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className="glass-card glass-hover border-brand-indigo/20 hover:border-brand-cyan/30 transition-colors cursor-pointer rounded-xl"
                onClick={() => { setSelectedSupplier(supplier); setShowDetailDialog(true); }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{supplier.name}</CardTitle>
                    <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[supplier.category] || ''}`}>
                      {supplier.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <StarRating rating={Math.round(supplier.rating)} />
                    {supplier.contact && (
                      <p className="text-xs text-muted-foreground">👤 {supplier.contact}</p>
                    )}
                    {supplier.email && (
                      <p className="text-xs text-muted-foreground truncate">✉️ {supplier.email}</p>
                    )}
                    {supplier.leadTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {supplier.leadTime}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-brand-indigo/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); openRFQ(supplier); }}
                    >
                      <Send className="size-3 mr-1" /> RFQ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(supplier); }}
                    >
                      <Edit className="size-3 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="glass-card border-brand-indigo/30 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Supplier name" className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="bg-brand-surface-light border-brand-indigo/20 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.slice(1).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Person</Label>
                <Input value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="Contact name" className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+356..." className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Website</Label>
                <Input value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} placeholder="https://..." className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Rating: {formRating}/5</Label>
                <Slider
                  value={[formRating]}
                  onValueChange={([v]) => setFormRating(v)}
                  min={0}
                  max={5}
                  step={1}
                  className="py-2"
                />
                <StarRating rating={formRating} onChange={setFormRating} />
              </div>
              <div className="space-y-1.5">
                <Label>Lead Time</Label>
                <Input value={formLeadTime} onChange={(e) => setFormLeadTime(e.target.value)} placeholder="e.g. 2-3 weeks" className="bg-brand-surface-light border-brand-indigo/20" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Additional notes..." className="bg-brand-surface-light border-brand-indigo/20 min-h-[60px]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName || !formCategory} className="bg-brand-indigo hover:bg-brand-indigo-light">
              {editingSupplier ? 'Update' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="glass-card border-brand-indigo/30">
          {selectedSupplier && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-lg">{selectedSupplier.name}</DialogTitle>
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[selectedSupplier.category] || ''}`}>
                    {selectedSupplier.category}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Rating</Label>
                  <div className="mt-1"><StarRating rating={Math.round(selectedSupplier.rating)} /></div>
                </div>
                {selectedSupplier.contact && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">👤</span> {selectedSupplier.contact}
                  </div>
                )}
                {selectedSupplier.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <a href={`mailto:${selectedSupplier.email}`} className="text-brand-cyan hover:underline">{selectedSupplier.email}</a>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" /> {selectedSupplier.phone}
                  </div>
                )}
                {selectedSupplier.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="size-4 text-muted-foreground" />
                    <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">{selectedSupplier.website}</a>
                  </div>
                )}
                {selectedSupplier.leadTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-muted-foreground" /> Lead time: {selectedSupplier.leadTime}
                  </div>
                )}
                {selectedSupplier.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedSupplier.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedSupplier.id)}>
                  <Trash2 className="size-4 mr-1" /> Delete
                </Button>
                <Button variant="ghost" onClick={() => { setShowDetailDialog(false); openEditDialog(selectedSupplier); }}>
                  <Edit className="size-4 mr-1" /> Edit
                </Button>
                <Button className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30" onClick={() => { setShowDetailDialog(false); openRFQ(selectedSupplier); }}>
                  <Send className="size-4 mr-1" /> Send RFQ
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* RFQ Dialog */}
      <Dialog open={showRFQDialog} onOpenChange={setShowRFQDialog}>
        <DialogContent className="glass-card border-brand-indigo/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="gradient-text">Request for Quote</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send className="size-4" /> To: {selectedSupplier.name} ({selectedSupplier.email || 'no email'})
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  value={rfqText}
                  onChange={(e) => setRfqText(e.target.value)}
                  className="bg-brand-surface-light border-brand-indigo/20 min-h-[200px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRFQDialog(false)}>Cancel</Button>
            <Button className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 border border-brand-cyan/30" onClick={() => setShowRFQDialog(false)}>
              <Send className="size-4 mr-1" /> Send RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
