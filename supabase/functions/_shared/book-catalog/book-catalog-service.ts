import { GoogleBooksClient } from "./google-books-client.ts";
import { mapGoogleBook } from "./google-books-mapper.ts";
import type {
  BookCatalogItem,
  BookSearchResult,
} from "./types.ts";

export class BookCatalogService {
  constructor(
    private readonly client = new GoogleBooksClient(),
  ) {}

  async search(query: string): Promise<BookSearchResult> {
    const response = await this.client.search(query);

    return {
      items: (response.items ?? []).map(mapGoogleBook),
      total: response.totalItems,
    };
  }

  async getById(id: string): Promise<BookCatalogItem | null> {
    const volume = await this.client.getById(id);

    if (!volume) {
      return null;
    }

    return mapGoogleBook(volume);
  }
}