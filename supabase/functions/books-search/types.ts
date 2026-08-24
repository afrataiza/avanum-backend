export interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

export interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  publishedDate?: string;
  categories?: string[];
  language?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
}

export interface GoogleBooksIndustryIdentifier {
  type: "ISBN_10" | "ISBN_13" | string;
  identifier: string;
}

export interface BookCatalogItem {
  id: string;
  title: string;
  authors: string[];
  synopsis: string | null;
  coverUrl: string | null;
  publicationYear: number | null;
  categories: string[];
  language: string | null;
  isbn10: string | null;
  isbn13: string | null;
}

export interface BookSearchResult {
  items: BookCatalogItem[];
  total: number;
}