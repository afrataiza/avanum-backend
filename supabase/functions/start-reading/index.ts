import { handleCors, jsonHeaders } from "../_shared/http/cors.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { StartReadingService } from "../_shared/reading/start-reading-service.ts";
import { ReadingEventDispatcher } from "../_shared/reading/events/dispatcher.ts";
import { ExpeditionReadingEventHandler } from "../_shared/expeditions/reading-event-handler.ts";
import { ExpeditionQueryService } from "../_shared/expeditions/query-service.ts";
import { ExpeditionService } from "../_shared/expeditions/service.ts";
import { MapQueryService } from "../_shared/map/query-service.ts";
import { MapService } from "../_shared/map/service.ts";
import { MapReadingEventHandler } from "../_shared/map/reading-event-handler.ts";
import type { StartReadingInput } from "../_shared/reading/types.ts";

interface StartReadingRequest {
  userBookId: string;
  format: StartReadingInput["format"];
  totalUnits: number;
}

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

    const expeditionQuery = new ExpeditionQueryService(adminSupabase);
    const expeditionService = new ExpeditionService(adminSupabase);
    const mapQuery = new MapQueryService(adminSupabase);
    const mapService = new MapService(adminSupabase);

    const dispatcher = new ReadingEventDispatcher();

    dispatcher.register(
      new ExpeditionReadingEventHandler({
        query: expeditionQuery,
        progress: expeditionService,
      }),
    );

    dispatcher.register(
      new MapReadingEventHandler({
        query: mapQuery,
        progress: {
          applyProgress: (input) => mapService.applyProgress(input),
        },
      }),
    );

    await dispatcher.dispatch(result.events);

    return response(
      { reading: result.reading },
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