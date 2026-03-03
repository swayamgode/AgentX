export default function Loading() {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 animate-pulse text-lg font-medium text-slate-400">
                Loading AgentX...
            </p>
        </div>
    );
}
