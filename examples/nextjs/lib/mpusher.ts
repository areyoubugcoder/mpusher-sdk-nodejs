import { MPusherClient, MPusherError } from '@mpusher/nodejs-sdk';
import type { ArticlePushPayload } from '@mpusher/nodejs-sdk';
import fs from 'node:fs';
import path from 'node:path';

// ----------------------------------------------------------
// MPusher Client Singleton
// ----------------------------------------------------------
let clientInstance: MPusherClient | null = null;

export function getMPusherClient(token?: string | null) {
    if (!clientInstance && !token) {
        throw new MPusherError('未配置 MPUSHER_TOKEN 环境变量或请求头', 401);
    }

    if (token) {
        // 如果传入了新的 token 且与当前不同，则重新实例化
        if (!clientInstance || clientInstance['token'] !== token) {
            clientInstance = new MPusherClient({ token });
        }
    }

    return clientInstance as MPusherClient;
}

// ----------------------------------------------------------
// 文件持久化存储（最近 50 条推送文章）
// ----------------------------------------------------------
const MAX_ARTICLES = 50;
const DATA_DIR = path.join('/tmp', 'data');
const DATA_FILE = path.join(DATA_DIR, 'articles.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadArticles(): ArticlePushPayload[] {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw) as ArticlePushPayload[];
        }
    } catch {
        // 文件损坏时重置
    }
    return [];
}

function saveArticles(articles: ArticlePushPayload[]) {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), 'utf-8');
}

export function addArticle(article: ArticlePushPayload) {
    const articles = loadArticles();

    // 按 articleId 去重，跳过已存在的文章
    if (articles.some((a) => a.articleId === article.articleId)) {
        return;
    }

    articles.unshift(article);
    if (articles.length > MAX_ARTICLES) {
        articles.pop();
    }
    saveArticles(articles);
}

export function getArticles() {
    return loadArticles();
}
