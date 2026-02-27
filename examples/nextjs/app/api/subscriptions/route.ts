import { NextRequest, NextResponse } from 'next/server';
import { getMPusherClient } from '@/lib/mpusher';
import { MPusherError } from '@mpusher/nodejs-sdk';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('x-mpusher-token');
        const client = getMPusherClient(token);
        const searchParams = request.nextUrl.searchParams;
        const page = Number(searchParams.get('page') || '1');
        const pageSize = Number(searchParams.get('pageSize') || '20');
        const mpName = searchParams.get('mpName') || undefined;

        const result = await client.getSubscriptions({ page, pageSize, mpName });
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof MPusherError) {
            return NextResponse.json({ error: err.message }, { status: err.status as number });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('x-mpusher-token');
        const client = getMPusherClient(token);
        const body = await request.json();
        const { articleUrl } = body;

        const result = await client.subscribeByArticleUrl(articleUrl);
        return NextResponse.json(result, { status: 201 });
    } catch (err) {
        if (err instanceof MPusherError) {
            return NextResponse.json({ error: err.message }, { status: err.status as number });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('x-mpusher-token');
        const client = getMPusherClient(token);
        const body = await request.json();
        const { mpId } = body;

        await client.unsubscribe(mpId);
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (err instanceof MPusherError) {
            return NextResponse.json({ error: err.message }, { status: err.status as number });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
