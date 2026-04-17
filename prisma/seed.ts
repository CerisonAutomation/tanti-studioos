import { db } from '@/lib/db';

async function seed() {
  // Create clients
  const client1 = await db.client.create({
    data: {
      name: 'Elena Vassallo',
      email: 'elena@vassallo.mt',
      phone: '+356 9912 3456',
      address: '15, Triq il-Knisja',
      city: 'Sliema',
      country: 'Malta',
      source: 'referral',
      status: 'active',
      budgetMin: 50000,
      budgetMax: 120000,
    },
  });

  const client2 = await db.client.create({
    data: {
      name: 'Marcus Bianchi',
      email: 'marcus@bianchi.com',
      phone: '+356 9987 6543',
      address: '42, Tower Road',
      city: 'St. Julian\'s',
      country: 'Malta',
      source: 'website',
      status: 'active',
      budgetMin: 80000,
      budgetMax: 200000,
    },
  });

  const client3 = await db.client.create({
    data: {
      name: 'Sofia Attard',
      email: 'sofia.attard@gmail.com',
      phone: '+356 9945 6789',
      address: '8, Valley Road',
      city: 'Msida',
      country: 'Malta',
      source: 'instagram',
      status: 'lead',
      budgetMin: 25000,
      budgetMax: 60000,
    },
  });

  const client4 = await db.client.create({
    data: {
      name: 'Dimitri Camilleri',
      email: 'dimitri@camilleri.mt',
      phone: '+356 9923 4567',
      address: '23, Spinola Bay',
      city: 'St. Julian\'s',
      country: 'Malta',
      source: 'referral',
      status: 'active',
      budgetMin: 100000,
      budgetMax: 300000,
    },
  });

  // Create projects
  const project1 = await db.project.create({
    data: {
      name: 'Villa Aurora Renovation',
      description: 'Complete renovation of a 4-bedroom villa with sea views',
      clientId: client1.id,
      status: 'design',
      priority: 'high',
      budget: 120000,
      spent: 35000,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      location: 'Sliema, Malta',
    },
  });

  const project2 = await db.project.create({
    data: {
      name: 'Penthouse Blu',
      description: 'Modern penthouse interior with smart home integration',
      clientId: client2.id,
      status: 'planning',
      priority: 'medium',
      budget: 200000,
      spent: 5000,
      startDate: new Date('2026-01-15'),
      location: 'St. Julian\'s, Malta',
    },
  });

  const project3 = await db.project.create({
    data: {
      name: 'Harbour View Apartment',
      description: 'Luxury apartment redesign with harbour views',
      clientId: client4.id,
      status: 'execution',
      priority: 'high',
      budget: 180000,
      spent: 95000,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-03-31'),
      location: 'St. Julian\'s, Malta',
    },
  });

  // Create quotes
  await db.quote.create({
    data: {
      title: 'Villa Aurora - Living Areas',
      clientId: client1.id,
      projectId: project1.id,
      status: 'sent',
      tier: 'good',
      items: JSON.stringify([
        { name: 'Living Room Design Package', qty: 1, price: 8000 },
        { name: 'Custom Sofa Set', qty: 1, price: 5500 },
        { name: 'Lighting Design & Installation', qty: 1, price: 3200 },
        { name: 'Window Treatments', qty: 4, price: 850 },
        { name: 'Art Curation & Installation', qty: 1, price: 2500 },
      ]),
      subtotal: 22600,
      tax: 4068,
      total: 26668,
      notes: 'Basic scope covering living room, dining area, and hallway. Standard materials with premium fabrics.',
      validUntil: new Date('2026-05-01'),
    },
  });

  await db.quote.create({
    data: {
      title: 'Villa Aurora - Living Areas',
      clientId: client1.id,
      projectId: project1.id,
      status: 'sent',
      tier: 'better',
      items: JSON.stringify([
        { name: 'Living Room Design Package - Enhanced', qty: 1, price: 12000 },
        { name: 'Italian Custom Sofa Set', qty: 1, price: 9500 },
        { name: 'Smart Lighting System', qty: 1, price: 5800 },
        { name: 'Motorized Window Treatments', qty: 4, price: 1400 },
        { name: 'Curated Art Collection', qty: 1, price: 4500 },
        { name: 'Custom Millwork & Built-ins', qty: 1, price: 7200 },
      ]),
      subtotal: 40400,
      tax: 7272,
      total: 47672,
      notes: 'Enhanced scope with Italian furniture, smart lighting, motorized blinds, and custom millwork.',
      validUntil: new Date('2026-05-01'),
    },
  });

  await db.quote.create({
    data: {
      title: 'Villa Aurora - Living Areas',
      clientId: client1.id,
      projectId: project1.id,
      status: 'sent',
      tier: 'best',
      items: JSON.stringify([
        { name: 'Living Room Design Package - Premium', qty: 1, price: 18000 },
        { name: 'Bespoke Italian Furniture Suite', qty: 1, price: 15000 },
        { name: 'Automated Lighting & Scene Control', qty: 1, price: 8500 },
        { name: 'Lutron Motorized Shades', qty: 4, price: 2200 },
        { name: 'Original Art Curation', qty: 1, price: 8000 },
        { name: 'Custom Millwork & Built-ins - Premium', qty: 1, price: 12000 },
        { name: 'Acoustic Treatment', qty: 1, price: 4500 },
        { name: 'Smart Home Integration', qty: 1, price: 6000 },
      ]),
      subtotal: 74200,
      tax: 13356,
      total: 87556,
      notes: 'Premium scope with bespoke Italian furniture, full smart home integration, original art, and acoustic engineering.',
      validUntil: new Date('2026-05-01'),
    },
  });

  await db.quote.create({
    data: {
      title: 'Penthouse Blu - Full Interior',
      clientId: client2.id,
      projectId: project2.id,
      status: 'draft',
      tier: 'better',
      items: JSON.stringify([
        { name: 'Full Interior Design Package', qty: 1, price: 25000 },
        { name: 'Custom Kitchen', qty: 1, price: 18000 },
        { name: 'Bathroom Renovation (3)', qty: 3, price: 8500 },
        { name: 'Smart Home Setup', qty: 1, price: 12000 },
        { name: 'Furniture Procurement', qty: 1, price: 35000 },
      ]),
      subtotal: 115500,
      tax: 20790,
      total: 136290,
      notes: 'Enhanced tier covering full penthouse. Italian kitchen, smart home, premium furniture.',
      validUntil: new Date('2026-04-30'),
    },
  });

  await db.quote.create({
    data: {
      title: 'Harbour View - Kitchen & Dining',
      clientId: client4.id,
      projectId: project3.id,
      status: 'accepted',
      tier: 'best',
      items: JSON.stringify([
        { name: 'Bespoke Kitchen Design', qty: 1, price: 22000 },
        { name: 'Premium Appliances (Miele)', qty: 1, price: 15000 },
        { name: 'Custom Dining Furniture', qty: 1, price: 8500 },
        { name: 'Lighting Design', qty: 1, price: 4500 },
        { name: 'Marble Countertops', qty: 1, price: 8000 },
      ]),
      subtotal: 58000,
      tax: 10440,
      total: 68440,
      notes: 'Accepted proposal for premium kitchen and dining area renovation.',
    },
  });

  // Create messages
  await db.message.create({
    data: {
      clientId: client1.id,
      channel: 'email',
      direction: 'inbound',
      from: 'Elena Vassallo',
      to: 'studio@tanti.mt',
      subject: 'Quote Review - Living Areas',
      content: 'Hi, I\'ve reviewed the three tier options for the living areas. The Better tier looks like a great balance. Could we schedule a call to discuss some modifications? I\'d like to explore upgrading the lighting to the premium option while keeping the rest at the Better level.',
      status: 'unread',
    },
  });

  await db.message.create({
    data: {
      clientId: client2.id,
      channel: 'whatsapp',
      direction: 'inbound',
      from: 'Marcus Bianchi',
      content: 'Good morning! Just wanted to check on the timeline for the Penthouse Blu project. We\'re really excited to get started! 🏠',
      status: 'unread',
    },
  });

  await db.message.create({
    data: {
      clientId: client3.id,
      channel: 'email',
      direction: 'inbound',
      from: 'Sofia Attard',
      to: 'studio@tanti.mt',
      subject: 'Interior Design Inquiry',
      content: 'Hello, I recently moved into a new apartment in Msida and I\'m looking for an interior designer. I love your work on the Villa Aurora project! Could you tell me more about your process and pricing? My budget is around 25-60k.',
      status: 'unread',
    },
  });

  await db.message.create({
    data: {
      clientId: client4.id,
      channel: 'telegram',
      direction: 'inbound',
      from: 'Dimitri Camilleri',
      content: 'Hey team, the kitchen marble samples look amazing! Can we go with the Calacatta Gold? Also, when can we expect the appliances delivery?',
      status: 'read',
    },
  });

  await db.message.create({
    data: {
      clientId: client1.id,
      channel: 'whatsapp',
      direction: 'inbound',
      from: 'Elena Vassallo',
      content: 'Also, I found some beautiful tiles from a supplier in Italy. Can we incorporate those into the bathroom design? I\'ll send you the catalog link.',
      status: 'unread',
    },
  });

  await db.message.create({
    data: {
      clientId: null,
      channel: 'email',
      direction: 'inbound',
      from: 'info@maltaheritage.mt',
      to: 'studio@tanti.mt',
      subject: 'Heritage Building Renovation RFP',
      content: 'Dear Tanti Interiors, The Malta Heritage Foundation is seeking proposals for the interior renovation of Palazzo Parisio\'s east wing. The project requires sensitive integration of modern amenities while preserving historical character. Budget range: €150,000-250,000. Please let us know if you\'d like to participate in the RFP process.',
      status: 'unread',
    },
  });

  await db.message.create({
    data: {
      clientId: client2.id,
      channel: 'email',
      direction: 'outbound',
      from: 'Tanti Studio',
      to: 'marcus@bianchi.com',
      subject: 'Re: Penthouse Blu Timeline',
      content: 'Dear Marcus, Thank you for your enthusiasm! We\'re targeting a start date of January 15th. The design phase will take approximately 4-6 weeks, followed by procurement. I\'ll send you a detailed timeline by end of week.',
      status: 'replied',
      isAiGenerated: true,
    },
  });

  console.log('Seed data created successfully!');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
