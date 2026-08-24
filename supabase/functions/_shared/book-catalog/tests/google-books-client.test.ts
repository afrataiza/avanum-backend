import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { GoogleBooksClient } from "../google-books-client.ts";
import { BookCatalogProviderError } from "../errors.ts";

const originalFetch = globalThis.fetch;

function mockFetch(
  status: number,
  body: unknown,
) {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

Deno.test("search throws BookCatalogProviderError on provider failure", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  mockFetch(503, {
    error: {
      code: 503,
      message: "Service temporarily unavailable.",
    },
  });

  try {
    const client = new GoogleBooksClient();

    const error = await assertRejects(
      () => client.search("a garota do lago"),
      BookCatalogProviderError,
    );

    assertEquals(error.status, 503);
  } finally {
    restoreFetch();
  }
});

Deno.test("getById returns Google Books volume", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  mockFetch(200, {
    id: "KWmyEAAAQBAJ",
    volumeInfo: {
      title: "A garota do lago",
      authors: ["Charlie Donlea"],
    },
  });

  try {
    const client = new GoogleBooksClient();

    const result = await client.getById("KWmyEAAAQBAJ");

    assertEquals(result?.id, "KWmyEAAAQBAJ");
    assertEquals(result?.volumeInfo.title, "A garota do lago");
  } finally {
    restoreFetch();
  }
});

Deno.test("getById returns null when Google Books returns 404", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  mockFetch(404, {
    error: {
      code: 404,
      message: "Not Found",
    },
  });

  try {
    const client = new GoogleBooksClient();

    const result = await client.getById("unknown-book-id");

    assertEquals(result, null);
  } finally {
    restoreFetch();
  }
});

Deno.test("getById returns null when Google Books returns 400", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  mockFetch(400, {
    error: {
      code: 400,
      message: "Bad Request",
    },
  });

  try {
    const client = new GoogleBooksClient();

    const result = await client.getById("invalid-id");

    assertEquals(result, null);
  } finally {
    restoreFetch();
  }
});

Deno.test("getById throws provider error on 503", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  mockFetch(503, {
    error: {
      code: 503,
      message: "Service temporarily unavailable.",
    },
  });

  try {
    const client = new GoogleBooksClient();

    const error = await assertRejects(
      () => client.getById("invalid-format-id"),
      BookCatalogProviderError,
    );

    assertEquals(error.status, 503);
  } finally {
    restoreFetch();
  }
});

Deno.test("throws when Google Books API key is missing", async () => {
  Deno.env.delete("GOOGLE_BOOKS_API_KEY");

  try {
    const client = new GoogleBooksClient();

    await assertRejects(
      () => client.search("a garota do lago"),
      Error,
      "GOOGLE_BOOKS_API_KEY is not configured",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("search builds the expected Google Books request", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  let requestedUrl: string | undefined;

  globalThis.fetch = (input) => {
    requestedUrl = input.toString();

    return Promise.resolve(
      new Response(
        JSON.stringify({
          totalItems: 0,
          items: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
  };

  try {
    const client = new GoogleBooksClient();

    await client.search("a garota do lago");

    const url = new URL(requestedUrl!);

    assertEquals(
      url.origin + url.pathname,
      "https://www.googleapis.com/books/v1/volumes",
    );

    assertEquals(
      url.searchParams.get("q"),
      "a garota do lago",
    );

    assertEquals(
      url.searchParams.get("key"),
      "test-api-key",
    );

    assertEquals(
      url.searchParams.get("maxResults"),
      "20",
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("getById builds the expected Google Books request", async () => {
  Deno.env.set("GOOGLE_BOOKS_API_KEY", "test-api-key");

  let requestedUrl: string | undefined;

  globalThis.fetch = (input) => {
    requestedUrl = input.toString();

    return Promise.resolve(
      new Response(
        JSON.stringify({
          id: "KWmyEAAAQBAJ",
          volumeInfo: {
            title: "A garota do lago",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );
  };

  try {
    const client = new GoogleBooksClient();

    await client.getById("KWmyEAAAQBAJ");

    const url = new URL(requestedUrl!);

    assertEquals(
      url.origin + url.pathname,
      "https://www.googleapis.com/books/v1/volumes/KWmyEAAAQBAJ",
    );

    assertEquals(
      url.searchParams.get("key"),
      "test-api-key",
    );
  } finally {
    restoreFetch();
  }
});