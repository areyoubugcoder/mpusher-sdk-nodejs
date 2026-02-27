import { NextRequest, NextResponse } from 'next/server';
import { parseWebhook } from '@mpusher/nodejs-sdk';
import { addArticle } from '@/lib/mpusher';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const result = await parseWebhook({
            onArticle: async (article) => {
                console.log(`[Webhook] 收到文章: ${article.title} (${article.mpName})`);
                addArticle(article);
            }
        }, body);

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error('[Webhook] 解析失败:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}
