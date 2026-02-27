import { MPusherClient, MPusherError } from '@mpusher/nodejs-sdk';
import type { ArticlePushPayload } from '@mpusher/nodejs-sdk';

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
