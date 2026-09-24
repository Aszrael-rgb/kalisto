import { getCategories, getProducts } from "@/actions/inventory";
import { InventoryWorkspace } from "@/components/inventory/inventory-workspace";

export default async function InventoryPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">Inventario</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Productos y existencias</h1>
        <p className="mt-3 text-slate-500">Controla el catálogo y registra cada movimiento de stock.</p>
      </header>
      <InventoryWorkspace products={products} categories={categories} />
    </section>
  );
}
