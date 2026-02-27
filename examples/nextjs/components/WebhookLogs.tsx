'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Activity } from 'lucide-react';
import { fetchArticles } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

function formatTime(ts?: number) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function WebhookLogs() {
    const { showToast } = useToast();

    const { data, isLoading, refetch, isFetching, error } = useQuery({
        queryKey: ['articles'],
        queryFn: fetchArticles,
        refetchInterval: 5000,
    });

    if (error) {
        showToast(error.message, 'error');
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-400" />
                    接收到的推送文章
                </h3>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e]"></span>
                        Webhook 在线
                    </span>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="text-xs text-brand-400 hover:text-brand-300 p-2 rounded-lg hover:bg-brand-400/10 transition-colors"
                        title="刷新数据"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 min-h-[200px]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                ) : !data?.items?.length ? (
                    <div className="text-gray-500 text-center py-12 text-sm border border-dashed border-gray-800 rounded-xl">
                        暂无推送数据
                        <br />
                        <span className="text-xs text-gray-600 mt-1 block">
                            请先订阅公众号，在「设置」中配置推送地址，然后等待文章推送
                        </span>
                    </div>
                ) : (
                    data.items.map((item, idx) => (
                        <div key={idx} className="card rounded-xl p-4 animate-fade-in transition-all hover:bg-white/5">
                            <div className="flex items-start gap-4">
                                {item.coverImg && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={item.coverImg}
                                        alt={item.title}
                                        className="w-24 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-800"
                                        loading="lazy"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium text-gray-200 hover:text-brand-400 line-clamp-1 transition-colors"
                                    >
                                        {item.title}
                                    </a>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                        {item.description || '无摘要信息'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                        <span className="text-brand-400/70 font-medium bg-brand-400/10 px-2 py-0.5 rounded">
                                            {item.mpName}
                                        </span>
                                        <span>{formatTime(item.publishedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
