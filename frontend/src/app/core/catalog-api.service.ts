import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenreSummary, MovieDetail, MovieSummary, PageResult } from './catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  movies(filters: { title?: string; genre?: string; page?: number; size?: number } = {}): Observable<PageResult<MovieSummary>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, String(value)); });
    return this.http.get<PageResult<MovieSummary>>('/api/v1/movies', { params });
  }
  movie(id: string): Observable<MovieDetail> { return this.http.get<MovieDetail>(`/api/v1/movies/${encodeURIComponent(id)}`); }
  genres(): Observable<GenreSummary[]> { return this.http.get<GenreSummary[]>('/api/v1/genres'); }
  related(id: string): Observable<MovieSummary[]> { return this.http.get<MovieSummary[]>(`/api/v1/movies/${encodeURIComponent(id)}/related`); }
}
