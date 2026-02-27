'use client';

import { useState, useEffect } from 'react';
import { LayoutList, Activity, Settings as SettingsIcon, Terminal } from 'lucide-react';
import { SubscriptionsPanel } from '@/components/SubscriptionsPanel';
import { WebhookLogs } from '@/components/WebhookLogs';
import { SettingsPanel } from '@/components/SettingsPanel';

type Tab = 'subscriptions' | 'webhook' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('subscriptions');
  const [mounted, setMounted] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setWebhookUrl(`${window.location.origin}/webhook`);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/20">
              M
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">MPusher SDK Demo</h1>
              <p className="text-xs text-gray-500">微信公众号文章推送服务</p>
            </div>
          </div>
          {mounted && (
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-800/50">
              <Terminal className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Webhook:</span>
              <code className="text-xs font-mono text-brand-400 truncate max-w-[200px] sm:max-w-xs block">
                {webhookUrl}
              </code>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-6xl mx-auto px-6 pt-6 flex gap-6 border-b border-gray-800/40 relative">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-1 text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 relative ${activeTab === 'subscriptions' ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          <LayoutList className="w-4 h-4" />
          <span className="hidden sm:inline">订阅管理</span>
          {activeTab === 'subscriptions' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 rounded-t-full relative-tab-indicator" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-3 px-1 text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 relative ${activeTab === 'webhook' ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">推送日志</span>
          {activeTab === 'webhook' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 rounded-t-full relative-tab-indicator" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-1 text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 relative ${activeTab === 'settings' ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">设置</span>
          {activeTab === 'settings' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 rounded-t-full relative-tab-indicator" />
          )}
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6 min-h-[50vh]">
        {activeTab === 'subscriptions' && <SubscriptionsPanel />}
        {activeTab === 'webhook' && <WebhookLogs />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/40 mt-12 bg-gray-950/50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-500">
          <span>
            Powered by{' '}
            <a
              href="https://mpusher.bugcode.dev"
              target="_blank"
              rel="noreferrer"
              className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
            >
              MPusher SDK
            </a>
          </span>
          <a
            href="https://github.com/nicepkg/mpusher-sdk-nodejs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            GitHub <ExternalLinkIcon />
          </a>
        </div>
      </footer>
    </>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
