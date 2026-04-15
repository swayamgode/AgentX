import { promises as fs } from 'fs';
import path from 'path';

const ANALYTICS_FILE = path.join(process.cwd(), '.upload-analytics.json');

export interface UploadRecord {
  id: string;
  timestamp: string;
  accountId: string;
  channelName: string;
  topic: string;
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  error?: string;
  errorType?: 'QUOTA_EXCEEDED' | 'AUTH_EXPIRED' | 'RENDER_FAILED' | 'UNKNOWN';
  groupId?: string;
  groupName?: string;
}

export interface UploadAnalytics {
  uploads: UploadRecord[];
  lastUpdated: string;
}

async function readAnalytics(): Promise<UploadAnalytics> {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { uploads: [], lastUpdated: new Date().toISOString() };
  }
}

async function writeAnalytics(data: UploadAnalytics): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  // Keep only last 2000 records to avoid files growing indefinitely
  if (data.uploads.length > 2000) {
    data.uploads = data.uploads.slice(-2000);
  }
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function trackUpload(record: Omit<UploadRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const data = await readAnalytics();
    const newRecord: UploadRecord = {
      ...record,
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
    };
    data.uploads.push(newRecord);
    await writeAnalytics(data);
  } catch (err) {
    // Never crash the upload pipeline due to analytics errors
    console.error('[upload-analytics] Failed to track upload:', err);
  }
}

export async function getAnalytics(): Promise<UploadAnalytics> {
  return readAnalytics();
}

export interface AnalyticsSummary {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byChannel: { channelName: string; total: number; success: number; failed: number; rate: number }[];
  byErrorType: { type: string; count: number }[];
  recentUploads: UploadRecord[];
  last24h: { total: number; success: number; failed: number };
  last7d: { total: number; success: number; failed: number };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const data = await readAnalytics();
  const uploads = data.uploads;

  const total = uploads.length;
  const success = uploads.filter(u => u.success).length;
  const failed = total - success;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  // By channel
  const channelMap = new Map<string, { total: number; success: number; failed: number }>();
  for (const u of uploads) {
    const key = u.channelName || u.accountId;
    const existing = channelMap.get(key) || { total: 0, success: 0, failed: 0 };
    existing.total++;
    if (u.success) existing.success++; else existing.failed++;
    channelMap.set(key, existing);
  }
  const byChannel = Array.from(channelMap.entries())
    .map(([channelName, stats]) => ({ channelName, ...stats, rate: Math.round((stats.success / stats.total) * 100) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // By error type
  const errorMap = new Map<string, number>();
  for (const u of uploads.filter(u => !u.success)) {
    const key = u.errorType || 'UNKNOWN';
    errorMap.set(key, (errorMap.get(key) || 0) + 1);
  }
  const byErrorType = Array.from(errorMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

  // Time windows
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last24h = uploads.filter(u => now - new Date(u.timestamp).getTime() < day);
  const last7d = uploads.filter(u => now - new Date(u.timestamp).getTime() < 7 * day);

  const calcWindow = (arr: UploadRecord[]) => ({
    total: arr.length,
    success: arr.filter(u => u.success).length,
    failed: arr.filter(u => !u.success).length,
  });

  return {
    total,
    success,
    failed,
    successRate,
    byChannel,
    byErrorType,
    recentUploads: uploads.slice(-50).reverse(),
    last24h: calcWindow(last24h),
    last7d: calcWindow(last7d),
  };
}
