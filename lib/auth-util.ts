import { getAuthUserId } from "@convex-dev/auth/nextjs/server";

export async function getAuthUser() {
    try {
        const userId = await getAuthUserId();
        if (userId) return { id: userId };
    } catch (e) {
        console.warn("Auth check failed, using dev-id", e);
    }
    
    // Fallback for development/testing
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
