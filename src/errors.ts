// ============================================================
// MPusher SDK - 自定义错误类
// ============================================================

/**
 * MPusher API 错误
 *
 * 当 API 请求返回非成功状态码时抛出此错误。
 *
 * @example
 * ```ts
 * try {
 *   await client.unsubscribe(123);
 * } catch (err) {
 *   if (err instanceof MPusherError) {
 *     console.log(err.status);  // HTTP 状态码，如 404
 *     console.log(err.message); // 错误描述
 *   }
 * }
 * ```
 */
export class MPusherError extends Error {
    /** HTTP 状态码 */
    public readonly status: number;
    /** 原始响应体 */
    public readonly response: unknown;

    constructor(message: string, status: number, response?: unknown) {
        super(message);
        this.name = 'MPusherError';
        this.status = status;
        this.response = response;

        // 确保 instanceof 在 TypeScript 编译后仍然正常工作
        Object.setPrototypeOf(this, MPusherError.prototype);
    }
}
