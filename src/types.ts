// ============================================================
// MPusher SDK - 类型定义
// ============================================================

/**
 * SDK 初始化配置
 */
export interface MPusherConfig {
    /** API 鉴权 Token（Bearer Token），也可通过环境变量 MPUSHER_TOKEN 设置 */
    token?: string;
    /** API 基础地址，也可通过环境变量 MPUSHER_BASE_URL 设置，默认: https://mpusher.bugcode.dev */
    baseUrl?: string;
}

// ------------------------------------------------------------
// 订阅相关
// ------------------------------------------------------------

/** 订阅的公众号信息 */
export interface Subscription {
    /** 公众号 ID */
    mpId: number;
    /** 公众号名称 */
    mpName: string;
}

/** 查询订阅列表的参数 */
export interface SubscriptionListParams {
    /** 页码，默认 1 */
    page?: number;
    /** 每页数量，默认 10，最大 100 */
    pageSize?: number;
    /** 按公众号名称搜索 */
    mpName?: string;
}

/** 查询订阅列表的响应 */
export interface SubscriptionListResponse {
    /** 订阅列表 */
    items: Subscription[];
    /** 总数 */
    total: number;
    /** 当前页 */
    page: number;
    /** 每页数量 */
    pageSize: number;
}

/** 通过文章 URL 订阅的响应 */
export interface SubscribeByArticleResponse {
    /** 订阅的公众号信息 */
    data: Subscription;
    /** 状态消息 */
    message: string;
}

// ------------------------------------------------------------
// 推送回调配置
// ------------------------------------------------------------

/** 设置推送地址的参数 */
export interface CallbackConfig {
    /** 回调 URL，用于接收文章推送 */
    callbackUrl: string;
    /** 鉴权 Token（可选），MPusher 推送时会在 Authorization 头中携带 */
    authToken?: string;
}

/** 设置推送地址的响应 */
export interface CallbackConfigResponse {
    /** 状态消息 */
    message: string;
}

// ------------------------------------------------------------
// 文章推送数据
// ------------------------------------------------------------

/** 推送的文章数据（由 MPusher 发送到您的回调地址） */
export interface ArticlePushPayload {
    /** 文章唯一标识符 */
    articleId: string;
    /** 公众号 ID */
    mpId: number;
    /** Base64 编码的公众号 ID */
    mpIdB64: string;
    /** 公众号名称 */
    mpName: string;
    /** 文章消息 ID */
    articleMsgId: number;
    /** 文章索引位置 */
    articleIdx: number;
    /** 文章签名（用于备用链接） */
    articleSn: string;
    /** 文章标题 */
    title: string;
    /** 封面图片 URL */
    coverImg: string;
    /** 文章描述 */
    description: string;
    /** 发布时间（Unix 时间戳，秒） */
    publishedAt: number;
    /** 文章主链接 */
    url: string;
    /** 文章备用链接 */
    url2: string;
}

// ------------------------------------------------------------
// 错误响应
// ------------------------------------------------------------

/** API 错误响应格式 */
export interface MPusherErrorResponse {
    /** 错误描述信息 */
    message: string;
}

// ------------------------------------------------------------
// Webhook 配置
// ------------------------------------------------------------

/** Webhook 处理器配置 */
export interface WebhookHandlerOptions {
    /** 收到文章推送时的回调函数 */
    onArticle: (article: ArticlePushPayload) => void | Promise<void>;
}
