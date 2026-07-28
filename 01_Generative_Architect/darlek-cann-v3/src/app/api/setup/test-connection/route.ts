import { NextRequest, NextResponse } from 'next/server';
import type { TestConnectionBody } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: TestConnectionBody = await req.json();
    const { provider, key } = body;

    // Allow using env key if no user key provided
    const effectiveKey = (key && key.trim() !== '') ? key.trim() : (process.env.GEMINI_API_KEY || '');

    if (!effectiveKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key provided.',
      });
    }

    switch (provider) {
      case 'gemini': {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let res: Response;
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': effectiveKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "connected" in exactly one word.' }] }],
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Gemini connected.' });
        }

        // Parse error to detect geoblock
        const errBody = await res.json().catch(() => ({}));
        const errMsg = JSON.stringify(errBody);

        if (errMsg.includes('location is not supported') || errMsg.includes('FAILED_PRECONDITION')) {
          return NextResponse.json({
            success: false,
            message: 'Gemini geoblocked in this region.',
            geoblocked: true,
          });
        }

        return NextResponse.json({
          success: false,
          message: `Gemini error: ${errMsg.slice(0, 200)}`,
        });
      }

      case 'github': {
        const res = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${effectiveKey}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            message: `GitHub connected as @${data.login}.`,
          });
        }
        const err = await res.text();
        return NextResponse.json({ success: false, message: `GitHub error: ${err.slice(0, 200)}` });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown provider: ${provider}` });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout');
    if (provider === 'gemini' && isTimeout) {
      // Gemini timeout from container = effectively geoblocked
      return NextResponse.json({
        success: false,
        message: 'Gemini unreachable (timeout). Dalek Brain engine active.',
        geoblocked: true,
      });
    }
    return NextResponse.json({ success: false, message: `Connection test failed: ${errorMessage}` });
  }
}
