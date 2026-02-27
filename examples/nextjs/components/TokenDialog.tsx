'use client';

import { useState, useEffect } from 'react';
import { KeyRound, ArrowRight } from 'lucide-react';

export function TokenDialog() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        setMounted(true);
        const storedToken = localStorage.getItem('MPUSHER_TOKEN');
        if (!storedToken) {
            setIsOpen(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = token.trim();
        if (trimmed) {
            localStorage.setItem('MPUSHER_TOKEN', trimmed);
            setIsOpen(false);
            // Reload to re-initialize React Query with the new token headers
            window.location.reload();
        }
    };

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-brand-500/20 blur-[60px] pointer-events-none" />

                <div className="relative">
                    <div className="w-12 h-12 bg-gray-800/80 rounded-xl flex items-center justify-center mb-6 border border-gray-700/50">
                        <KeyRound className="w-6 h-6 text-brand-400" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">配置 MPUSHER_TOKEN</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        检测到本地尚未配置 API Token。请输入您的 MPUSHER_TOKEN 以继续体验服务，该 Token 将仅保存在您的浏览器本地。
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                autoFocus
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="请输入 MPUSHER_TOKEN..."
                                className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!token.trim()}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-brand-600 flex items-center justify-center gap-2 group"
                        >
                            保存配置
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
