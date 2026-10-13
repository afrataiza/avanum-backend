import { createClient } from "jsr:@supabase/supabase-js@2";
import { BookCatalogService } from "./book-catalog-service.ts";
import { SupabaseCatalogRepository } from "./supabase-catalog-repository.ts";

export function createCatalogService(): BookCatalogService {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Catalog persistence is not configured");
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  return new BookCatalogService(
    undefined,
    new SupabaseCatalogRepository(adminSupabase),
  );
}
