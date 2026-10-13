import { GoogleBooksClient } from "./google-books-client.ts";
import type { BookCatalogRepository } from "./catalog-repository.ts";
import { mapGoogleBook } from "./google-books-mapper.ts";
import type {
  BookCatalogClient,
  BookCatalogItem,
  BookSearchResult,
  GoogleBooksVolume,
} from "./types.ts";

const DEFAULT_SEARCH_TTL_SECONDS = 60 * 60;
const DEFAULT_DETAILS_TTL_SECONDS = 7 * 24 * 60 * 60;

function ttlFromEnv(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function isPersistableBook(volume: GoogleBooksVolume, item: BookCatalogItem) {
  const title = item.title.trim();
  const printType = volume.volumeInfo.printType?.toUpperCase();

  return Boolean(
    volume.id?.trim() &&
      title &&
      (!printType || printType === "BOOK"),
  );
}

function isFresh(timestamp: string | null, ttlSeconds: number): boolean {
  if (!timestamp) return false;
  const syncedAt = Date.parse(timestamp);
  return Number.isFinite(syncedAt) &&
    syncedAt <= Date.now() &&
    Date.now() - syncedAt < ttlSeconds * 1000;
}

export class BookCatalogService {
  constructor(
    private readonly client: BookCatalogClient = new GoogleBooksClient(),
    private readonly repository?: BookCatalogRepository,
  ) {}

  async search(query: string): Promise<BookSearchResult> {
    const queryKey = normalizeSearchQuery(query);
    const searchTtl = ttlFromEnv(
      "CATALOG_SEARCH_CACHE_TTL_SECONDS",
      DEFAULT_SEARCH_TTL_SECONDS,
    );

    let cached = null;
    try {
      cached = await this.repository?.getSearchCache(queryKey) ?? null;
    } catch {
      console.warn(JSON.stringify({ event: "catalog_search_cache_read_error" }));
    }

    if (cached && Date.parse(cached.expiresAt) > Date.now()) {
      console.info(JSON.stringify({ event: "catalog_search_cache_hit" }));
      return cached.result;
    }

    console.info(JSON.stringify({ event: "catalog_search_cache_miss" }));
    const startedAt = Date.now();
    let response;

    try {
      response = await this.client.search(query);
    } catch (error) {
      console.error(JSON.stringify({
        event: "catalog_provider_error",
        operation: "search",
        durationMs: Date.now() - startedAt,
      }));

      if (cached) {
        console.warn(JSON.stringify({ event: "catalog_search_stale_fallback" }));
        return cached.result;
      }
      throw error;
    }

    const result = {
      items: (response.items ?? []).map(mapGoogleBook),
      total: response.totalItems,
    };

    console.info(JSON.stringify({
      event: "catalog_provider_success",
      operation: "search",
      durationMs: Date.now() - startedAt,
      resultCount: result.items.length,
    }));

    try {
      await this.repository?.upsertSearchCache(queryKey, result, searchTtl);
    } catch {
      console.error(JSON.stringify({ event: "catalog_search_cache_write_error" }));
    }

    return result;
  }

  async getById(id: string): Promise<BookCatalogItem | null> {
    const detailsTtl = ttlFromEnv(
      "CATALOG_DETAILS_CACHE_TTL_SECONDS",
      DEFAULT_DETAILS_TTL_SECONDS,
    );

    let persisted = null;
    try {
      persisted = await this.repository?.getBookByExternalId(id) ?? null;
    } catch {
      console.warn(JSON.stringify({ event: "catalog_details_cache_read_error" }));
    }

    if (persisted && isFresh(persisted.catalogSyncedAt, detailsTtl)) {
      console.info(JSON.stringify({ event: "catalog_details_cache_hit" }));
      return persisted.book;
    }

    console.info(JSON.stringify({ event: "catalog_details_cache_miss" }));
    const startedAt = Date.now();
    let volume: GoogleBooksVolume | null;

    try {
      volume = await this.client.getById(id);
    } catch (error) {
      console.error(JSON.stringify({
        event: "catalog_provider_error",
        operation: "details",
        durationMs: Date.now() - startedAt,
      }));

      if (persisted) {
        console.warn(JSON.stringify({ event: "catalog_details_stale_fallback" }));
        return persisted.book;
      }
      throw error;
    }

    if (!volume) return null;

    const book = mapGoogleBook(volume);
    if (!isPersistableBook(volume, book)) {
      console.warn(JSON.stringify({
        event: "catalog_book_rejected",
        reason: "invalid_book_metadata",
      }));
      return null;
    }

    console.info(JSON.stringify({
      event: "catalog_provider_success",
      operation: "details",
      durationMs: Date.now() - startedAt,
    }));

    try {
      await this.repository?.upsertBook(book, new Date().toISOString());
    } catch {
      console.error(JSON.stringify({ event: "catalog_details_persistence_error" }));
    }

    return book;
  }
}
