import { BookCatalogService } from "../_shared/book-catalog/book-catalog-service.ts";

Deno.serve(async (req) => {
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
            "Content-Type": "application/json",
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
        headers: {
          "Content-Type": "application/json",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});