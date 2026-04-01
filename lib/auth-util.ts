import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Get the current user session in an API route
 */
export async function getAuthUser() {
  const cookieStore = await cookies();

  // AUTH BYPASS: Always return dev user to avoid Supabase dependency
  return { email: 'dev@agentx.ai', id: 'dev-id-001' };

  /* Supabase Auth logic disabled
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle middleware or server component set errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle middleware or server component set errors
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  return session.user;
  */
}

/**
 * Helper to wrap API handlers with authentication
 */
export function withAuth(handler: (user: any, req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(user, req);
  };
}
