import { createClient } from "jsr:@supabase/supabase-js@2";
import { ExpeditionService } from "../_shared/expeditions/service.ts";

const jsonHeaders = { "Content-Type": "application/json" };
function response(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: jsonHeaders }); }

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
    const authorization = req.headers.get("Authorization");
    if (!authorization) return response({ error: "Authentication required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return response({ error: "Invalid authentication" }, 401);

    const body = await req.json();
    const service = new ExpeditionService(createClient(url, serviceRoleKey));
    const expedition = await service.create(user.id, body);
    return response({ expedition }, 201);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return response({ error: message }, 400);
  }
});
