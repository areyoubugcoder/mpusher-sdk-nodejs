// ============================================================
// MPusher Demo - Hono 应用
// 兼容 Cloudflare Workers / Vercel / Node.js
// ============================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from 'hono/adapter';
import { MPusherClient, MPusherError, createHonoWebhookHandler } from '@mpusher/nodejs-sdk';
import type { ArticlePushPayload } from '@mpusher/nodejs-sdk';

// ----------------------------------------------------------
// 类型
// ----------------------------------------------------------

type Bindings = {
  MPUSHER_TOKEN: string;
};

type Variables = {
  client: MPusherClient;
};

// ----------------------------------------------------------
// 内存存储（最近 50 条推送文章）
// ----------------------------------------------------------

const receivedArticles: ArticlePushPayload[] = [];
const MAX_ARTICLES = 50;

function addArticle(article: ArticlePushPayload) {
  receivedArticles.unshift(article);
  if (receivedArticles.length > MAX_ARTICLES) {
    receivedArticles.pop();
  }
}

// ----------------------------------------------------------
// 应用
// ----------------------------------------------------------

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', cors());

// ----------------------------------------------------------
// API 路由
// ----------------------------------------------------------

app.use('/api/*', async (c, next) => {
  const { MPUSHER_TOKEN: token } = env<Bindings>(c);
  if (!token) return c.json({ error: '未配置 MPUSHER_TOKEN 环境变量' }, 500);

  const client = new MPusherClient({ token });
  c.set('client', client);
  await next();
});

