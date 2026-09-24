"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/actions/auth";

const initialLoginState: LoginState = {
  error: null,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    login,
    initialLoginState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between bg-cyan-400 p-10 text-slate-950 lg:flex">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em]">Kalisto ERP</p>
            <h1 className="mt-20 max-w-md text-5xl font-semibold leading-[1.05] tracking-tight">
              Toda tu operación, en una sola vista.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-800">
            Gestiona clientes, finanzas, inventario y equipos desde un espacio de trabajo conectado.
          </p>
        </section>

        <section className="p-8 sm:p-12">
          <div className="mb-10">
            <p className="text-sm font-medium text-cyan-300">Acceso seguro</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h2>
            <p className="mt-3 text-sm text-slate-400">
              Introduce tus credenciales para entrar al panel.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                id="email"
                name="email"
                placeholder="nombre@empresa.com"
                required
                type="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                Contraseña
              </label>
              <input
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                id="password"
                name="password"
                placeholder="Tu contraseña"
                required
                type="password"
              />
            </div>

            {state.error ? (
              <p
                aria-live="polite"
                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            <button
              className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Comprobando credenciales..." : "Iniciar sesión"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
