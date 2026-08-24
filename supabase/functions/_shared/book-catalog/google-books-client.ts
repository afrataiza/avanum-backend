import type {
  GoogleBooksSearchResponse,
  GoogleBooksVolume,
} from "./types.ts";
import { BookCatalogProviderError } from "./errors.ts";

const GOOGLE_BOOKS_BASE_URL =
  "https://www.googleapis.com/books/v1";

export class GoogleBooksClient {
  private getApiKey(): string {
    const apiKey = Deno.env.get("GOOGLE_BOOKS_API_KEY");

    if (!apiKey) {
      throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
    }

    return apiKey;
  }

  async search(query: string): Promise<GoogleBooksSearchResponse> {
    const url = new URL(`${GOOGLE_BOOKS_BASE_URL}/volumes`);

    url.searchParams.set("q", query);
    url.searchParams.set("key", this.getApiKey());
    url.searchParams.set("maxResults", "20");

    const response = await fetch(url);

    if (!response.ok) {
      throw new BookCatalogProviderError(
        `Google Books API returned ${response.status}`,
        response.status,
      );
    }

    return await response.json();
  }

  async getById(id: string): Promise<GoogleBooksVolume | null> {
    const url = new URL(
      `${GOOGLE_BOOKS_BASE_URL}/volumes/${encodeURIComponent(id)}`,
    );

    url.searchParams.set("key", this.getApiKey());

    const response = await fetch(url);

    if (response.status === 400 || response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new BookCatalogProviderError(
        `Google Books API returned ${response.status}`,
        response.status,
      );
    }

    return await response.json();
  }
}