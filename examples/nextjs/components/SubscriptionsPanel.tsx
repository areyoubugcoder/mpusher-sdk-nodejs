'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, Link2, Trash2, UserCircle2 } from 'lucide-react';
import { fetchSubscriptions, addSubscription, removeSubscription } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export function SubscriptionsPanel() {
    const [articleUrl, setArticleUrl] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['subscriptions', page, pageSize, searchQuery],
        queryFn: () => fetchSubscriptions(page, pageSize, searchQuery),
    });

    const subscribeMutation = useMutation({
        mutationFn: addSubscription,
        onSuccess: (res) => {
            showToast(`订阅成功: ${res.data?.mpName || '公众号'}`);
            setArticleUrl('');
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
        onError: (error: Error) => showToast(error.message, 'error'),
    });

    const unsubscribeMutation = useMutation({
        mutationFn: removeSubscription,
        onSuccess: (_, mpId) => {
            showToast(`已取消订阅 (ID: ${mpId})`);
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
        onError: (error: Error) => showToast(error.message, 'error'),
    });

    const handleSubscribe = () => {
        if (!articleUrl.trim()) return showToast('请输入文章 URL', 'error');
        subscribeMutation.mutate(articleUrl.trim());
    };

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchQuery(searchInput);
            setPage(1);
        }
    };

    const handleUnsubscribe = (mpId: number, mpName: string) => {
        if (confirm(`确定取消订阅「${mpName}」？`)) {
            unsubscribeMutation.mutate(mpId);
        }
    };

    const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;

    return (
        <div className="animate-fade-in">
            {/* Subscribe Form */}
            <div className="card rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-brand-400" />
                    通过文章 URL 订阅公众号
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="url"
                        value={articleUrl}
                        onChange={(e) => setArticleUrl(e.target.value)}
                        placeholder="粘贴微信公众号文章链接，如 https://mp.weixin.qq.com/s/..."
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-gray-800/50 border border-gray-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                        disabled={subscribeMutation.isPending}
                    />
                    <button
                        onClick={handleSubscribe}
                        disabled={subscribeMutation.isPending}
                        className="btn-primary flex items-center justify-center gap-2 text-white px-6 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-70"
                    >
                        {subscribeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : '订阅'}
                    </button>
                </div>
            </div>

            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <UserCircle2 className="w-4 h-4 text-brand-400" />
                    已订阅公众号
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearch}
                            placeholder="搜索公众号..."
                            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-sm bg-gray-800/50 border border-gray-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => { setSearchQuery(searchInput); setPage(1); refetch(); }}
                        disabled={isFetching}
                        className="text-xs text-brand-400 hover:text-brand-300 p-2 rounded-lg hover:bg-brand-400/10 transition-colors"
                        title="刷新数据"
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-2 min-h-[200px]">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                ) : !data?.items?.length ? (
                    <div className="text-gray-500 text-center py-12 text-sm border border-dashed border-gray-800 rounded-xl">
                        暂无订阅，请通过文章 URL 添加订阅
                    </div>
                ) : (
                    data.items.map((item) => (
                        <div key={item.mpId} className="card rounded-xl p-4 flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center text-brand-400 text-sm font-semibold uppercase">
                                    {item.mpName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-200">{item.mpName}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {item.mpId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnsubscribe(item.mpId, item.mpName)}
                                disabled={unsubscribeMutation.isPending}
                                className="btn-danger flex items-center gap-1.5 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-70"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">取消订阅</span>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400 animate-fade-in">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1 || isFetching}
                        className="px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                        上一页
                    </button>
                    <span>
                        第 {page} / {totalPages} 页 <span className="text-gray-600">(共 {data?.total} 个)</span>
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isFetching}
                        className="px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                        下一页
                    </button>
                </div>
            )}
        </div>
    );
}
