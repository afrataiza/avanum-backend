import { createClient } from "jsr:@supabase/supabase-js@2";
import { ExpeditionQueryService } from "../_shared/expeditions/query-service.ts";

const jsonHeaders = { "Content-Type": "application/json" };

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") return response({ error: "Method not allowed" }, 405);

    const authorization = req.headers.get("Authorization");
    if (!authorization) return response({ error: "Authentication required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) return response({ error: "Invalid authentication" }, 401);

    const adminClient = createClient(url, serviceRoleKey);
    const service = new ExpeditionQueryService(adminClient);
    const userExpeditions = await service.listUserExpeditions(user.id);
    return response({ expeditions: userExpeditions }, 200);
  } catch (error) {
    console.error(error);
    return response({ error: "Internal server error" }, 500);
  }
});
