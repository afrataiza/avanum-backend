import { BookCatalogProviderError } from "../_shared/book-catalog/errors.ts";
import { handleCors, jsonHeaders } from "../_shared/http/cors.ts";
import { BookCatalogService } from "../_shared/book-catalog/book-catalog-service.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim();

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Book id is required",
        }),
        {
          status: 400,
          headers: {
            ...jsonHeaders(),
          },
        },
      );
    }

    const service = new BookCatalogService();
    const book = await service.getById(id);

    if (!book) {
      return new Response(
        JSON.stringify({
          error: "Book not found",
        }),
        {
          status: 404,
          headers: jsonHeaders(),
        },
      );
    }

    return new Response(JSON.stringify(book), {
      status: 200,
      headers: jsonHeaders(),
    });
  } catch (error) {
    console.error(error);

    if (error instanceof BookCatalogProviderError) {
      return new Response(
        JSON.stringify({
          error: "Book catalog provider unavailable",
        }),
        {
          status: 503,
          headers: jsonHeaders(),
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to get book",
      }),
      {
        status: 500,
        headers: jsonHeaders(),
      },
    );
  }
});