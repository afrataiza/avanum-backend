import type { GoogleBooksSearchResponse } from "./types.ts";

const GOOGLE_BOOKS_BASE_URL =
  "https://www.googleapis.com/books/v1";

export class GoogleBooksClient {
  async search(query: string): Promise<GoogleBooksSearchResponse> {
    const apiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY");

    if (!apiKey) {
      throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
    }

    const url = new URL(`${GOOGLE_BOOKS_BASE_URL}/volumes`);

    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("maxResults", "20");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Books API returned ${response.status}`,
      );
    }

    return await response.json();
  }
}