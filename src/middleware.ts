import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/lib/types/database.types";

const modulePrefixes = [
  "/crm",
  "/inventory",
  "/finance",
  "/hr",
  "/operations",
  "/ops",
  "/admin",
];

function isProtectedRoute(pathname: string): boolean {
  return pathname === "/" || modulePrefixes.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
}

function copyCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function middleware(request: NextRequest) {
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

  if (!user) {
    if (!isProtectedRoute(pathname)) {
      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isLoginRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";

    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "empleado";
  const departmentPath = profile?.department ? `/${profile.department}` : null;
  const isModuleRoute = modulePrefixes.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));

  const redirectToDashboard = () => {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  };

  if (role === "manager" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return redirectToDashboard();
  }

  if (
    role === "empleado"
    && isModuleRoute
    && pathname !== "/"
    && (!departmentPath || (
      pathname !== departmentPath && !pathname.startsWith(`${departmentPath}/`)
    ))
  ) {
    return redirectToDashboard();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
