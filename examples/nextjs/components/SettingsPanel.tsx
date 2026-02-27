'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Settings, Save, Loader2 } from 'lucide-react';
import { saveCallbackConfig } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export function SettingsPanel() {
    const [callbackUrl, setCallbackUrl] = useState('');
    const [authToken, setAuthToken] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const origin = new URL(window.location.href).origin;
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setCallbackUrl(`${origin}/webhook`);
        }
    }, []);

    const saveMutation = useMutation({
        mutationFn: () => saveCallbackConfig(callbackUrl, authToken),
        onSuccess: () => showToast('配置保存成功'),
        onError: (error: Error) => showToast(error.message, 'error'),
    });

    const handleSave = () => {
        if (!callbackUrl.trim()) return showToast('请输入回调 URL', 'error');
        saveMutation.mutate();
    };

    return (
        <div className="animate-fade-in">
            <div className="card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand-400" />
                    推送回调配置
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                    设置后，MPusher 会将文章推送到此 URL。当前服务的 Webhook 地址已自动填入。
                </p>

                <div className="space-y-4 max-w-xl">
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">回调 URL</label>
                        <input
                            type="url"
                            value={callbackUrl}
                            onChange={(e) => setCallbackUrl(e.target.value)}
                            placeholder="https://your-domain.com/webhook"
                            className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-800/50 border border-gray-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-1.5 block">鉴权 Token（可选）</label>
                        <input
                            type="text"
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            placeholder="留空则不验证"
                            className="w-full px-4 py-2.5 rounded-lg text-sm bg-gray-800/50 border border-gray-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-70"
                        >
                            {saveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            保存配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
