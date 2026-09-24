"use client";

import { useState } from "react";

import { updateUserAccess, type UserProfile } from "@/actions/users";
import type { AppRole, Department } from "@/lib/types/database.types";

const roleLabels: Record<AppRole, string> = {
  administrador: "Administrador",
  manager: "Manager",
  empleado: "Empleado",
};

const departmentLabels: Record<Department, string> = {
  crm: "CRM",
  inventory: "Inventario",
  finance: "Finanzas",
  hr: "Recursos Humanos",
  operations: "Operaciones",
};

type AccessValues = Pick<UserProfile, "role" | "department">;
type RowStatus = "idle" | "saving" | "success" | "error";

type UserAccessTableProps = {
  users: UserProfile[];
};

export function UserAccessTable({ users }: UserAccessTableProps) {
  const [values, setValues] = useState<Record<string, AccessValues>>(
    Object.fromEntries(
      users.map((user) => [
        user.id,
        { role: user.role, department: user.department },
      ]),
    ),
  );
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function saveAccess(userId: string, nextValues: AccessValues) {
    const previousValues = values[userId];

    setValues((current) => ({ ...current, [userId]: nextValues }));
    setPendingUserId(userId);
    setStatuses((current) => ({ ...current, [userId]: "saving" }));
    setErrors((current) => ({ ...current, [userId]: "" }));

    const result = await updateUserAccess(
      userId,
      nextValues.role,
      nextValues.department,
    );

    setPendingUserId(null);

    if (!result.success) {
      setValues((current) => ({ ...current, [userId]: previousValues }));
      setStatuses((current) => ({ ...current, [userId]: "error" }));
      setErrors((current) => ({ ...current, [userId]: result.error }));
      return;
    }

    setStatuses((current) => ({ ...current, [userId]: "success" }));
  }

  function handleRoleChange(userId: string, role: AppRole) {
    const currentValues = values[userId];

    if (currentValues) {
      void saveAccess(userId, { ...currentValues, role });
    }
  }

  function handleDepartmentChange(userId: string, department: string) {
    const currentValues = values[userId];

    if (currentValues) {
      void saveAccess(userId, {
        ...currentValues,
        department: department === "" ? null : (department as Department),
      });
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Nombre</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Rol actual</th>
              <th className="px-6 py-4 font-semibold">Departamento actual</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const currentValues = values[user.id];
              const status = statuses[user.id] ?? "idle";
              const isSaving = pendingUserId === user.id;

              return (
                <tr className="align-middle" key={user.id}>
                  <td className="px-6 py-5 font-medium text-slate-900">
                    {user.full_name ?? "Sin nombre"}
                  </td>
                  <td className="px-6 py-5 text-slate-500">{user.email ?? "Sin email"}</td>
                  <td className="px-6 py-5">
                    <select
                      aria-label={`Rol de ${user.email ?? user.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                      disabled={isSaving}
                      onChange={(event) => handleRoleChange(user.id, event.target.value as AppRole)}
                      value={currentValues?.role ?? user.role}
                    >
                      {Object.entries(roleLabels).map(([role, label]) => (
                        <option key={role} value={role}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-5">
                    <select
                      aria-label={`Departamento de ${user.email ?? user.id}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                      disabled={isSaving}
                      onChange={(event) => handleDepartmentChange(user.id, event.target.value)}
                      value={currentValues?.department ?? ""}
                    >
                      <option value="">Sin departamento</option>
                      {Object.entries(departmentLabels).map(([department, label]) => (
                        <option key={department} value={department}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-5 text-xs">
                    {status === "saving" ? <span className="text-slate-500">Guardando...</span> : null}
                    {status === "success" ? <span className="text-emerald-600">Guardado</span> : null}
                    {status === "error" ? <span className="text-rose-600">{errors[user.id]}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}