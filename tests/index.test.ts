import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MPusherClient } from '../src/client.js';
import { MPusherError } from '../src/errors.js';
import {
    parseWebhook,
    createExpressWebhookHandler,
    createWorkerWebhookHandler,
} from '../src/webhook.js';
import type { ArticlePushPayload } from '../src/types.js';

// ============================================================
// Mock 数据
// ============================================================

const mockArticle: ArticlePushPayload = {
    articleId: '2247484078_1',
    mpId: 2247484078,
    mpIdB64: 'MjI0NzQ4NDA3OA==',
    mpName: '示例公众号',
    articleMsgId: 2247484078,
    articleIdx: 1,
    articleSn: 'abc123def456',
    title: '示例文章标题',
    coverImg: 'https://example.com/cover.jpg',
    description: '这是一篇示例文章的描述',
    publishedAt: 1640995200,
    url: 'https://mp.weixin.qq.com/s/2247484078_1',
    url2: 'https://mp.weixin.qq.com/s?__biz=2247484078&mid=2247484078&idx=1&sn=abc123def456',
};

// ============================================================
// MPusherClient 测试
// ============================================================

describe('MPusherClient', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should throw if no token provided', () => {
        expect(() => new MPusherClient({ token: '' })).toThrow('token');
    });

    it('should read token from env variable', () => {
        vi.stubEnv('MPUSHER_TOKEN', 'env-token');
        const client = new MPusherClient();
        expect(client).toBeDefined();
        vi.unstubAllEnvs();
    });

    it('should read baseUrl from env variable', () => {
        vi.stubEnv('MPUSHER_TOKEN', 'env-token');
        vi.stubEnv('MPUSHER_BASE_URL', 'https://custom.api.com');

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ items: [], total: 0, page: 1, pageSize: 10 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new MPusherClient();
        client.getSubscriptions();

        expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining('https://custom.api.com'),
            expect.any(Object),
        );

        vi.unstubAllEnvs();
    });

    it('getSubscriptions should send correct request', async () => {
        const mockResponse = { items: [{ mpId: 123, mpName: '测试' }], total: 1, page: 1, pageSize: 10 };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new MPusherClient({ token: 'test-token' });
        const result = await client.getSubscriptions({ page: 1, pageSize: 10, mpName: '测试' });

        expect(result).toEqual(mockResponse);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://mpusher.bugcode.dev/public-api/subscriptions?page=1&pageSize=10&mpName=%E6%B5%8B%E8%AF%95',
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                }),
            }),
        );
    });

    it('subscribeByArticleUrl should POST with articleUrl', async () => {
        const mockResponse = { data: { mpId: 456, mpName: '新公众号' }, message: '订阅成功' };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify(mockResponse), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new MPusherClient({ token: 'test-token' });
        const result = await client.subscribeByArticleUrl('https://mp.weixin.qq.com/s/xxx');

        expect(result).toEqual(mockResponse);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://mpusher.bugcode.dev/public-api/subscriptions/by-article-url',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ articleUrl: 'https://mp.weixin.qq.com/s/xxx' }),
            }),
        );
    });

    it('unsubscribe should DELETE with mpId', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(null, { status: 204 }),
        );

        const client = new MPusherClient({ token: 'test-token' });
        await client.unsubscribe(123);

        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://mpusher.bugcode.dev/public-api/subscriptions',
            expect.objectContaining({
                method: 'DELETE',
                body: JSON.stringify({ mpId: 123 }),
            }),
        );
    });

    it('setCallback should PUT with config', async () => {
        const mockResponse = { message: '配置更新成功' };
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new MPusherClient({ token: 'test-token' });
        const result = await client.setCallback({
            callbackUrl: 'https://example.com/webhook',
            authToken: 'webhook-token',
        });

        expect(result).toEqual(mockResponse);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://mpusher.bugcode.dev/public-api/config/callback',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ callbackUrl: 'https://example.com/webhook', authToken: 'webhook-token' }),
            }),
        );
    });

    it('should throw MPusherError on API error', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ message: '文章URL格式不正确' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        const client = new MPusherClient({ token: 'test-token' });

        try {
            await client.subscribeByArticleUrl('bad-url');
            expect.unreachable('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(MPusherError);
            expect((err as MPusherError).status).toBe(400);
            expect((err as MPusherError).message).toBe('文章URL格式不正确');
        }
    });

    it('should throw MPusherError on network error', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failure'));

        const client = new MPusherClient({ token: 'test-token' });

        try {
            await client.getSubscriptions();
            expect.unreachable('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(MPusherError);
            expect((err as MPusherError).status).toBe(0);
        }
    });
});

// ============================================================
// Webhook 核心函数测试
// ============================================================

describe('parseWebhook', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should parse valid payload and call onArticle', async () => {
        const onArticle = vi.fn();
        const result = await parseWebhook({ onArticle }, mockArticle);
        expect(result).toEqual({ ok: true });
        expect(onArticle).toHaveBeenCalledWith(mockArticle);
    });

    it('should parse JSON string body', async () => {
        const onArticle = vi.fn();
        const result = await parseWebhook({ onArticle }, JSON.stringify(mockArticle));
        expect(result).toEqual({ ok: true });
        expect(onArticle).toHaveBeenCalledWith(mockArticle);
    });

    it('should fail with invalid JSON', async () => {
        const result = await parseWebhook({ onArticle: vi.fn() }, 'invalid json{{{');
        expect(result).toEqual({ ok: false, status: 400, error: 'Invalid JSON body' });
    });

    it('should fail with missing articleId', async () => {
        const result = await parseWebhook({ onArticle: vi.fn() }, { mpId: 123 });
        expect(result).toEqual({ ok: false, status: 400, error: 'Invalid payload: missing articleId' });
    });

    it('should handle onArticle errors', async () => {
        const result = await parseWebhook(
            { onArticle: () => { throw new Error('handler failed'); } },
            mockArticle,
        );
        expect(result).toEqual({ ok: false, status: 500, error: 'Handler error: handler failed' });
    });
});

// ============================================================
// Express Webhook 适配器测试
// ============================================================

describe('createExpressWebhookHandler', () => {
    it('should respond 200 on valid request', async () => {
        const onArticle = vi.fn();
        const handler = createExpressWebhookHandler({ onArticle });

        const req = { headers: {}, body: mockArticle };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn(),
        };

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'ok' });
        expect(onArticle).toHaveBeenCalledWith(mockArticle);
    });

    it('should respond 400 on invalid payload', async () => {
        const handler = createExpressWebhookHandler({ onArticle: vi.fn() });

        const req = { headers: {}, body: { invalid: true } };
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn(),
        };

        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

// ============================================================
// Worker Webhook 适配器测试
// ============================================================

describe('createWorkerWebhookHandler', () => {
    it('should return 200 on valid request', async () => {
        const onArticle = vi.fn();
        const handler = createWorkerWebhookHandler({ onArticle });

        const request = new Request('https://example.com/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockArticle),
        });

        const response = await handler(request);

        expect(response.status).toBe(200);
        expect(onArticle).toHaveBeenCalledWith(mockArticle);
    });

    it('should return 400 on invalid JSON', async () => {
        const handler = createWorkerWebhookHandler({ onArticle: vi.fn() });

        const request = new Request('https://example.com/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'not json',
        });

        const response = await handler(request);
        expect(response.status).toBe(400);
    });
});
