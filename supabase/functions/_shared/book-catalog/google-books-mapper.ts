import type {
  BookCatalogItem,
  GoogleBooksVolume,
} from "./types.ts";

export function mapGoogleBook(
  volume: GoogleBooksVolume,
): BookCatalogItem {
  const info = volume.volumeInfo;

  const isbn10 =
    info.industryIdentifiers?.find(
      (identifier) => identifier.type === "ISBN_10",
    )?.identifier ?? null;

  const isbn13 =
    info.industryIdentifiers?.find(
      (identifier) => identifier.type === "ISBN_13",
    )?.identifier ?? null;

  const publicationYear = info.publishedDate
    ? Number.parseInt(info.publishedDate.substring(0, 4), 10)
    : null;

  const coverUrl =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    null;

  return {
    id: volume.id,
    title: info.title ?? "Título desconhecido",
    authors: info.authors ?? [],
    synopsis: info.description ?? null,
    coverUrl: coverUrl?.replace(/^http:\/\//, "https://") ?? null,
    publicationYear: Number.isNaN(publicationYear)
      ? null
      : publicationYear,
    categories: info.categories ?? [],
    language: info.language ?? null,
    isbn10,
    isbn13,
  };
}