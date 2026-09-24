import {
  BriefcaseBusiness,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  House,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";

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
];

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <aside className="flex min-h-screen w-full max-w-72 flex-col bg-slate-950 px-5 py-6 text-slate-300">
      <Link className="flex items-center gap-3 px-3" href="/">
        <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
          <Settings aria-hidden="true" className="size-5" />
        </span>
        <span>
          <span className="block text-base font-bold tracking-tight text-white">Kalisto ERP</span>
          <span className="block text-xs text-slate-500">Workspace empresarial</span>
        </span>
      </Link>

      <nav aria-label="Navegación principal" className="mt-10 flex-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Módulos</p>
        <ul className="mt-4 space-y-1">
          {navigationItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-white/10 hover:text-white"
                href={href}
              >
                <Icon aria-hidden="true" className="size-5 text-slate-500 transition group-hover:text-cyan-300" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 pt-5">
        <p className="truncate px-3 text-sm text-slate-400" title={user.email ?? undefined}>
          {user.email ?? "Usuario autenticado"}
        </p>
        <form action={logout} className="mt-3">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200"
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
