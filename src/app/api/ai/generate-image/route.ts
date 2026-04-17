import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, style, room } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Enhance the prompt for interior design
    const enhancedPrompt = `Professional interior design visualization: ${prompt}${style ? `, ${style} style` : ''}${room ? `, ${room}` : ''}, photorealistic, high-end luxury design, warm lighting, magazine quality, 4k detail`;

    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size: '1344x768'
    });

    const imageBase64 = response.data[0].base64;
    
    // Save image to download directory
    const downloadDir = '/home/z/my-project/download';
    if (!existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true });
    }
    
    const filename = `design-${Date.now()}.png`;
    const filepath = join(downloadDir, filename);
    const buffer = Buffer.from(imageBase64, 'base64');
    writeFileSync(filepath, buffer);

    return NextResponse.json({
      success: true,
      imageUrl: `/api/ai/generated-image?file=${filename}`,
      base64: imageBase64,
      prompt: enhancedPrompt
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
