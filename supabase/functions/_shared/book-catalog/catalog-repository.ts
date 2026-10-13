import type { BookCatalogItem, BookSearchResult } from "./types.ts";

export interface PersistedCatalogBook {
  book: BookCatalogItem;
  catalogSyncedAt: string | null;
}

export interface CachedCatalogSearch {
  result: BookSearchResult;
  expiresAt: string;
}

export interface BookCatalogRepository {
  getSearchCache(queryKey: string): Promise<CachedCatalogSearch | null>;
  upsertSearchCache(
    queryKey: string,
    result: BookSearchResult,
    ttlSeconds: number,
  ): Promise<void>;
  getBookByExternalId(id: string): Promise<PersistedCatalogBook | null>;
  upsertBook(book: BookCatalogItem, syncedAt: string): Promise<void>;
}
