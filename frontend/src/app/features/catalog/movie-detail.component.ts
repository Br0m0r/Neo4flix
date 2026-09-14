import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { AuthStore } from '../../core/auth.store';
import { CatalogApiService } from '../../core/catalog-api.service';
import { RatingApiService } from '../../core/rating-api.service';
import { WatchlistApiService } from '../../core/watchlist-api.service';

@Component({
  selector: 'app-movie-detail', standalone: true, imports: [AsyncPipe, RouterLink],
  template: `<a routerLink="/movies">← Movies</a>@if (movie$ | async; as movie) {<article><h1>{{ movie.title }}</h1><p>{{ movie.overview }}</p><p>{{ movie.releaseYear }} · {{ movie.runtimeMinutes ?? '—' }} minutes</p><section aria-labelledby="rating-title"><h2 id="rating-title">Rating</h2>@if (summary$ | async; as summary) {<p>{{ summary.averageRating === null ? 'No ratings yet' : summary.averageRating }} ({{ summary.ratingCount }} ratings)</p>} @if (authenticated()) {<a [routerLink]="['/movies', movie.id, 'rate']">Rate this movie</a>} @else {<a [routerLink]="['/auth/login']">Sign in to rate this movie</a>}</section><section aria-labelledby="watchlist-title"><h2 id="watchlist-title">Watchlist</h2>@if (authenticated()) {<button type="button" data-testid="watchlist-action" [disabled]="watchlistBusy()" (click)="toggleWatchlist(movie.id)">{{ watchlisted() ? 'Remove from watchlist' : 'Add to watchlist' }}</button>} @else {<a [routerLink]="['/auth/login']">Sign in to save this movie</a>} @if (watchlistStatus()) {<p role="status">{{ watchlistStatus() }}</p>} @if (watchlistError()) {<p role="alert">{{ watchlistError() }}</p>}</section></article>} @else {<p role="status">Movie not found.</p>}`,
})
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute); private readonly api = inject(CatalogApiService);
  private readonly ratingApi = inject(RatingApiService); private readonly auth = inject(AuthStore);
  private readonly watchlistApi = inject(WatchlistApiService); private readonly destroyRef = inject(DestroyRef);
  readonly watchlisted = signal(false);
  readonly watchlistBusy = signal(false);
  readonly watchlistStatus = signal<string | null>(null);
  readonly watchlistError = signal<string | null>(null);
  readonly authenticated = () => this.auth.accessToken() !== null;
  readonly movie$ = this.route.paramMap.pipe(map(params => params.get('id')), switchMap(id => id ? this.api.movie(id) : of(null)), catchError(() => of(null)));
  readonly summary$ = this.route.paramMap.pipe(map(params => params.get('id')), switchMap(id => id ? this.ratingApi.summary(id) : of(null)), catchError(() => of(null)));

  toggleWatchlist(movieId: string): void {
    if (this.watchlistBusy()) return;
    this.watchlistBusy.set(true);
    this.watchlistStatus.set(null);
    this.watchlistError.set(null);
    const request = this.watchlisted() ? this.watchlistApi.remove(movieId) : this.watchlistApi.add(movieId);
    request.pipe(finalize(() => this.watchlistBusy.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const added = !this.watchlisted();
        this.watchlisted.set(added);
        this.watchlistStatus.set(added ? 'Added to watchlist.' : 'Removed from watchlist.');
      },
      error: () => this.watchlistError.set('Unable to update your watchlist. Please try again.'),
    });
  }
}
