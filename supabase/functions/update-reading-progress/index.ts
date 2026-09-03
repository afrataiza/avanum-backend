import { createClient } from "jsr:@supabase/supabase-js@2";

import { UpdateReadingProgressService } from "../_shared/reading/update-reading-progress-service.ts";
import type { UpdateReadingProgressInput } from "../_shared/reading/types.ts";

interface UpdateReadingProgressRequest {
  readingId: string;
  currentUnits: number;
}

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
    if (req.method !== "POST") {
      return response(
        { error: "Method not allowed" },
        405,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response(
        { error: "Authentication required" },
        401,
      );
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
      return response(
        { error: "Invalid authentication" },
        401,
      );
    }

    const body =
      await req.json() as UpdateReadingProgressRequest;

    if (
      !body.readingId ||
      body.currentUnits === undefined
    ) {
      return response(
        {
          error: "readingId and currentUnits are required",
        },
        400,
      );
    }

    if (
      !Number.isInteger(body.currentUnits) ||
      body.currentUnits < 0
    ) {
      return response(
        { error: "currentUnits must be a non-negative integer" },
        400,
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const service = new UpdateReadingProgressService(
      adminSupabase,
    );

    const input: UpdateReadingProgressInput = {
      readingId: body.readingId,
      currentUnits: body.currentUnits,
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
      message === "Reading cannot be updated with its current status" ||
      message === "Reading progress cannot decrease"
    ) {
      return response({ error: message }, 409);
    }

    if (message === "Current progress cannot exceed total units") {
      return response({ error: message }, 400);
    }

    return response(
      { error: "Internal server error" },
      500,
    );
  }
});
