import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database.types";

const protectedPrefixes = [
  "/admin",
  "/crm",
  "/finance",
  "/inventory",
  "/hr",
  "/operations",
];

function isProtectedRoute(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnvironment();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const requiresAuthentication = pathname === "/" || isProtectedRoute(pathname);

  if (!user && requiresAuthentication) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();

    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";

    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}
