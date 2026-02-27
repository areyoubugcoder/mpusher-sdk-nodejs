// ============================================================
// MPusher SDK - Webhook 处理器（多平台适配）
// ============================================================

import type { ArticlePushPayload, WebhookHandlerOptions } from './types.js';

// ----------------------------------------------------------
// 核心函数（平台无关）
// ----------------------------------------------------------

/**
 * 解析 Webhook 请求并调用回调
 *
 * 这是平台无关的核心函数，所有适配器都基于此函数。
 * 你也可以直接使用此函数构建自定义适配器。
 *
 * @param options - 配置选项（仅 onArticle 回调）
 * @param body - 请求体（已解析的对象或 JSON 字符串）
 * @returns 处理结果
 *
 * @example
 * ```ts
 * const result = await parseWebhook(
 *   { onArticle: (article) => console.log(article) },
 *   await request.json(),
 * );
 *
 * if (!result.ok) {
 *   return new Response(result.error, { status: result.status });
 * }
 * return new Response('OK', { status: 200 });
 * ```
 */
export async function parseWebhook(
    options: WebhookHandlerOptions,
    body: unknown,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    // 解析 body
    let payload: ArticlePushPayload;
    try {
        payload = (typeof body === 'string' ? JSON.parse(body) : body) as ArticlePushPayload;
    } catch {
        return { ok: false, status: 400, error: 'Invalid JSON body' };
    }

    if (!payload || !payload.articleId) {
        return { ok: false, status: 400, error: 'Invalid payload: missing articleId' };
    }

    // 调用回调
    try {
        await options.onArticle(payload);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, status: 500, error: `Handler error: ${message}` };
    }

    return { ok: true };
}

// ----------------------------------------------------------
// Express / Connect 适配器
// ----------------------------------------------------------

/** Express/Connect 风格的 Request 对象 */
interface ExpressLikeRequest {
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
}

/** Express/Connect 风格的 Response 对象 */
interface ExpressLikeResponse {
    status(code: number): ExpressLikeResponse;
    json(body: unknown): void;
    send(body: string): void;
}

/**
 * 创建 Express / Connect 中间件
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createExpressWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const app = express();
 * app.use(express.json());
 *
 * app.post('/webhook', createExpressWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * }));
 *
 * app.listen(3000);
 * ```
 */
export function createExpressWebhookHandler(
    options: WebhookHandlerOptions,
): (req: ExpressLikeRequest, res: ExpressLikeResponse, next?: () => void) => Promise<void> {
    return async (req, res) => {
        const result = await parseWebhook(options, req.body);

        if (!result.ok) {
            res.status(result.status).json({ message: result.error });
            return;
        }

        res.status(200).json({ message: 'ok' });
    };
}

// ----------------------------------------------------------
// Koa 适配器
// ----------------------------------------------------------

/** Koa 风格的 Context 对象 */
interface KoaLikeContext {
    request: {
        headers: Record<string, string | string[] | undefined>;
        body?: unknown;
    };
    status: number;
    body: unknown;
}

/**
 * 创建 Koa 中间件
 *
 * @example
 * ```ts
 * import Koa from 'koa';
 * import bodyParser from 'koa-bodyparser';
 * import { createKoaWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const app = new Koa();
 * app.use(bodyParser());
 *
 * const webhookHandler = createKoaWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * });
 *
 * app.use(async (ctx, next) => {
 *   if (ctx.path === '/webhook' && ctx.method === 'POST') {
 *     return webhookHandler(ctx, next);
 *   }
 *   await next();
 * });
 *
 * app.listen(3000);
 * ```
 */
export function createKoaWebhookHandler(
    options: WebhookHandlerOptions,
): (ctx: KoaLikeContext, next: () => Promise<void>) => Promise<void> {
    return async (ctx) => {
        const result = await parseWebhook(options, ctx.request.body);

        if (!result.ok) {
            ctx.status = result.status;
            ctx.body = { message: result.error };
            return;
        }

        ctx.status = 200;
        ctx.body = { message: 'ok' };
    };
}

// ----------------------------------------------------------
// Hapi 适配器
// ----------------------------------------------------------

/** Hapi 风格的 Request 对象 */
interface HapiLikeRequest {
    headers: Record<string, string | string[] | undefined>;
    payload?: unknown;
}

/** Hapi 风格的 ResponseToolkit */
interface HapiLikeResponseToolkit {
    response(data: unknown): { code(statusCode: number): unknown };
}

