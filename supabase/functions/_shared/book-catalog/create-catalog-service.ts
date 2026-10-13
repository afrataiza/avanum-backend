import { createClient } from "jsr:@supabase/supabase-js@2";
import { BookCatalogService } from "./book-catalog-service.ts";
import { SupabaseCatalogRepository } from "./supabase-catalog-repository.ts";

export function createCatalogService(): BookCatalogService {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // Prefer the explicit server-only variable; keep SERVICE_ROLE_KEY as a
  // compatibility fallback for existing local setups.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Catalog persistence is not configured");
  }

  if (serviceRoleKey.startsWith("sb_publishable_")) {
    throw new Error(
      "Catalog persistence requires a server-side Supabase secret key",
    );
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  return new BookCatalogService(
    undefined,
    new SupabaseCatalogRepository(adminSupabase),
  );
}
