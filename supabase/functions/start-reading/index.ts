import { createClient } from "jsr:@supabase/supabase-js@2";

import { StartReadingService } from "../_shared/reading/start-reading-service.ts";
import type { StartReadingInput } from "../_shared/reading/types.ts";

interface StartReadingRequest {
  userBookId: string;
  format: StartReadingInput["format"];
  totalUnits: number;
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
      await req.json() as StartReadingRequest;

    if (
      !body.userBookId ||
      !body.format ||
      body.totalUnits === undefined
    ) {
      return response(
        {
          error:
            "userBookId, format and totalUnits are required",
        },
        400,
      );
    }

    if (
      !["physical", "ebook", "audiobook"].includes(body.format)
    ) {
      return response(
        { error: "Invalid reading format" },
        400,
      );
    }

    if (
      !Number.isInteger(body.totalUnits) ||
      body.totalUnits <= 0
    ) {
      return response(
        { error: "totalUnits must be a positive integer" },
        400,
      );
    }

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const service = new StartReadingService(
      adminSupabase,
    );

    const result = await service.execute(
      user.id,
      {
        userBookId: body.userBookId,
        format: body.format,
        totalUnits: body.totalUnits,
      },
    );

    return response(
      result,
      201,
    );
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    if (message === "User book not found") {
      return response(
        { error: message },
        404,
      );
    }

    if (
      message ===
      "Book cannot be started with its current status"
    ) {
      return response(
        { error: message },
        409,
      );
    }

    if (
      message ===
      "User book already has an active reading"
    ) {
      return response(
        { error: message },
        409,
      );
    }

    return response(
      { error: "Internal server error" },
      500,
    );
  }
});