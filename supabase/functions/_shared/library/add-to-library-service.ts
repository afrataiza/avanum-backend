import type { BookInput } from "./types.ts";

export class AddToLibraryService {
  constructor(
    private readonly supabase: any,
  ) {}

  async execute(userId: string, bookInput: BookInput) {
    const { data: existingBook, error: findError } =
      await this.supabase
        .from("books")
        .select("*")
        .eq("external_id", bookInput.externalId)
        .maybeSingle();

    if (findError) {
      throw new Error("Failed to find book");
    }

    let book = existingBook;

    if (!book) {
      const { data: createdBook, error: createError } =
        await this.supabase
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
        if (createError.code === "23505") {
          const { data: concurrentBook, error: retryError } =
            await this.supabase
              .from("books")
              .select("*")
              .eq("external_id", bookInput.externalId)
              .single();

          if (retryError) {
            throw new Error("Failed to retrieve book");
          }

          book = concurrentBook;
        } else {
          throw new Error("Failed to create book");
        }
      } else {
        book = createdBook;
      }
    }

    const { data: existingUserBook, error: userBookFindError } =
      await this.supabase
        .from("user_books")
        .select("id, status, book_id")
        .eq("user_id", userId)
        .eq("book_id", book.id)
        .maybeSingle();

    if (userBookFindError) {
      throw new Error("Failed to check user library");
    }

    if (existingUserBook) {
      return {
        created: false,
        userBook: existingUserBook,
        book,
      };
    }

    const { data: userBook, error: userBookError } =
      await this.supabase
        .from("user_books")
        .insert({
          user_id: userId,
          book_id: book.id,
          status: "want_to_read",
        })
        .select("id, status, book_id")
        .single();

    if (userBookError) {
      throw new Error("Failed to add book to library");
    }

    return {
      created: true,
      userBook,
      book,
    };
  }
}