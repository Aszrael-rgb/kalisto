"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canAccessDepartment, requireUser } from "@/lib/auth/authorization";
import type { MovementType } from "@/lib/types/database.types";

const productSchema = z.object({
  sku: z.string().trim().min(1), name: z.string().trim().min(1), description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(), price: z.coerce.number().min(0), cost: z.coerce.number().min(0), minStockAlert: z.coerce.number().int().min(0),
});

export async function getProducts() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "inventory")) throw new Error("Sin acceso al inventario.");
  const { data, error } = await supabase.from("inventory_products").select("*").order("name");
  if (error) throw new Error("No se pudieron cargar los productos."); return data;
}

export async function getCategories() {
  const { supabase, profile } = await requireUser();
  if (!canAccessDepartment(profile, "inventory")) throw new Error("Sin acceso al inventario.");
  const { data, error } = await supabase.from("inventory_categories").select("*").order("name");
  if (error) throw new Error("No se pudieron cargar las categorías."); return data;
}

export async function createProduct(input: { sku: string; name: string; description?: string; categoryId?: string | null; price: number; cost: number; minStockAlert: number }) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Datos del producto inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "inventory")) return { success: false, error: "Sin acceso al inventario." };
    const { error } = await supabase.from("inventory_products").insert({ sku: parsed.data.sku, name: parsed.data.name, description: parsed.data.description || null, category_id: parsed.data.categoryId ?? null, price: parsed.data.price, cost: parsed.data.cost, min_stock_alert: parsed.data.minStockAlert });
    if (error) return { success: false, error: "No se pudo crear el producto." };
    revalidatePath("/inventory"); return { success: true };
  } catch { return { success: false, error: "No se pudo crear el producto." }; }
}

export async function updateStock(productId: string, quantity: number, type: MovementType, reason?: string) {
  const parsed = z.object({ productId: z.string().uuid(), quantity: z.number().int().positive(), type: z.enum(["entrada", "salida", "ajuste"]), reason: z.string().max(500).optional() }).safeParse({ productId, quantity, type, reason });
  if (!parsed.success) return { success: false, error: "Datos de movimiento inválidos." };
  try {
    const { supabase, profile } = await requireUser();
    if (!canAccessDepartment(profile, "inventory")) return { success: false, error: "Sin acceso al inventario." };
    const { error } = await supabase.rpc("adjust_inventory_stock", { p_product_id: parsed.data.productId, p_quantity: parsed.data.quantity, p_type: parsed.data.type, p_reason: parsed.data.reason || null });
    if (error) return { success: false, error: error.message };
    revalidatePath("/inventory"); return { success: true };
  } catch { return { success: false, error: "No se pudo actualizar el stock." }; }
}
