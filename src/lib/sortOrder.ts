// Hair Rich · sort_order persistence helper
// Used by /admin/servizi · /admin/prodotti · /admin/staff after a drag&drop
// reorder. Writes a new sort_order value to each affected row.

import { createClient } from "@/lib/supabase/client";

/**
 * Persist a new ordering. Writes `sort_order = i * 10` to each row in the
 * provided id sequence. Spacing by 10 makes future single-row inserts
 * possible without renumbering. Fire-and-forget — caller is responsible
 * for optimistic UI update before calling and for surfacing errors.
 */
export async function persistSortOrder(
    table: "services" | "products" | "staff",
    ids: string[]
): Promise<void> {
    const supabase = createClient();
    await Promise.all(
        ids.map((id, i) =>
            supabase.from(table).update({ sort_order: i * 10 }).eq("id", id)
        )
    );
}
