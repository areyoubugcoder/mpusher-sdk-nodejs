/**
 * 集成测试脚本 - 使用真实 API Token 测试 SDK
 * 运行: npx tsx tests/integration.ts
 */
import { MPusherClient, MPusherError } from '../src/index.js';

const TOKEN = '5f30b928-eb2a-4f8d-ac87-67c5f6f8fa8c';

const client = new MPusherClient({ token: TOKEN });

async function main() {
    console.log('=== MPusher SDK 集成测试 ===\n');

    // 1. 查询订阅列表
    console.log('--- 1. 查询订阅列表 ---');
    try {
        const list = await client.getSubscriptions({ page: 1, pageSize: 5 });
        console.log('✅ 成功! 响应:', JSON.stringify(list, null, 2));
    } catch (err) {
        if (err instanceof MPusherError) {
            console.log(`❌ 失败: HTTP ${err.status} - ${err.message}`);
        } else {
            console.log('❌ 异常:', err);
        }
    }

    console.log('');

    // 2. 查询订阅列表 (带搜索)
    console.log('--- 2. 查询订阅列表 (带搜索) ---');
    try {
        const list = await client.getSubscriptions({ mpName: '测试' });
        console.log('✅ 成功! 响应:', JSON.stringify(list, null, 2));
    } catch (err) {
        if (err instanceof MPusherError) {
            console.log(`❌ 失败: HTTP ${err.status} - ${err.message}`);
        } else {
            console.log('❌ 异常:', err);
        }
    }

    console.log('');

    // 3. 设置推送回调地址
    console.log('--- 3. 设置推送回调地址 ---');
    try {
        const result = await client.setCallback({
            callbackUrl: 'https://example.com/webhook/mpusher',
            authToken: 'test-webhook-token',
        });
        console.log('✅ 成功! 响应:', JSON.stringify(result, null, 2));
    } catch (err) {
        if (err instanceof MPusherError) {
            console.log(`❌ 失败: HTTP ${err.status} - ${err.message}`);
            console.log('   响应体:', JSON.stringify((err as MPusherError).response, null, 2));
        } else {
            console.log('❌ 异常:', err);
        }
    }

    console.log('');

    // 4. 测试错误处理 - 用错误的 URL 订阅
    console.log('--- 4. 错误处理测试 (无效URL订阅) ---');
    try {
        await client.subscribeByArticleUrl('not-a-valid-url');
        console.log('❌ 应该抛出错误但没有');
    } catch (err) {
        if (err instanceof MPusherError) {
            console.log(`✅ 正确捕获错误: HTTP ${err.status} - ${err.message}`);
        } else {
            console.log('❌ 异常类型不正确:', err);
        }
    }

    console.log('\n=== 集成测试完成 ===');
}

main().catch(console.error);
