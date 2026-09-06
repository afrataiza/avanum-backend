import { createClient } from "jsr:@supabase/supabase-js@2";

import { ReadingDetailsService } from "../_shared/reading/reading-details-service.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
};

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") {
      return response({ error: "Method not allowed" }, 405);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({ error: "Authentication required" }, 401);
    }

    const url = new URL(req.url);
    const readingId = url.searchParams.get("readingId")?.trim();

    if (!readingId) {
      return response({ error: "readingId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;

    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();

    if (authError || !user) {
      return response({ error: "Invalid authentication" }, 401);
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const service = new ReadingDetailsService(adminSupabase);
    const result = await service.execute(user.id, readingId);

    return response(result, 200);
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    if (message === "Reading not found") {
      return response({ error: message }, 404);
    }

    return response({ error: "Internal server error" }, 500);
  }
});
