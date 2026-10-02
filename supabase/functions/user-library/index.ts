import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleCors, jsonHeaders } from "../_shared/http/cors.ts";

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(),
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "GET") {
      return response({ error: "Method not allowed" }, 405);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return response({ error: "Authentication required" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return response({ error: "Invalid authentication" }, 401);
    }

    const adminClient = createClient(url, serviceRoleKey);
    const { data: userBooks, error: userBooksError } = await adminClient
      .from("user_books")
      .select("id, status, created_at, updated_at, book:books(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userBooksError) {
      console.error(userBooksError);
      return response({ error: "Failed to list library" }, 500);
    }

    const items = userBooks ?? [];
    const userBookIds = items.map((item) => item.id);

    if (userBookIds.length === 0) {
      return response({ items: [] }, 200);
    }

    const { data: readings, error: readingsError } = await adminClient
      .from("readings")
      .select(
        "id, user_book_id, format, total_units, current_units, status, started_at, paused_at, completed_at, created_at, updated_at",
      )
      .in("user_book_id", userBookIds)
      .in("status", ["reading", "paused"])
      .order("updated_at", { ascending: false });

    if (readingsError) {
      console.error(readingsError);
      return response({ error: "Failed to list library readings" }, 500);
    }

    const activeReadingByUserBookId = new Map<string, (typeof readings)[number]>();

    for (const reading of readings ?? []) {
      if (!activeReadingByUserBookId.has(reading.user_book_id)) {
        activeReadingByUserBookId.set(reading.user_book_id, reading);
      }
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      reading: activeReadingByUserBookId.get(item.id) ?? null,
    }));

    return response({ items: enrichedItems }, 200);
  } catch (error) {
    console.error(error);
    return response({ error: "Internal server error" }, 500);
  }
});
