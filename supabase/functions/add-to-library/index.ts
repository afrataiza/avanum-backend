import { createClient } from "jsr:@supabase/supabase-js@2";

interface BookInput {
  externalId: string;
  title: string;
  authors: string[];
  synopsis?: string | null;
  coverUrl?: string | null;
  publicationYear?: number | null;
  categories?: string[];
  language?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
}

interface AddToLibraryRequest {
  book: BookInput;
}

const jsonHeaders = {
  "Content-Type": "application/json",
};

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return response(
        { error: "Method not allowed" },
        405,
      );
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return response(
        { error: "Authentication required" },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey =
    Deno.env.get("SERVICE_ROLE_KEY")!;

    const userSupabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();

    if (authError || !user) {
      return response(
        { error: "Invalid authentication" },
        401,
      );
    }

    const body = (await req.json()) as AddToLibraryRequest;

    if (!body.book?.externalId || !body.book?.title) {
      return response(
        {
          error: "Book externalId and title are required",
        },
        400,
      );
    }

    const bookInput = body.book;

    // Find existing book in catalog
    const { data: existingBook, error: findError } =
      await adminSupabase
        .from("books")
        .select("*")
        .eq("external_id", bookInput.externalId)
        .maybeSingle();

    if (findError) {
      console.error(findError);
      return response(
        { error: "Failed to find book" },
        500,
      );
    }

    let book = existingBook;

    // Create book if it doesn't exist
    if (!book) {
      const { data: createdBook, error: createError } =
        await adminSupabase
          .from("books")
          .insert({
            external_id: bookInput.externalId,
            title: bookInput.title,
            authors: bookInput.authors ?? [],
            synopsis: bookInput.synopsis ?? null,
            cover_url: bookInput.coverUrl ?? null,
            publication_year: bookInput.publicationYear ?? null,
            categories: bookInput.categories ?? [],
            language: bookInput.language ?? null,
            isbn10: bookInput.isbn10 ?? null,
            isbn13: bookInput.isbn13 ?? null,
          })
          .select()
          .single();

      if (createError) {
        console.error(createError);

        // Another request may have created the same book.
        if (createError.code === "23505") {
          const { data: concurrentBook, error: retryError } =
            await adminSupabase
              .from("books")
              .select("*")
              .eq("external_id", bookInput.externalId)
              .single();

          if (retryError) {
            console.error(retryError);
            return response(
              { error: "Failed to retrieve book" },
              500,
            );
          }

          book = concurrentBook;
        } else {
          return response(
            { error: "Failed to create book" },
            500,
          );
        }
      } else {
        book = createdBook;
      }
    }

    // Check whether the book is already in the user's library
    const { data: existingUserBook, error: userBookFindError } =
      await adminSupabase
        .from("user_books")
        .select("id, status, book_id")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .maybeSingle();

    if (userBookFindError) {
      console.error(userBookFindError);
      return response(
        { error: "Failed to check user library" },
        500,
      );
    }

    if (existingUserBook) {
      return response(
        {
          id: existingUserBook.id,
          status: existingUserBook.status,
          book,
        },
        200,
      );
    }

    const { data: userBook, error: userBookError } =
      await adminSupabase
        .from("user_books")
        .insert({
          user_id: user.id,
          book_id: book.id,
          status: "want_to_read",
        })
        .select("id, status, book_id")
        .single();

    if (userBookError) {
      console.error(userBookError);
      return response(
        { error: "Failed to add book to library" },
        500,
      );
    }

    return response(
      {
        id: userBook.id,
        status: userBook.status,
        book,
      },
      201,
    );
  } catch (error) {
    console.error(error);

    return response(
      { error: "Internal server error" },
      500,
    );
  }
});