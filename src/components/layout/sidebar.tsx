import {
  BriefcaseBusiness,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  House,
  LogOut,
  Settings,
  ShieldCheck,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/database.types";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/finance", label: "Finanzas", icon: CircleDollarSign },
  { href: "/hr", label: "Recursos Humanos", icon: BriefcaseBusiness },
  { href: "/operations", label: "Operaciones", icon: ChartNoAxesCombined },
  { href: "/admin", label: "Administración", icon: ShieldCheck },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
];

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, department")
    .eq("id", user.id)
    .maybeSingle();

  const role: AppRole = profile?.role ?? "empleado";
  const visibleNavigationItems = navigationItems.filter(({ href }) => {
    if (href === "/") {
      return true;
    }

    if (role === "administrador") {
      return true;
    }

    if (role === "manager") {
      return href !== "/admin";
    }

    return profile?.department !== null && href === `/${profile?.department}`;
  });

  return (
    <aside className="theme-sidebar flex min-h-screen w-full max-w-72 flex-col px-5 py-6">
      <Link className="flex items-center gap-3 px-3" href="/">
        <span className="theme-mark flex size-10 items-center justify-center rounded-xl">
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <span>
          <span className="block text-base font-bold tracking-tight text-[var(--theme-sidebar-ink)]">Kalisto ERP</span>
          <span className="block text-xs text-[var(--theme-sidebar-muted)]">Workspace empresarial</span>
        </span>
      </Link>

      <nav aria-label="Navegación principal" className="mt-10 flex-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--theme-sidebar-muted)]">Módulos</p>
        <ul className="mt-4 space-y-1">
          {visibleNavigationItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                className="theme-nav-link group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition"
                href={href}
              >
                <Icon aria-hidden="true" className="theme-nav-icon size-5 transition" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="theme-sidebar-footer border-t pt-5">
        <p className="truncate px-3 text-sm" title={user.email ?? undefined}>
          {user.email ?? "Usuario autenticado"}
        </p>
        <form action={logout} className="mt-3">
          <button
            className="theme-logout flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition"
            type="submit"
          >
            <LogOut aria-hidden="true" className="size-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
