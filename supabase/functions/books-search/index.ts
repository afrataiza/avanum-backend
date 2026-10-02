import { BookCatalogService } from "../_shared/book-catalog/book-catalog-service.ts";
import { handleCors, jsonHeaders } from "../_shared/http/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();

    if (!query) {
      return new Response(
        JSON.stringify({
          error: "Query parameter 'q' is required",
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
    const result = await service.search(query);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: jsonHeaders(),
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: "Failed to search books",
      }),
      {
        status: 500,
        headers: jsonHeaders(),
      },
    );
  }
});