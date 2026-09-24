import { MarketingWorkspace } from "@/components/marketing/marketing-workspace";
import { canAccessDepartment, requireUser } from "@/lib/auth/authorization";

export default async function MarketingPage() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "marketing")) throw new Error("Sin acceso a marketing.");
  const [{ data: campaigns, error: campaignsError }, { data: performance, error: performanceError }] = await Promise.all([
    supabase.from("mkt_campaigns").select("id, name, budget, platform, status").order("created_at", { ascending: false }),
    supabase.from("mkt_performance").select("id, campaign_id, leads_count, conversions_count, spend, measured_at").order("measured_at", { ascending: false }),
  ]);
  if (campaignsError || performanceError) throw new Error("No se pudieron cargar las campañas.");
  return <section className="mx-auto max-w-7xl"><header className="mb-8 border-b border-slate-200 pb-8"><p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Marketing</p><h1 className="mt-3 text-4xl font-semibold text-slate-950">Campañas y rendimiento</h1><p className="mt-3 text-slate-500">Mide campañas y conecta su rendimiento con los leads del CRM.</p></header><MarketingWorkspace campaigns={campaigns} performance={performance} /></section>;
}
