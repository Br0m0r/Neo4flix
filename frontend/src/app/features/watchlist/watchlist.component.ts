import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WatchlistApiService } from '../../core/watchlist-api.service';
import { WatchlistEntry } from '../../core/watchlist.models';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="watchlist" aria-labelledby="watchlist-title">
      <a class="back-link" routerLink="/movies">← Browse movies</a>
      <div class="section-heading">
        <div><p class="eyebrow">Saved for later</p><h1 id="watchlist-title">Watchlist</h1></div>
        <p>Keep the stories you want to come back to close at hand.</p>
      </div>
      @if (loading()) {
        <p role="status">Loading watchlist…</p>
      } @else {
        @if (error()) {
          <p role="alert" class="error">{{ error() }}</p>
          <button type="button" (click)="load()">Retry</button>
        }
        @if (!entries().length && !error()) {
          <p role="status" class="empty">Your watchlist is empty.</p>
          <a routerLink="/movies">Browse movies</a>
        } @else if (entries().length) {
          <ul class="watchlist-items" data-testid="watchlist">
            @for (entry of entries(); track entry.movieId) {
              <li class="watchlist-item">
                <a [routerLink]="['/movies', entry.movieId]"><strong>{{ entry.title }}</strong>@if (entry.releaseYear) { <span>{{ entry.releaseYear }}</span> }</a>
                <button class="remove-button" type="button" [disabled]="busyMovieId() === entry.movieId" (click)="remove(entry)">
                  {{ busyMovieId() === entry.movieId ? 'Removing…' : 'Remove' }}
                </button>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: [`
    .watchlist { max-width: 66rem; margin: 0 auto; }
    .back-link { display: inline-flex; margin-bottom: 1.5rem; color: var(--neo-text-muted); text-decoration: none; }
    .back-link:hover { color: var(--neo-primary); }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 1.5rem; }
    .eyebrow { margin: 0 0 .6rem; color: var(--neo-primary); font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; }
    .section-heading > p { max-width: 24rem; margin: 0; color: var(--neo-text-muted); text-align: right; }
    .watchlist-items { display: grid; gap: .75rem; padding: 0; margin: 0; list-style: none; }
    .watchlist-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.15rem; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-sm); background: var(--neo-surface); transition: border-color 180ms ease, transform 180ms ease; }
    .watchlist-item:hover { border-color: rgba(96, 165, 250, .55); transform: translateX(3px); }
    .watchlist-item a { display: flex; min-width: 0; flex-direction: column; gap: .15rem; color: var(--neo-text); text-decoration: none; }
    .watchlist-item a span { color: var(--neo-text-muted); font-size: .85rem; }
    .remove-button { min-height: 2.5rem; padding: .5rem .8rem; border: 1px solid rgba(248, 113, 113, .35); border-radius: .55rem; background: transparent; color: #fca5a5; cursor: pointer; }
    .remove-button:hover { background: rgba(248, 113, 113, .1); }
    .empty { padding: 2rem; border: 1px dashed var(--neo-border); border-radius: var(--neo-radius-md); color: var(--neo-text-muted); }
    @media (max-width: 36rem) { .section-heading { align-items: start; flex-direction: column; gap: .4rem; } .section-heading > p { text-align: left; } .watchlist-item { align-items: stretch; flex-direction: column; } .remove-button { width: 100%; } }
  `],
})
export class WatchlistComponent implements OnInit {
  private readonly api = inject(WatchlistApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly entries = signal<WatchlistEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busyMovieId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (page) => this.entries.set(page.content),
      error: () => this.error.set('Unable to load your watchlist. Please try again.'),
    });
  }

  protected remove(entry: WatchlistEntry): void {
    if (this.busyMovieId()) return;
    this.busyMovieId.set(entry.movieId);
    this.error.set(null);
    this.api.remove(entry.movieId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busyMovieId.set(null)),
    ).subscribe({
      next: () => this.entries.update((current) => current.filter((item) => item.movieId !== entry.movieId)),
      error: () => this.error.set('Unable to update your watchlist. Please try again.'),
    });
  }
}
