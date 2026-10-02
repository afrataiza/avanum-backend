import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

export { corsHeaders };

export function handleCors(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;

  return new Response("ok", {
    status: 200,
    headers: corsHeaders,
  });
}

export function jsonHeaders(): HeadersInit {
  return {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
}
