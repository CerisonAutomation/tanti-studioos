import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    // Security: only allow filenames that match our pattern
    if (!/^design-\d+\.png$/.test(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = join('/home/z/my-project/download', filename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const buffer = readFileSync(filepath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
