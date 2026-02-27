// ============================================================
// MPusher SDK - API 客户端
// ============================================================

import { MPusherError } from './errors.js';
import type {
    MPusherConfig,
    SubscriptionListParams,
    SubscriptionListResponse,
    SubscribeByArticleResponse,
    CallbackConfig,
    CallbackConfigResponse,
} from './types.js';

const DEFAULT_BASE_URL = 'https://mpusher.bugcode.dev';
const API_PREFIX = '/public-api';

/**
 * 从环境变量中安全读取值（兼容无 process 的运行时如 Cloudflare Workers）
 */
function getEnv(key: string): string | undefined {
    try {
        return typeof process !== 'undefined' ? process.env[key] : undefined;
    } catch {
        return undefined;
    }
}

/**
 * MPusher API 客户端
 *
 * 使用原生 `fetch` 实现，兼容 Node.js 18+、Cloudflare Workers、Vercel Edge 等运行时。
 *
 * 支持通过环境变量配置：
 * - `MPUSHER_TOKEN` — API 鉴权 Token
 * - `MPUSHER_BASE_URL` — API 基础地址（默认 https://mpusher.bugcode.dev）
 *
 * @example
 * ```ts
 * // 方式一：通过构造函数参数
 * const client = new MPusherClient({ token: 'your-api-token' });
 *
 * // 方式二：通过环境变量（.env 文件）
 * // MPUSHER_TOKEN=your-api-token
 * // MPUSHER_BASE_URL=https://mpusher.bugcode.dev  （可选）
 * const client = new MPusherClient();
 * ```
 */
export class MPusherClient {
    private readonly baseUrl: string;
    private readonly token: string;

    constructor(config?: MPusherConfig) {
        const token = config?.token ?? getEnv('MPUSHER_TOKEN');
        if (!token) {
            throw new Error(
                'MPusherClient: 未提供 token。请通过构造函数参数传入，或设置环境变量 MPUSHER_TOKEN',
            );
        }
        this.token = token;
        this.baseUrl = (
            config?.baseUrl ?? getEnv('MPUSHER_BASE_URL') ?? DEFAULT_BASE_URL
        ).replace(/\/+$/, '');
    }

    // ----------------------------------------------------------
    // 公共 API 方法
    // ----------------------------------------------------------

    /**
     * 查询订阅的公众号列表
     *
     * @param params - 查询参数（可选）
     * @returns 分页的订阅列表
     * @throws {MPusherError} 请求失败时
     */
    async getSubscriptions(
        params?: SubscriptionListParams,
    ): Promise<SubscriptionListResponse> {
        const searchParams = new URLSearchParams();
        if (params?.page != null) searchParams.set('page', String(params.page));
        if (params?.pageSize != null) searchParams.set('pageSize', String(params.pageSize));
        if (params?.mpName) searchParams.set('mpName', params.mpName);

        const query = searchParams.toString();
        const path = `/subscriptions${query ? `?${query}` : ''}`;

        return this.request<SubscriptionListResponse>('GET', path);
    }

    /**
     * 通过文章 URL 订阅公众号
     *
     * @param articleUrl - 微信公众号文章 URL
     * @returns 订阅结果（包含公众号信息）
     * @throws {MPusherError} 请求失败时（400: URL格式不正确, 404: 文章不存在, 409: 已订阅）
     */
    async subscribeByArticleUrl(
        articleUrl: string,
    ): Promise<SubscribeByArticleResponse> {
        return this.request<SubscribeByArticleResponse>('POST', '/subscriptions/by-article-url', {
            articleUrl,
        });
    }

    /**
     * 取消订阅公众号
     *
     * @param mpId - 公众号 ID
     * @throws {MPusherError} 请求失败时（400: 参数错误, 404: 未订阅）
     */
    async unsubscribe(mpId: number): Promise<void> {
        await this.request<void>('DELETE', '/subscriptions', { mpId });
    }

    /**
     * 设置文章推送回调地址
     *
     * @param config - 回调配置（URL + 可选 Token）
     * @returns 操作结果消息
     * @throws {MPusherError} 请求失败时（400: URL格式不正确）
     */
    async setCallback(config: CallbackConfig): Promise<CallbackConfigResponse> {
        return this.request<CallbackConfigResponse>('PUT', '/config/callback', config);
    }

    // ----------------------------------------------------------
    // 内部方法
    // ----------------------------------------------------------

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
    ): Promise<T> {
        const url = `${this.baseUrl}${API_PREFIX}${path}`;

        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };

        const init: RequestInit = {
            method,
            headers,
        };

        if (body !== undefined && method !== 'GET') {
            init.body = JSON.stringify(body);
        }

        let response: Response;
        try {
            response = await fetch(url, init);
        } catch (err) {
            throw new MPusherError(
                `网络请求失败: ${err instanceof Error ? err.message : String(err)}`,
                0,
            );
        }

        // 204 No Content
        if (response.status === 204) {
            return undefined as T;
        }

        // 尝试解析 JSON 响应
        let data: unknown;
        try {
            data = await response.json();
        } catch {
            // 非 JSON 响应
            if (!response.ok) {
                throw new MPusherError(
                    `请求失败 (HTTP ${response.status})`,
                    response.status,
                );
            }
            return undefined as T;
        }

        if (!response.ok) {
            const errorMessage =
                (data as { message?: string })?.message ??
                `请求失败 (HTTP ${response.status})`;
            throw new MPusherError(errorMessage, response.status, data);
        }

        return data as T;
    }
}
