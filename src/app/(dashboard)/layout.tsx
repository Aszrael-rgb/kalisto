import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
