import { useState, useEffect, useCallback } from 'react';

interface SocialStatus {
    youtube: {
        connected: boolean;
        username?: string;
    };
    instagram: {
        connected: boolean;
        username?: string;
    };
}

export function useSocialConnection() {
    const [status, setStatus] = useState<SocialStatus>({
        youtube: { connected: false },
        instagram: { connected: false }
    });
    const [loading, setLoading] = useState(true);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/social/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to check social status', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    // Listen for focus to re-check (e.g. after coming back from auth redirect)
    useEffect(() => {
        const onFocus = () => checkStatus();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [checkStatus]);

    return { status, loading, refresh: checkStatus };
}
