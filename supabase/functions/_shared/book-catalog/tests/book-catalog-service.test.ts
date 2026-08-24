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