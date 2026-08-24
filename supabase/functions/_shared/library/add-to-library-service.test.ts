import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { AddToLibraryService } from "./add-to-library-service.ts";

const bookInput = {
  externalId: "google-book-123",
  title: "A garota do lago",
  authors: ["Charlie Donlea"],
  synopsis: "Sinopse",
  coverUrl: "https://example.com/cover.jpg",
  publicationYear: 2023,
  categories: ["Fiction"],
  language: "pt-BR",
  isbn10: "6586041104",
  isbn13: "9786586041101",
};

function createMockSupabase({
  existingBook = null,
  existingUserBook = null,
  createdBook = null,
  createdUserBook = null,
}: {
  existingBook?: any;
  existingUserBook?: any;
  createdBook?: any;
  createdUserBook?: any;
} = {}) {
  const books = {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: existingBook,
          error: null,
        }),
        single: async () => ({
          data: existingBook,
          error: null,
        }),
      }),
    }),

    insert: () => ({
      select: () => ({
        single: async () => ({
          data: createdBook,
          error: null,
        }),
      }),
    }),
  };

  const userBooks = {
    select: () => ({
      eq: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: existingUserBook,
            error: null,
          }),
        }),
      }),
    }),

    insert: () => ({
      select: () => ({
        single: async () => ({
          data: createdUserBook,
          error: null,
        }),
      }),
    }),
  };

  return {
    from(table: string) {
      return table === "books" ? books : userBooks;
    },
  };
}

Deno.test("adds a new book to the user's library", async () => {
  const book = {
    id: "book-id",
    external_id: "google-book-123",
    title: "A garota do lago",
  };

  const userBook = {
    id: "user-book-id",
    status: "want_to_read",
    book_id: "book-id",
  };

  const supabase = createMockSupabase({
    createdBook: book,
    createdUserBook: userBook,
  });

  const service = new AddToLibraryService(supabase);

  const result = await service.execute(
    "user-id",
    bookInput,
  );

  assertEquals(result.created, true);
  assertEquals(result.book, book);
  assertEquals(result.userBook, userBook);
});

Deno.test("does not duplicate an existing user book", async () => {
  const book = {
    id: "book-id",
    external_id: "google-book-123",
    title: "A garota do lago",
  };

  const userBook = {
    id: "user-book-id",
    status: "want_to_read",
    book_id: "book-id",
  };

  const supabase = createMockSupabase({
    existingBook: book,
    existingUserBook: userBook,
  });

  const service = new AddToLibraryService(supabase);

  const result = await service.execute(
    "user-id",
    bookInput,
  );

  assertEquals(result.created, false);
  assertEquals(result.book, book);
  assertEquals(result.userBook, userBook);
});

Deno.test("adds an existing catalog book to the user's library", async () => {
  const book = {
    id: "book-id",
    external_id: "google-book-123",
    title: "A garota do lago",
  };

  const userBook = {
    id: "user-book-id",
    status: "want_to_read",
    book_id: "book-id",
  };

  const supabase = createMockSupabase({
    existingBook: book,
    createdUserBook: userBook,
  });

  const service = new AddToLibraryService(supabase);

  const result = await service.execute(
    "user-id",
    bookInput,
  );

  assertEquals(result.created, true);
  assertEquals(result.book, book);
  assertEquals(result.userBook, userBook);
});

