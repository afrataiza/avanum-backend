import type { BookCatalogRepository } from "./catalog-repository.ts";
import type { BookCatalogItem, BookSearchResult } from "./types.ts";

type SupabaseError = {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
};

function throwRepositoryError(operation: string, error: SupabaseError): never {
  // Avoid logging query parameters or any credentials; these fields contain database diagnostics only.
  console.error(JSON.stringify({
    event: "catalog_repository_error",
    operation,
    code: error.code ?? null,
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
  }));
  throw new Error(`Catalog repository operation failed: ${operation}`);
}

export class SupabaseCatalogRepository implements BookCatalogRepository {
  constructor(private readonly supabase: any) {}

  async getSearchCache(queryKey: string) {
    const { data, error } = await this.supabase
      .from("catalog_search_cache")
      .select("results, total, expires_at")
      .eq("query_key", queryKey)
      .maybeSingle();

    if (error) throwRepositoryError("search_cache_read", error);
    if (!data) return null;

    return {
      result: {
        items: data.results as BookCatalogItem[],
        total: data.total as number,
      },
      expiresAt: data.expires_at as string,
    };
  }

  async upsertSearchCache(
    queryKey: string,
    result: BookSearchResult,
    ttlSeconds: number,
  ): Promise<void> {
    const cachedAt = new Date();
    const expiresAt = new Date(cachedAt.getTime() + ttlSeconds * 1000);

    const { error: cleanupError } = await this.supabase
      .from("catalog_search_cache")
      .delete()
      .lte("expires_at", cachedAt.toISOString());

    if (cleanupError) {
      throwRepositoryError("search_cache_cleanup", cleanupError);
    }

    const { error } = await this.supabase
      .from("catalog_search_cache")
      .upsert({
        query_key: queryKey,
        results: result.items,
        total: result.total,
        cached_at: cachedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "query_key" });

    if (error) throwRepositoryError("search_cache_write", error);
  }

  async getBookByExternalId(id: string) {
    const { data, error } = await this.supabase
      .from("books")
      .select("external_id, title, authors, synopsis, cover_url, publication_year, categories, language, isbn10, isbn13, catalog_synced_at")
      .eq("external_id", id)
      .maybeSingle();

    if (error) throwRepositoryError("book_details_read", error);
    if (!data) return null;

    return {
      book: {
        id: data.external_id,
        title: data.title,
        authors: data.authors ?? [],
        synopsis: data.synopsis,
        coverUrl: data.cover_url,
        publicationYear: data.publication_year,
        categories: data.categories ?? [],
        language: data.language,
        isbn10: data.isbn10,
        isbn13: data.isbn13,
      },
      catalogSyncedAt: data.catalog_synced_at,
    };
  }

  async upsertBook(book: BookCatalogItem, syncedAt: string): Promise<void> {
    const { error } = await this.supabase
      .from("books")
      .upsert({
        external_id: book.id,
        title: book.title,
        authors: book.authors,
        synopsis: book.synopsis,
        cover_url: book.coverUrl,
        publication_year: book.publicationYear,
        categories: book.categories,
        language: book.language,
        isbn10: book.isbn10,
        isbn13: book.isbn13,
        catalog_synced_at: syncedAt,
      }, { onConflict: "external_id" });

    if (error) throwRepositoryError("book_details_write", error);
  }
}
