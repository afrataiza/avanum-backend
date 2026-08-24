import { createClient } from "jsr:@supabase/supabase-js@2";
import { AddToLibraryService } from "../_shared/library/add-to-library-service.ts";
import type { BookInput } from "../_shared/library/types.ts";

interface AddToLibraryRequest {
  book: BookInput;
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

    // Client usado apenas para validar o usuário autenticado.
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

    // Client administrativo usado apenas no backend.
    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const body = await req.json() as AddToLibraryRequest;

    if (!body.book?.externalId || !body.book?.title) {
      return response(
        {
          error: "Book externalId and title are required",
        },
        400,
      );
    }

    const service = new AddToLibraryService(adminSupabase);

    const result = await service.execute(
      user.id,
      body.book,
    );

    return response(
      {
        id: result.userBook.id,
        status: result.userBook.status,
        book: result.book,
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    console.error(error);

    return response(
      { error: "Internal server error" },
      500,
    );
  }
});