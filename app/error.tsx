'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4 text-center">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
                Something went wrong!
            </h2>
            <p className="mb-8 text-lg text-[#86868b]">
                We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-2 bg-[#8b5cf6] text-white rounded-xl font-bold hover:bg-[#7c3aed] transition-colors shadow-lg shadow-purple-500/20"
                >
                    Try again
                </button>
                <button
                    onClick={() => (window.location.href = '/')}
                    className="px-6 py-2 bg-white border border-[#e5e5e7] text-[#1d1d1f] rounded-xl font-bold hover:bg-[#f5f5f7] transition-colors"
                >
                    Go back home
                </button>
            </div>
        </div>
    );
}
