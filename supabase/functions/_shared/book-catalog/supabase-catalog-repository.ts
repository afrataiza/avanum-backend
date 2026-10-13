import type { BookCatalogRepository } from "./catalog-repository.ts";
import type { BookCatalogItem, BookSearchResult } from "./types.ts";

export class SupabaseCatalogRepository implements BookCatalogRepository {
  constructor(private readonly supabase: any) {}

  async getSearchCache(queryKey: string) {
    const { data, error } = await this.supabase
      .from("catalog_search_cache")
      .select("results, total, expires_at")
      .eq("query_key", queryKey)
      .maybeSingle();

    if (error) throw new Error("Failed to read catalog search cache");
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

    const { error } = await this.supabase
      .from("catalog_search_cache")
      .upsert({
        query_key: queryKey,
        results: result.items,
        total: result.total,
        cached_at: cachedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "query_key" });

    if (error) throw new Error("Failed to write catalog search cache");
  }

  async getBookByExternalId(id: string) {
    const { data, error } = await this.supabase
      .from("books")
      .select("external_id, title, authors, synopsis, cover_url, publication_year, categories, language, isbn10, isbn13, catalog_synced_at")
      .eq("external_id", id)
      .maybeSingle();

    if (error) throw new Error("Failed to read persisted catalog book");
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

    if (error) throw new Error("Failed to persist catalog book");
  }
}
