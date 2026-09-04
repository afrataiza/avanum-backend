import { createClient } from "jsr:@supabase/supabase-js@2";

import { UpdateReadingStatusService } from "../_shared/reading/update-reading-status-service.ts";
import type { UpdateReadingStatusInput } from "../_shared/reading/types.ts";

interface UpdateReadingStatusRequest {
  readingId: string;
  status: "reading" | "paused" | "abandoned";
}

const allowedStatuses = ["reading", "paused", "abandoned"] as const;

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
    if (req.method !== "PUT") {
      return response({ error: "Method not allowed" }, 405);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response({ error: "Authentication required" }, 401);
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

    const body = await req.json() as UpdateReadingStatusRequest;

    if (!body.readingId || !body.status) {
      return response(
        { error: "readingId and status are required" },
        400,
      );
    }

    if (!allowedStatuses.includes(body.status)) {
      return response({ error: "Invalid reading status" }, 400);
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const service = new UpdateReadingStatusService(adminSupabase);

    const input: UpdateReadingStatusInput = {
      readingId: body.readingId,
      status: body.status,
    };

    const result = await service.execute(user.id, input);

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

    if (
      message === "Completed reading cannot change status" ||
      message === "Abandoned reading cannot change status" ||
      message === "Reading is already active" ||
      message === "Reading is already paused"
    ) {
      return response({ error: message }, 409);
    }

    return response({ error: "Internal server error" }, 500);
  }
});
