import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { ThemePicker } from "@/components/theme/theme-picker";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 p-8">
        <div className="mb-6 flex justify-end">
          <ThemePicker />
        </div>
        {children}
      </main>
    </div>
  );
}
