import { NextRequest, NextResponse } from 'next/server';
import { getMPusherClient } from '@/lib/mpusher';
import { MPusherError } from '@mpusher/nodejs-sdk';

export async function PUT(request: NextRequest) {
    try {
        const client = getMPusherClient();
        const body = await request.json();

        const result = await client.setCallback(body);
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof MPusherError) {
            return NextResponse.json({ error: err.message }, { status: err.status as number });
        }
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
