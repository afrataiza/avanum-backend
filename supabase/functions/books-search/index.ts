import { GoogleBooksClient } from "./google-books-client.ts";
import { mapGoogleBook } from "./google-books-mapper.ts";

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

    const client = new GoogleBooksClient();
    const response = await client.search(query);

    const items = (response.items ?? []).map(mapGoogleBook);

    return new Response(
      JSON.stringify({
        items,
        total: response.totalItems,
      }),
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