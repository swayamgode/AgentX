import { NextResponse } from 'next/server';

export async function getAuthUser() {
    return { id: "dev-id-001" };
}

export function withAuth(handler: (user: any, req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const user = await getAuthUser();
    return handler(user, req);
  };
}

export function requireAuth(handler: Function) {
    return async function (request: any, ...args: any[]) {
        return handler(request, ...args);
    };
}
