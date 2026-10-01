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

    const { data: balance, error: balanceError } = await adminClient
      .from("user_xp")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balanceError) {
      console.error(balanceError);
      return response({ error: "Failed to get XP balance" }, 500);
    }

    const { data: transactions, error: transactionsError } = await adminClient
      .from("xp_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error(transactionsError);
      return response({ error: "Failed to get XP transactions" }, 500);
    }

    return response({
      balance: balance ?? {
        user_id: user.id,
        total_xp: 0,
      },
      transactions: transactions ?? [],
    }, 200);
  } catch (error) {
    console.error(error);
    return response({ error: "Internal server error" }, 500);
  }
});
