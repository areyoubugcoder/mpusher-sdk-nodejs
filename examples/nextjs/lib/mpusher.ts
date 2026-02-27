import { MPusherClient } from '@mpusher/nodejs-sdk';
import type { ArticlePushPayload } from '@mpusher/nodejs-sdk';

// ----------------------------------------------------------
// MPusher Client Singleton
// ----------------------------------------------------------
let clientInstance: MPusherClient | null = null;

export function getMPusherClient() {
    if (clientInstance) return clientInstance;

    const token = process.env.MPUSHER_TOKEN;
    if (!token) {
        throw new Error('未配置 MPUSHER_TOKEN 环境变量');
    }

    clientInstance = new MPusherClient({ token });
    return clientInstance;
}

// ----------------------------------------------------------
// 内存存储（最近 50 条推送文章）
// ----------------------------------------------------------
const receivedArticles: ArticlePushPayload[] = [];
const MAX_ARTICLES = 50;

export function addArticle(article: ArticlePushPayload) {
    receivedArticles.unshift(article);
    if (receivedArticles.length > MAX_ARTICLES) {
        receivedArticles.pop();
    }
}

export function getArticles() {
    return receivedArticles;
}
