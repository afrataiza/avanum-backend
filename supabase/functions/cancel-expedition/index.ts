import { handleCors, jsonHeaders } from "../_shared/http/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { ExpeditionService } from "../_shared/expeditions/service.ts";

function response(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: jsonHeaders() }); }

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "PUT") return response({ error: "Method not allowed" }, 405);
    const authorization = req.headers.get("Authorization");
    if (!authorization) return response({ error: "Authentication required" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return response({ error: "Invalid authentication" }, 401);

    const { userExpeditionId } = await req.json();
    const service = new ExpeditionService(createClient(url, serviceRoleKey));
    const expedition = await service.cancel(user.id, userExpeditionId);
    return response({ expedition }, 200);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return response({ error: message }, 400);
  }
});
