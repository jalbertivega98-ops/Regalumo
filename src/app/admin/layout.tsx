import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { config } from "@/lib/config";
import { Logo } from "@/components/Logo";
import { AdminLogin, AdminLogout } from "@/components/admin/AdminForms";
import { paymentsMode } from "@/lib/payments/orders";
import { storageDriver } from "@/lib/store";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Resumen"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/clientes", "Clientes"],
  ["/admin/productos", "Productos y precios"],
  ["/admin/promociones", "Promociones"],
  ["/admin/pruebas", "Pruebas gratuitas"],
  ["/admin/errores", "Errores"],
  ["/admin/solicitudes", "Solicitudes"],
  ["/admin/correos", "Correos"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!config.adminPassword) {
    return <p className="p-10">El panel está desactivado: define la variable ADMIN_PASSWORD para activarlo.</p>;
  }
  if (!(await isAdmin())) return <AdminLogin />;
  const mode = paymentsMode();
  return (
    <div className="min-h-screen bg-shell">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/"><Logo /></Link>
          <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Panel</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${mode === "stripe-live" ? "bg-coral text-white" : "bg-sun"}`}>
            Pagos: {mode === "stripe-test" ? "Stripe (modo prueba)" : mode === "stripe-live" ? "Stripe REAL" : mode === "mock" ? "simulados (desarrollo)" : "sin configurar"}
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold ring-1 ring-line">Datos: {storageDriver() === "supabase" ? "Supabase" : "disco local"}</span>
          <div className="ml-auto"><AdminLogout /></div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-semibold">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-shell">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
