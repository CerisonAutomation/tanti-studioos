// Auto-tagging service for Client 360
// Extracts tags from client data using keyword matching + AI inference

import { db } from './db';

const TAG_KEYWORDS: Record<string, string[]> = {
  'luxury': ['luxury', 'premium', 'high-end', 'expensive', 'designer', 'custom'],
  'budget-conscious': ['budget', 'affordable', ' economical', 'cheap', 'basic', 'standard'],
  'villa': ['villa', 'house', 'bungalow', 'detached'],
  'apartment': ['apartment', 'flat', 'studio', 'penthouse', 'unit'],
  'commercial': ['office', 'shop', 'restaurant', 'hotel', 'commercial', 'business'],
  'renovation': ['renovate', 'renovation', 'refurbish', 'restore', 'update'],
  'new-build': ['new', 'build', 'construction', 'develop'],
  'boquer': ['boquer', 'mellieha', 'gozo', 'north'],
  'valletta': ['valletta', 'capital', 'city'],
  'sea-view': ['sea', 'view', 'bay', 'coast'],
  'pool': ['pool', 'swimming', 'dipping'],
  'garden': ['garden', 'outdoor', 'terrace', 'balcony'],
  'urgent': ['urgent', 'asap', 'soon', 'deadline'],
  'family': ['family', 'kids', 'children', 'multi-gen'],
  'investor': ['investor', 'rental', 'return', 'buy-to-let'],
};

export async function autoTagClient(clientId: string) {
  const client = await db.client.findUnique({
    where: { id: clientId },
    include: { tags: { include: { tag: true } } }
  });
  
  if (!client) return;

  // Get all tags
  const tags = await db.tag.findMany();
  
  const newTags: { tagId: string; confidence: number; source: 'auto' }[] = [];
  
  // Analyze all client text fields
  const text = `${client.name} ${client.email} ${client.notes || ''} ${client.address || ''} ${client.city || ''}`.toLowerCase();
  
  for (const tag of tags) {
    const keywords = TAG_KEYWORDS[tag.name.toLowerCase()] || tag.keywords || [];
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        newTags.push({ tagId: tag.id, confidence: 0.8, source: 'auto' });
        break;
      }
    }
  }
  
  // Remove existing auto tags (keep manual)
  await db.clientTag.deleteMany({
    where: { clientId, source: 'auto' }
  });
  
  // Add new auto tags
  for (const t of newTags) {
    await db.clientTag.upsert({
      where: { clientId_tagId: { clientId, tagId: t.tagId } },
      create: { clientId, ...t },
      update: t
    });
  }
  
  return newTags;
}

// Seed default tags
export async function seedTags() {
  const defaults = [
    { name: 'luxury', color: '#f59e0b', category: 'budget', keywords: ['luxury', 'premium'] },
    { name: 'budget-conscious', color: '#10b981', category: 'budget', keywords: ['budget', 'affordable'] },
    { name: 'villa', color: '#3b82f6', category: 'property', keywords: ['villa', 'house'] },
    { name: 'apartment', color: '#8b5cf6', category: 'property', keywords: ['apartment', 'flat'] },
    { name: 'commercial', color: '#ef4444', category: 'property', keywords: ['office', 'shop'] },
    { name: 'renovation', color: '#f97316', category: 'scope', keywords: ['renovate'] },
    { name: 'new-build', color: '#06b6d4', category: 'scope', keywords: ['new', 'build'] },
    { name: 'family', color: '#ec4899', category: 'clientType', keywords: ['family', 'kids'] },
    { name: 'investor', color: '#14b8a6', category: 'clientType', keywords: ['investor', 'rental'] },
    { name: 'urgent', color: '#dc2626', category: 'priority', keywords: ['urgent', 'asap'] },
  ];
  
  for (const tag of defaults) {
    await db.tag.upsert({
      where: { name: tag.name },
      create: tag,
      update: {}
    });
  }
}