/**
 * 创建 Hapi 路由处理器
 *
 * @example
 * ```ts
 * import Hapi from '@hapi/hapi';
 * import { createHapiWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const server = Hapi.server({ port: 3000 });
 *
 * server.route({
 *   method: 'POST',
 *   path: '/webhook',
 *   handler: createHapiWebhookHandler({
 *     onArticle: async (article) => {
 *       console.log('收到文章:', article.title);
 *     },
 *   }),
 * });
 *
 * await server.start();
 * ```
 */
export function createHapiWebhookHandler(
    options: WebhookHandlerOptions,
): (request: HapiLikeRequest, h: HapiLikeResponseToolkit) => Promise<unknown> {
    return async (request, h) => {
        const result = await parseWebhook(options, request.payload);

        if (!result.ok) {
            return h.response({ message: result.error }).code(result.status);
        }

        return h.response({ message: 'ok' }).code(200);
    };
}

// ----------------------------------------------------------
// Hono 适配器
// ----------------------------------------------------------

/** Hono 风格的 Context 对象 */
interface HonoLikeContext {
    req: {
        header(name: string): string | undefined;
        json<T = unknown>(): Promise<T>;
    };
    json(data: unknown, status?: number): Response;
}

/**
 * 创建 Hono 中间件
 *
 * @example
 * ```ts
 * import { Hono } from 'hono';
 * import { createHonoWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const app = new Hono();
 *
 * app.post('/webhook', createHonoWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * }));
 *
 * export default app;
 * ```
 */
export function createHonoWebhookHandler(
    options: WebhookHandlerOptions,
): (c: HonoLikeContext) => Promise<Response> {
    return async (c) => {
        const body = await c.req.json();
        const result = await parseWebhook(options, body);

        if (!result.ok) {
            return c.json({ message: result.error }, result.status);
        }

        return c.json({ message: 'ok' }, 200);
    };
}

// ----------------------------------------------------------
// Cloudflare Workers 适配器
// ----------------------------------------------------------

/**
 * 创建 Cloudflare Workers 处理函数
 *
 * 使用 Web Standard Request/Response API，也可用于 Deno、Bun 等运行时。
 *
 * @example
 * ```ts
 * import { createWorkerWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const handler = createWorkerWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * });
 *
 * // Cloudflare Workers
 * export default {
 *   async fetch(request: Request): Promise<Response> {
 *     if (new URL(request.url).pathname === '/webhook' && request.method === 'POST') {
 *       return handler(request);
 *     }
 *     return new Response('Not Found', { status: 404 });
 *   },
 * };
 * ```
 */
export function createWorkerWebhookHandler(
    options: WebhookHandlerOptions,
): (request: Request) => Promise<Response> {
    return async (request) => {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return new Response(
                JSON.stringify({ message: 'Invalid JSON body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const result = await parseWebhook(options, body);

        if (!result.ok) {
            return new Response(
                JSON.stringify({ message: result.error }),
                { status: result.status, headers: { 'Content-Type': 'application/json' } },
            );
        }

        return new Response(
            JSON.stringify({ message: 'ok' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    };
}

// ----------------------------------------------------------
// Vercel / Next.js 适配器
// ----------------------------------------------------------

/** Vercel Serverless Function 风格的 Request 对象 */
interface VercelLikeRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
}

/** Vercel Serverless Function 风格的 Response 对象 */
interface VercelLikeResponse {
    status(code: number): VercelLikeResponse;
    json(body: unknown): void;
    end(): void;
    setHeader?(name: string, value: string): void;
}

/**
 * 创建 Vercel Serverless / Next.js API Route 处理函数
 *
 * @example
 * ```ts
 * // pages/api/webhook.ts (Next.js Pages Router)
 * import { createVercelWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * export default createVercelWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * });
 * ```
 *
 * @example
 * ```ts
 * // app/api/webhook/route.ts (Next.js App Router)
 * // 对于 App Router，推荐使用 createWorkerWebhookHandler（Web Standard API）
 * import { createWorkerWebhookHandler } from '@mpusher/nodejs-sdk';
 *
 * const handler = createWorkerWebhookHandler({
 *   onArticle: async (article) => {
 *     console.log('收到文章:', article.title);
 *   },
 * });
 *
 * export async function POST(request: Request) {
 *   return handler(request);
 * }
 * ```
 */
export function createVercelWebhookHandler(
    options: WebhookHandlerOptions,
): (req: VercelLikeRequest, res: VercelLikeResponse) => Promise<void> {
    return async (req, res) => {
        // 仅允许 POST
        if (req.method && req.method !== 'POST') {
            res.status(405).json({ message: 'Method Not Allowed' });
            return;
        }

        const result = await parseWebhook(options, req.body);

        if (!result.ok) {
            res.status(result.status).json({ message: result.error });
            return;
        }

        res.status(200).json({ message: 'ok' });
    };
}
