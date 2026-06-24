"use client";

import { useState } from "react";
import { SidebarNav } from "./SidebarClient";

export function MobileMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="text-center">
          <span className="text-sm font-bold text-zinc-900">LabControl</span>
          <span className="text-xs text-zinc-500 ml-1">{isAdmin ? "Admin" : "Estudiante"}</span>
        </div>
        <div className="w-10" />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 flex flex-col z-50 shadow-xl animate-slide-in">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">LabControl</h2>
                <p className="text-xs text-zinc-500">{isAdmin ? "Administrador" : "Estudiante"}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                aria-label="Cerrar menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav />
            <div className="p-3 border-t border-zinc-200">
              <form action="/dashboard" method="get">
                <button
                  type="submit"
                  formAction="/api/auth/logout"
                  className="w-full rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors text-left"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
