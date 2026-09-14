export interface WatchlistEntry {
  movieId: string;
  movieTitle: string;
  overview: string | null;
  releaseYear: number | null;
  posterUrl: string | null;
  createdAt: string;
}

export interface WatchlistPage {
  content: WatchlistEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
