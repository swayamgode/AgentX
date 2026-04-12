import { NextRequest, NextResponse } from 'next/server';
import { multiAccountStorage } from '@/lib/token-storage';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        const accounts = await multiAccountStorage.getAllAccounts(userId);
        const activeAccount = await multiAccountStorage.getActiveAccount(userId);

        return NextResponse.json({
            accounts: accounts.map((acc: any) => ({
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
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        const body = await request.json();
        const { action, accountId, updates } = body;

        switch (action) {
            case 'setActive':
                if (!accountId) {
                    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
                }
                await multiAccountStorage.setActiveAccount(userId, accountId);
                return NextResponse.json({ success: true });

            case 'updateWatermark':
                if (!accountId || !updates?.watermark) {
                    return NextResponse.json({ error: 'Account ID and watermark required' }, { status: 400 });
                }
                await multiAccountStorage.updateAccount(userId, accountId, { watermark: updates.watermark });
                return NextResponse.json({ success: true });

            case 'remove':
                if (!accountId) {
                    return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
                }
                await multiAccountStorage.removeAccount(userId, accountId);
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Account management error:', error);
        return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }
}
