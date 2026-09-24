import { getLeaves, getTodayAttendance } from "@/actions/hr";
import { HrWorkspace } from "@/components/hr/hr-workspace";
import { canManageApprovals, requireUser } from "@/lib/auth/authorization";

export default async function HrPage() {
  const [{ profile }, attendance, leaves] = await Promise.all([requireUser(), getTodayAttendance(), getLeaves()]);
  return <section className="mx-auto max-w-7xl"><header className="mb-8 border-b border-slate-200 pb-8"><p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Recursos Humanos</p><h1 className="mt-3 text-4xl font-semibold text-slate-950">Personas y asistencia</h1><p className="mt-3 text-slate-500">Registra tu jornada y gestiona solicitudes de ausencia.</p></header><HrWorkspace attendance={attendance} leaves={leaves} canApprove={canManageApprovals(profile)} /></section>;
}
