import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/mpusher';

export async function GET() {
    const articles = getArticles();
    return NextResponse.json({ items: articles, total: articles.length });
}

// Force dynamic so it doesn't cache the empty array at build time
export const dynamic = 'force-dynamic';