// 获取订阅列表
app.get('/api/subscriptions', async (c) => {
  const client = c.get('client');

  try {
    const page = Number(c.req.query('page') || '1');
    const pageSize = Number(c.req.query('pageSize') || '20');
    const mpName = c.req.query('mpName') || undefined;
    const result = await client.getSubscriptions({ page, pageSize, mpName });
    return c.json(result);
  } catch (err) {
    if (err instanceof MPusherError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// 通过文章 URL 订阅
app.post('/api/subscriptions', async (c) => {
  const client = c.get('client');

  try {
    const { articleUrl } = await c.req.json<{ articleUrl: string }>();
    const result = await client.subscribeByArticleUrl(articleUrl);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof MPusherError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// 取消订阅
app.delete('/api/subscriptions', async (c) => {
  const client = c.get('client');

  try {
    const { mpId } = await c.req.json<{ mpId: number }>();
    await client.unsubscribe(mpId);
    return c.body(null, 204);
  } catch (err) {
    if (err instanceof MPusherError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// 设置推送回调地址
app.put('/api/callback', async (c) => {
  const client = c.get('client');

  try {
    const body = await c.req.json<{ callbackUrl: string; authToken?: string }>();
    const result = await client.setCallback(body);
    return c.json(result);
  } catch (err) {
    if (err instanceof MPusherError) {
      return c.json({ error: err.message }, err.status as any);
    }
    return c.json({ error: String(err) }, 500);
  }
});

// 获取内存中的推送文章
app.get('/api/articles', (c) => {
  return c.json({ items: receivedArticles, total: receivedArticles.length });
});

// ----------------------------------------------------------
// Webhook 端点
// ----------------------------------------------------------

app.post('/webhook', createHonoWebhookHandler({
  onArticle: async (article) => {
    console.log(`[Webhook] 收到文章: ${article.title} (${article.mpName})`);
    addArticle(article);
  },
}));

// ----------------------------------------------------------
// 前端页面
// ----------------------------------------------------------

app.get('/', (c) => {
  return c.html(getHtml(c.req.url));
});

// ----------------------------------------------------------
// HTML 模板
// ----------------------------------------------------------

function getHtml(baseUrl: string) {
  const origin = new URL(baseUrl).origin;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MPusher SDK Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 50: '#f0f5ff', 100: '#e0eaff', 200: '#c2d5ff', 400: '#6b9fff', 500: '#4a80f0', 600: '#3366e0', 700: '#2952cc', 800: '#1e3d99', 900: '#142b66' }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, sans-serif; }
    .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .btn-primary { background: linear-gradient(135deg, #4a80f0, #3366e0); transition: all 0.2s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74,128,240,0.4); }
    .btn-danger { background: linear-gradient(135deg, #f04a4a, #e03333); transition: all 0.2s; }
    .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(240,74,74,0.4); }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s; }
    .card:hover { border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); }
    input, textarea { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; transition: border-color 0.2s; }
    input:focus, textarea:focus { outline: none; border-color: #4a80f0; box-shadow: 0 0 0 2px rgba(74,128,240,0.2); }
    .tab-active { color: #4a80f0; border-bottom: 2px solid #4a80f0; }
    .tab-inactive { color: #94a3b8; border-bottom: 2px solid transparent; }
    .tab-inactive:hover { color: #cbd5e1; }
    .toast { position: fixed; top: 24px; right: 24px; z-index: 100; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-online { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .status-offline { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
    .empty-state { color: #64748b; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
  </style>
</head>
<body class="dark bg-gray-950 text-gray-200 min-h-screen">

  <!-- Toast Container -->
  <div id="toastContainer"></div>

  <!-- Header -->
  <header class="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">M</div>
        <div>
          <h1 class="text-lg font-semibold text-white">MPusher SDK Demo</h1>
          <p class="text-xs text-gray-500">微信公众号文章推送服务</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500">Webhook:</span>
        <code class="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-brand-400">${origin}/webhook</code>
      </div>
    </div>
  </header>

  <!-- Tabs -->
  <nav class="max-w-6xl mx-auto px-6 pt-6 flex gap-6 border-b border-gray-800/40">
    <button onclick="switchTab('subscriptions')" id="tab-subscriptions" class="pb-3 px-1 text-sm font-medium tab-active cursor-pointer">📋 订阅管理</button>
    <button onclick="switchTab('webhook')" id="tab-webhook" class="pb-3 px-1 text-sm font-medium tab-inactive cursor-pointer">📨 推送日志</button>
    <button onclick="switchTab('settings')" id="tab-settings" class="pb-3 px-1 text-sm font-medium tab-inactive cursor-pointer">⚙️ 设置</button>
  </nav>

  <!-- Content -->
  <main class="max-w-6xl mx-auto px-6 py-6">

    <!-- 订阅管理 -->
    <div id="panel-subscriptions" class="fade-in">
      <!-- 订阅表单 -->
      <div class="card rounded-xl p-5 mb-6">
        <h3 class="text-sm font-semibold text-gray-300 mb-3">通过文章 URL 订阅公众号</h3>
        <div class="flex gap-3">
          <input id="articleUrlInput" type="url" placeholder="粘贴微信公众号文章链接，如 https://mp.weixin.qq.com/s/..." class="flex-1 px-4 py-2.5 rounded-lg text-sm" />
          <button onclick="subscribe()" class="btn-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap">订阅</button>
        </div>
      </div>

      <!-- 搜索 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-300">已订阅公众号</h3>
        <div class="flex gap-2">
          <input id="searchInput" type="text" placeholder="搜索公众号..." class="px-3 py-1.5 rounded-lg text-sm w-48" onkeyup="if(event.key==='Enter')loadSubscriptions()" />
          <button onclick="loadSubscriptions()" class="text-xs text-brand-400 hover:text-brand-300 px-2">刷新</button>
        </div>
      </div>

      <!-- 列表 -->
      <div id="subscriptionList" class="space-y-2">
        <div class="empty-state text-center py-12 text-sm">加载中...</div>
      </div>

      <!-- 分页 -->
      <div id="pagination" class="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400" style="display:none;">
        <button onclick="prevPage()" id="btnPrev" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40" disabled>上一页</button>
        <span id="pageInfo">第 1 页</span>
        <button onclick="nextPage()" id="btnNext" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40" disabled>下一页</button>
      </div>
    </div>

    <!-- 推送日志 -->
    <div id="panel-webhook" class="fade-in" style="display:none;">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-300">接收到的推送文章</h3>
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <span class="status-dot status-online"></span> Webhook 在线
          </span>
          <button onclick="loadArticles()" class="text-xs text-brand-400 hover:text-brand-300 px-2">刷新</button>
        </div>
      </div>
      <div id="articleList" class="space-y-2">
        <div class="empty-state text-center py-12 text-sm">暂无推送数据，请先订阅公众号并等待文章推送</div>
      </div>
    </div>

    <!-- 设置 -->
    <div id="panel-settings" class="fade-in" style="display:none;">
      <div class="card rounded-xl p-5">
        <h3 class="text-sm font-semibold text-gray-300 mb-4">推送回调配置</h3>
        <p class="text-xs text-gray-500 mb-4">设置后，MPusher 会将文章推送到此 URL。当前服务的 Webhook 地址已自动填入。</p>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-400 mb-1 block">回调 URL</label>
            <input id="callbackUrlInput" type="url" placeholder="https://your-domain.com/webhook" class="w-full px-4 py-2.5 rounded-lg text-sm" value="${origin}/webhook" />
          </div>
          <div>
            <label class="text-xs text-gray-400 mb-1 block">鉴权 Token（可选）</label>
            <input id="authTokenInput" type="text" placeholder="留空则不验证" class="w-full px-4 py-2.5 rounded-lg text-sm" />
          </div>
          <button onclick="saveCallback()" class="btn-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium">保存配置</button>
        </div>
      </div>
    </div>

  </main>

  <footer class="border-t border-gray-800/40 mt-12">
    <div class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-600">
      <span>Powered by <a href="https://mpusher.bugcode.dev" class="text-brand-500 hover:text-brand-400">MPusher SDK</a></span>
      <a href="https://github.com/nicepkg/mpusher-sdk-nodejs" class="hover:text-gray-400">GitHub →</a>
    </div>
  </footer>

<script>
// ============================================================
// State
// ============================================================
let currentPage = 1;
const pageSize = 20;
let totalItems = 0;

// ============================================================
// Tab 切换
// ============================================================
function switchTab(tab) {
  ['subscriptions', 'webhook', 'settings'].forEach(t => {
    document.getElementById('panel-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab-' + t).className = t === tab
      ? 'pb-3 px-1 text-sm font-medium tab-active cursor-pointer'
      : 'pb-3 px-1 text-sm font-medium tab-inactive cursor-pointer';
  });
  if (tab === 'webhook') loadArticles();
  if (tab === 'subscriptions') loadSubscriptions();
}

// ============================================================
// Toast
// ============================================================
function showToast(message, type = 'success') {
  const colors = {
    success: 'bg-emerald-900/90 border-emerald-700 text-emerald-200',
    error: 'bg-red-900/90 border-red-700 text-red-200',
    info: 'bg-brand-900/90 border-brand-700 text-brand-200'
  };
  const el = document.createElement('div');
  el.className = 'toast ' + colors[type] + ' px-4 py-3 rounded-lg border text-sm backdrop-blur-md';
  el.textContent = message;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ============================================================
// API
// ============================================================
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || '请求失败');
  return data;
}

// ============================================================
// 订阅管理
// ============================================================
async function loadSubscriptions() {
  const search = document.getElementById('searchInput').value;
  try {
    const params = new URLSearchParams({ page: currentPage, pageSize });
    if (search) params.set('mpName', search);
    const data = await api('GET', '/api/subscriptions?' + params);
    totalItems = data.total;
    renderSubscriptions(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSubscriptions(data) {
  const el = document.getElementById('subscriptionList');
  if (!data.items.length) {
    el.innerHTML = '<div class="empty-state text-center py-12 text-sm">暂无订阅，请通过文章 URL 添加订阅</div>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  el.innerHTML = data.items.map(item => \`
    <div class="card rounded-xl p-4 flex items-center justify-between fade-in">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-brand-400 text-sm font-semibold">
          \${item.mpName.charAt(0)}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-200">\${escapeHtml(item.mpName)}</p>
          <p class="text-xs text-gray-500 font-mono">ID: \${item.mpId}</p>
        </div>
      </div>
      <button onclick="unsubscribe(\${item.mpId}, '\${escapeHtml(item.mpName)}')" class="btn-danger text-white px-3 py-1.5 rounded-lg text-xs font-medium">取消订阅</button>
    </div>
  \`).join('');

  // 分页
  const totalPages = Math.ceil(totalItems / pageSize);
  const pg = document.getElementById('pagination');
  pg.style.display = totalPages > 1 ? 'flex' : 'none';
  document.getElementById('pageInfo').textContent = \`第 \${currentPage} / \${totalPages} 页 (共 \${totalItems} 个)\`;
  document.getElementById('btnPrev').disabled = currentPage <= 1;
  document.getElementById('btnNext').disabled = currentPage >= totalPages;
}

function prevPage() { currentPage--; loadSubscriptions(); }
function nextPage() { currentPage++; loadSubscriptions(); }

async function subscribe() {
  const input = document.getElementById('articleUrlInput');
  const url = input.value.trim();
  if (!url) return showToast('请输入文章 URL', 'error');
  try {
    const result = await api('POST', '/api/subscriptions', { articleUrl: url });
    showToast(\`订阅成功: \${result.data.mpName}\`);
    input.value = '';
    loadSubscriptions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function unsubscribe(mpId, mpName) {
  if (!confirm(\`确定取消订阅「\${mpName}」？\`)) return;
  try {
    await api('DELETE', '/api/subscriptions', { mpId });
    showToast(\`已取消订阅: \${mpName}\`);
    loadSubscriptions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 推送日志
// ============================================================
async function loadArticles() {
  try {
    const data = await api('GET', '/api/articles');
    renderArticles(data);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderArticles(data) {
  const el = document.getElementById('articleList');
  if (!data.items.length) {
    el.innerHTML = '<div class="empty-state text-center py-12 text-sm">暂无推送数据<br><span class="text-xs text-gray-600 mt-1 block">请先订阅公众号，在「设置」中配置推送地址，然后等待文章推送</span></div>';
    return;
  }
  el.innerHTML = data.items.map(item => \`
    <div class="card rounded-xl p-4 fade-in">
      <div class="flex items-start gap-4">
        \${item.coverImg ? \`<img src="\${item.coverImg}" class="w-20 h-14 rounded-lg object-cover flex-shrink-0" onerror="this.style.display='none'" />\` : ''}
        <div class="flex-1 min-w-0">
          <a href="\${item.url}" target="_blank" class="text-sm font-medium text-gray-200 hover:text-brand-400 line-clamp-1">\${escapeHtml(item.title)}</a>
          <p class="text-xs text-gray-500 mt-1 line-clamp-1">\${escapeHtml(item.description || '')}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span class="text-brand-400/70">\${escapeHtml(item.mpName)}</span>
            <span>\${formatTime(item.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  \`).join('');
}

// ============================================================
// 设置
// ============================================================
async function saveCallback() {
  const callbackUrl = document.getElementById('callbackUrlInput').value.trim();
  const authToken = document.getElementById('authTokenInput').value.trim();
  if (!callbackUrl) return showToast('请输入回调 URL', 'error');
  try {
    const body = { callbackUrl };
    if (authToken) body.authToken = authToken;
    await api('PUT', '/api/callback', body);
    showToast('配置保存成功');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 工具函数
// ============================================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// 初始化
// ============================================================
loadSubscriptions();
</script>
</body>
</html>`;
}

export default app;
