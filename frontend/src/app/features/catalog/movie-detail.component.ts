import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthStore } from '../../core/auth.store';
import { CatalogApiService } from '../../core/catalog-api.service';
import { RatingApiService } from '../../core/rating-api.service';

@Component({
  selector: 'app-movie-detail', standalone: true, imports: [AsyncPipe, RouterLink],
  template: `<a routerLink="/movies">← Movies</a>@if (movie$ | async; as movie) {<article><h1>{{ movie.title }}</h1><p>{{ movie.overview }}</p><p>{{ movie.releaseYear }} · {{ movie.runtimeMinutes ?? '—' }} minutes</p><section aria-labelledby="rating-title"><h2 id="rating-title">Rating</h2>@if (summary$ | async; as summary) {<p>{{ summary.averageRating === null ? 'No ratings yet' : summary.averageRating }} ({{ summary.ratingCount }} ratings)</p>} @if (authenticated()) {<a [routerLink]="['/movies', movie.id, 'rate']">Rate this movie</a>} @else {<a [routerLink]="['/auth/login']">Sign in to rate this movie</a>}</section></article>} @else {<p role="status">Movie not found.</p>}`,
})
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute); private readonly api = inject(CatalogApiService);
  private readonly ratingApi = inject(RatingApiService); private readonly auth = inject(AuthStore);
  readonly authenticated = () => this.auth.accessToken() !== null;
  readonly movie$ = this.route.paramMap.pipe(map(params => params.get('id')), switchMap(id => id ? this.api.movie(id) : of(null)), catchError(() => of(null)));
  readonly summary$ = this.route.paramMap.pipe(map(params => params.get('id')), switchMap(id => id ? this.ratingApi.summary(id) : of(null)), catchError(() => of(null)));
}
