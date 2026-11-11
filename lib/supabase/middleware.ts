import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPath = request.nextUrl.pathname === '/login';

  // Halaman publik dan API guest tidak memerlukan cek sesi Supabase Auth
  if (!isAdminPath && !isLoginPath) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (isAdminPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'env_not_configured');
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminPath) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminRecord) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isLoginPath && user) {
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (adminRecord) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = '/admin';
      adminUrl.search = '';
      return NextResponse.redirect(adminUrl);
    }
  }

  return response;
}

