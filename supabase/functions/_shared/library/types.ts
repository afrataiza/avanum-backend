export interface BookInput {
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