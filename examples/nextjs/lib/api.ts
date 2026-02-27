export interface SubscriptionsResponse {
    items: Array<{
        mpId: number;
        mpName: string;
        createdAt?: number;
    }>;
    total: number;
}

export interface ArticlesResponse {
    items: Array<{
        title: string;
        description?: string;
        url: string;
        mpName: string;
        coverImg?: string;
        publishedAt?: number;
    }>;
    total: number;
}

function getHeaders(extraHeaders: Record<string, string> = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('MPUSHER_TOKEN') : null;
    return {
        ...extraHeaders,
        ...(token ? { 'x-mpusher-token': token } : {})
    };
}

export async function fetchSubscriptions(page = 1, pageSize = 20, mpName?: string): Promise<SubscriptionsResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (mpName) params.set('mpName', mpName);

    const res = await fetch(`/api/subscriptions?${params}`, {
        headers: getHeaders()
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch subscriptions');
    }
    return res.json();
}

export async function addSubscription(articleUrl: string) {
    const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ articleUrl }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to subscribe');
    }
    return res.json();
}

export async function removeSubscription(mpId: number) {
    const res = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mpId }),
    });
    if (res.status === 204) return;
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unsubscribe');
    }
    return res.json();
}

export async function fetchArticles(): Promise<ArticlesResponse> {
    const res = await fetch('/api/articles');
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch articles');
    }
    return res.json();
}

export async function saveCallbackConfig(callbackUrl: string, authToken?: string) {
    const res = await fetch('/api/callback', {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ callbackUrl, authToken: authToken || undefined }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save config');
    }
    return res.json();
}
