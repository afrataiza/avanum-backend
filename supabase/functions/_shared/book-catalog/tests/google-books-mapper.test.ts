import { assertEquals } from "jsr:@std/assert";
import { mapGoogleBook } from "../google-books-mapper.ts";
import type { GoogleBooksVolume } from "../types.ts";

Deno.test("maps a Google Books volume to BookCatalogItem", () => {
  const volume: GoogleBooksVolume = {
    id: "book-123",
    volumeInfo: {
      title: "A garota do lago",
      authors: ["Charlie Donlea"],
      description: "Uma sinopse de teste.",
      publishedDate: "2023-03-07",
      categories: ["Fiction", "Romance"],
      language: "pt-BR",
      imageLinks: {
        thumbnail: "http://books.google.com/cover.jpg",
      },
      industryIdentifiers: [
        {
          type: "ISBN_13",
          identifier: "9786586041101",
        },
        {
          type: "ISBN_10",
          identifier: "6586041104",
        },
      ],
    },
  };

  const result = mapGoogleBook(volume);

  assertEquals(result, {
    id: "book-123",
    title: "A garota do lago",
    authors: ["Charlie Donlea"],
    synopsis: "Uma sinopse de teste.",
    coverUrl: "https://books.google.com/cover.jpg",
    publicationYear: 2023,
    categories: ["Fiction", "Romance"],
    language: "pt-BR",
    isbn10: "6586041104",
    isbn13: "9786586041101",
  });
});

Deno.test("handles missing optional book information", () => {
  const volume: GoogleBooksVolume = {
    id: "book-456",
    volumeInfo: {
      title: "Livro sem informações completas",
    },
  };

  const result = mapGoogleBook(volume);

  assertEquals(result, {
    id: "book-456",
    title: "Livro sem informações completas",
    authors: [],
    synopsis: null,
    coverUrl: null,
    publicationYear: null,
    categories: [],
    language: null,
    isbn10: null,
    isbn13: null,
  });
});