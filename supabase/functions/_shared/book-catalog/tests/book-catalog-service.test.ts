import { assertEquals } from "jsr:@std/assert";
import { BookCatalogService } from "../book-catalog-service.ts";
import type {
  GoogleBooksSearchResponse,
  GoogleBooksVolume,
} from "../types.ts";

class MockGoogleBooksClient {
  async search(
    _query: string,
  ): Promise<GoogleBooksSearchResponse> {
    return {
      totalItems: 1,
      items: [
        {
          id: "book-123",
          volumeInfo: {
            title: "A garota do lago",
            authors: ["Charlie Donlea"],
            description: "Sinopse",
            publishedDate: "2023-03-07",
            language: "pt-BR",
          },
        },
      ],
    };
  }

  async getById(
    _id: string,
  ): Promise<GoogleBooksVolume | null> {
    return {
      id: "book-123",
      volumeInfo: {
        title: "A garota do lago",
        authors: ["Charlie Donlea"],
        description: "Sinopse",
        publishedDate: "2023-03-07",
        language: "pt-BR",
      },
    };
  }
}

Deno.test("search returns mapped catalog items", async () => {
  const service = new BookCatalogService(
    new MockGoogleBooksClient(),
  );

  const result = await service.search("a garota do lago");

  assertEquals(result, {
    total: 1,
    items: [
      {
        id: "book-123",
        title: "A garota do lago",
        authors: ["Charlie Donlea"],
        synopsis: "Sinopse",
        coverUrl: null,
        publicationYear: 2023,
        categories: [],
        language: "pt-BR",
        isbn10: null,
        isbn13: null,
      },
    ],
  });
});

Deno.test("getById returns mapped book", async () => {
  const service = new BookCatalogService(
    new MockGoogleBooksClient(),
  );

  const result = await service.getById("book-123");

  assertEquals(result, {
    id: "book-123",
    title: "A garota do lago",
    authors: ["Charlie Donlea"],
    synopsis: "Sinopse",
    coverUrl: null,
    publicationYear: 2023,
    categories: [],
    language: "pt-BR",
    isbn10: null,
    isbn13: null,
  });
});

Deno.test("search reuses a valid normalized cache entry", async () => {
  let providerCalls = 0;
  let requestedKey = "";
  const cachedResult = {
    total: 1,
    items: [{
      id: "book-cached",
      title: "Cached book",
      authors: [],
      synopsis: null,
      coverUrl: null,
      publicationYear: null,
      categories: [],
      language: null,
      isbn10: null,
      isbn13: null,
    }],
  };
  const client = {
    async search(_query: string) {
      providerCalls++;
      return { totalItems: 0, items: [] };
    },
    async getById(_id: string) {
      return null;
    },
  };
  const repository = {
    async getSearchCache(queryKey: string) {
      requestedKey = queryKey;
      return { result: cachedResult, expiresAt: new Date(Date.now() + 60_000).toISOString() };
    },
    async upsertSearchCache() {},
    async getBookByExternalId() { return null; },
    async upsertBook() {},
  };

  const service = new BookCatalogService(client, repository);
  const result = await service.search("  A   GAROTA do lago  ");

  assertEquals(requestedKey, "a garota do lago");
  assertEquals(providerCalls, 0);
  assertEquals(result, cachedResult);
});

Deno.test("details persists a validated book returned by the provider", async () => {
  let persistedId = "";
  const repository = {
    async getSearchCache() { return null; },
    async upsertSearchCache() {},
    async getBookByExternalId() { return null; },
    async upsertBook(book: { id: string }) { persistedId = book.id; },
  };
  const service = new BookCatalogService(new MockGoogleBooksClient(), repository);

  const result = await service.getById("book-123");

  assertEquals(result?.id, "book-123");
  assertEquals(persistedId, "book-123");
});

Deno.test("details falls back to persisted data when provider fails", async () => {
  const persistedBook = {
    id: "book-123",
    title: "Persisted title",
    authors: [],
    synopsis: null,
    coverUrl: null,
    publicationYear: null,
    categories: [],
    language: null,
    isbn10: null,
    isbn13: null,
  };
  const repository = {
    async getSearchCache() { return null; },
    async upsertSearchCache() {},
    async getBookByExternalId() {
      return { book: persistedBook, catalogSyncedAt: null };
    },
    async upsertBook() {},
  };
  const client = {
    async search(_query: string) {
      throw new Error("provider unavailable");
    },
    async getById(_id: string) {
      throw new Error("provider unavailable");
    },
  };
  const service = new BookCatalogService(client, repository);

  const result = await service.getById("book-123");

  assertEquals(result, persistedBook);
});
