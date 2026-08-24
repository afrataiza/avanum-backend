import { BookCatalogProviderError } from "../_shared/book-catalog/errors.ts";
import { BookCatalogService } from "../_shared/book-catalog/book-catalog-service.ts";

Deno.serve(async (req) => {
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
            "Content-Type": "application/json",
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
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify(book), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
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
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to get book",
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