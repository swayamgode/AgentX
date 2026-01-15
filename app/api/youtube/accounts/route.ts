import { NextRequest, NextResponse } from 'next/server';
import { multiAccountStorage } from '@/lib/token-storage';

export async function GET(request: NextRequest) {
    try {
        const accounts = multiAccountStorage.getAllAccounts();
        const activeAccount = multiAccountStorage.getActiveAccount();

        return NextResponse.json({
            accounts: accounts.map(acc => ({
                id: acc.id,
                channelName: acc.channelName,
                channelId: acc.channelId,
                email: acc.email,
                watermark: acc.watermark,
                thumbnailUrl: acc.thumbnailUrl,
                isActive: acc.id === activeAccount?.id,
                createdAt: acc.createdAt
            })),
            activeAccountId: activeAccount?.id || null
        });
    } catch (error) {
        console.error('Failed to get accounts:', error);
        return NextResponse.json({ error: 'Failed to load accounts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, accountId, updates } = body;

        switch (action) {
            case 'setActive':
                if (!accountId) {
                    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
                }
                const success = multiAccountStorage.setActiveAccount(accountId);
                if (!success) {
                    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
                }
                return NextResponse.json({ success: true });

            case 'updateWatermark':
                if (!accountId || !updates?.watermark) {
                    return NextResponse.json({ error: 'Account ID and watermark required' }, { status: 400 });
                }
                const updated = multiAccountStorage.updateAccount(accountId, { watermark: updates.watermark });
                if (!updated) {
                    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
                }
                return NextResponse.json({ success: true });

            case 'remove':
                if (!accountId) {
                    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
                }
                const removed = multiAccountStorage.removeAccount(accountId);
                if (!removed) {
                    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
                }
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Account management error:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
