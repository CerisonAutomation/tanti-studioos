import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const hashedInput = hashPassword(validated.password);
    if (hashedInput !== user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateToken();

    // Store session in a simple token-based approach
    // In production, use proper session management (NextAuth, etc.)
    const sessionData = {
      userId: user.id,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Update user with last login info via activity log
    await db.activity.create({
      data: {
        type: 'user_login',
        description: `User ${user.name} logged in`,
        entityType: 'user',
        entityId: user.id,
        metadata: JSON.stringify({ token: token.substring(0, 8) + '...' }),
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        aiApiKey: user.aiApiKey ? '••••••••' : null, // Don't expose full key
        hasAiKey: !!user.aiApiKey,
      },
      token,
      session: sessionData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
