export type ReadingFormat =
  | "physical"
  | "ebook"
  | "audiobook";

export type ReadingStatus =
  | "reading"
  | "paused"
  | "abandoned"
  | "completed";

export interface StartReadingInput {
  userBookId: string;
  format: ReadingFormat;
  totalUnits: number;
}

export interface UpdateReadingProgressInput {
  readingId: string;
  currentUnits: number;
}

export interface UpdateReadingStatusInput {
  readingId: string;
  status: "reading" | "paused" | "abandoned";
}

export interface Reading {
  id: string;
  user_book_id: string;
  format: ReadingFormat;
  total_units: number;
  current_units: number;
  status: ReadingStatus;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
