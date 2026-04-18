import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style, room } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // OpenRouter doesn't support image generation via their API
    // Return a helpful message about the limitation
    return NextResponse.json({
      error: 'Image generation is temporarily unavailable. Please configure a Google Generative AI API key in Settings → AI to enable image generation.',
      requiresSetup: true
    }, { status: 503 });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}