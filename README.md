# MPusher SDK for Node.js

微信公众号文章推送服务 [MPusher](https://mpusher.bugcode.dev) 的 Node.js SDK。

- ✅ **TypeScript 原生支持**，完整类型定义
- ✅ **零运行时依赖**，使用原生 `fetch`（Node.js 18+）
- ✅ **全平台兼容**：Node.js / Cloudflare Workers / Vercel / Deno / Bun
- ✅ **6 种 Webhook 适配器**：Express、Koa、Hapi、Hono、Cloudflare Workers、Vercel/Next.js

## 一键部署体验

您可以直接一键体验 MPusher 提供的带有前端管理界面的演示项目：

### 部署到 Vercel (Hono 版本)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fareyoubugcoder%2Fmpusher-sdk-nodejs%2Ftree%2Fmain%2Fexamples%2Fhonojs&repository-name=mpusher-honojs)

### 部署到 Vercel (Next.js 版本)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fareyoubugcoder%2Fmpusher-sdk-nodejs%2Ftree%2Fmain%2Fexamples%2Fnextjs&repository-name=mpusher-nextjs)

## 安装

```bash
npm install @mpusher/nodejs-sdk
# or
pnpm add @mpusher/nodejs-sdk
# or
yarn add @mpusher/nodejs-sdk
```

## 快速开始

### 配置

SDK 支持两种配置方式：

**方式一：构造函数参数**

```typescript
const client = new MPusherClient({ token: 'your-api-token' });
```

**方式二：环境变量 / `.env` 文件**

```bash
# .env
MPUSHER_TOKEN=your-api-token
MPUSHER_BASE_URL=https://mpusher.bugcode.dev  # 可选，有默认值
```

```typescript
// 自动从环境变量读取
const client = new MPusherClient();
```

> 构造函数参数优先级高于环境变量。

### API 客户端

```typescript
import { MPusherClient } from '@mpusher/nodejs-sdk';

const client = new MPusherClient({ token: 'your-api-token' });

// 查询订阅列表
const list = await client.getSubscriptions({ page: 1, pageSize: 10 });
console.log(list.items);

// 通过文章 URL 订阅公众号
const result = await client.subscribeByArticleUrl('https://mp.weixin.qq.com/s/xxx');
console.log(result.data.mpName);

// 取消订阅
await client.unsubscribe(1201153931);

// 设置推送回调地址
await client.setCallback({
  callbackUrl: 'https://your-domain.com/webhook',
  authToken: 'your-webhook-token',  // 可选
});
```

### 错误处理

```typescript
import { MPusherClient, MPusherError } from '@mpusher/nodejs-sdk';

try {
  await client.subscribeByArticleUrl('invalid-url');
} catch (err) {
  if (err instanceof MPusherError) {
    console.log(err.status);   // 400
    console.log(err.message);  // "文章URL格式不正确"
  }
}
```

## Webhook 适配器

所有适配器共享相同的配置接口：

```typescript
{
  onArticle: async (article) => {
    // article: ArticlePushPayload
    console.log(article.title);
    console.log(article.mpName);
    console.log(article.url);
  }
}
```

### Express

```typescript
import express from 'express';
import { createExpressWebhookHandler } from '@mpusher/nodejs-sdk';

const app = express();
app.use(express.json());

app.post('/webhook', createExpressWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
}));

app.listen(3000);
```

### Koa

```typescript
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { createKoaWebhookHandler } from '@mpusher/nodejs-sdk';

const app = new Koa();
app.use(bodyParser());

const webhook = createKoaWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
});

app.use(async (ctx, next) => {
  if (ctx.path === '/webhook' && ctx.method === 'POST') {
    return webhook(ctx, next);
  }
  await next();
});

app.listen(3000);
```

### Hapi

```typescript
import Hapi from '@hapi/hapi';
import { createHapiWebhookHandler } from '@mpusher/nodejs-sdk';

const server = Hapi.server({ port: 3000 });

server.route({
  method: 'POST',
  path: '/webhook',
  handler: createHapiWebhookHandler({
    onArticle: async (article) => {
      console.log('收到文章:', article.title);
    },
  }),
});

await server.start();
```

### Hono

```typescript
import { Hono } from 'hono';
import { createHonoWebhookHandler } from '@mpusher/nodejs-sdk';

const app = new Hono();

app.post('/webhook', createHonoWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
}));

export default app;
```

### Cloudflare Workers

```typescript
import { createWorkerWebhookHandler } from '@mpusher/nodejs-sdk';

const handler = createWorkerWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
});

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handler(request);
    }
    return new Response('Not Found', { status: 404 });
  },
};
```

### Vercel / Next.js

**Pages Router** (`pages/api/webhook.ts`):

```typescript
import { createVercelWebhookHandler } from '@mpusher/nodejs-sdk';

export default createVercelWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
});
```

**App Router** (`app/api/webhook/route.ts`):

```typescript
import { createWorkerWebhookHandler } from '@mpusher/nodejs-sdk';

const handler = createWorkerWebhookHandler({
  onArticle: async (article) => {
    console.log('收到文章:', article.title);
  },
});

export async function POST(request: Request) {
  return handler(request);
}
```

### 自定义适配器

使用核心函数 `parseWebhook` 构建自定义适配器：

```typescript
import { parseWebhook } from '@mpusher/nodejs-sdk';

const result = await parseWebhook(
  { onArticle: async (article) => { /* ... */ } },
  requestBody,
);

if (!result.ok) {
  // result.status, result.error
}
```

## API 参考

### `MPusherClient`

| 方法 | 说明 | 返回类型 |
|------|------|----------|
| `getSubscriptions(params?)` | 查询订阅列表 | `Promise<SubscriptionListResponse>` |
| `subscribeByArticleUrl(url)` | 通过文章 URL 订阅 | `Promise<SubscribeByArticleResponse>` |
| `unsubscribe(mpId)` | 取消订阅 | `Promise<void>` |
| `setCallback(config)` | 设置推送回调地址 | `Promise<CallbackConfigResponse>` |

### `ArticlePushPayload`

| 字段 | 类型 | 说明 |
|------|------|------|
| `articleId` | `string` | 文章唯一标识 |
| `mpId` | `number` | 公众号 ID |
| `mpIdB64` | `string` | Base64 编码的公众号 ID |
| `mpName` | `string` | 公众号名称 |
| `title` | `string` | 文章标题 |
| `coverImg` | `string` | 封面图片 URL |
| `description` | `string` | 文章描述 |
| `publishedAt` | `number` | 发布时间（Unix 时间戳） |
| `url` | `string` | 文章主链接 |
| `url2` | `string` | 文章备用链接 |
| `articleMsgId` | `number` | 文章消息 ID |
| `articleIdx` | `number` | 文章索引位置 |
| `articleSn` | `string` | 文章签名 |

## License

MIT
