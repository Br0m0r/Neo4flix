import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, catchError, finalize, of, switchMap, takeUntil, tap } from 'rxjs';
import { CatalogApiService } from '../../core/catalog-api.service';
import { MovieSummary, PageResult } from '../../core/catalog.models';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="search" aria-labelledby="search-title">
      <p class="eyebrow">Find something specific</p>
      <h1 id="search-title">Search movies</h1>
      <form class="search-form" (submit)="$event.preventDefault(); applySearch()" aria-label="Movie search">
        <label for="movie-search">Search titles</label>
        <input id="movie-search" [formControl]="title" autocomplete="off" />
        <button type="submit">Search</button>
      </form>
      @if (loading()) {
        <p role="status">Searching movies…</p>
      } @else if (error()) {
        <p role="alert">{{ error() }}</p>
        <button type="button" (click)="load(title.value)">Retry</button>
      } @else if (!results().content.length) {
        <p role="status">No movies match your search.</p>
        <a routerLink="/movies">Browse all movies</a>
      } @else {
        <p class="result-count">{{ results().totalElements }} movies</p>
        <ul class="search-results" aria-label="Search results">
          @for (movie of results().content; track movie.id) {
            <li><a [routerLink]="['/movies', movie.id]"><span>{{ movie.title }}</span><span aria-hidden="true">→</span></a></li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .search { max-width: 58rem; margin: 0 auto; }
    .eyebrow { margin: 0 0 .6rem; color: var(--neo-primary); font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0 0 1.5rem; }
    .search-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .75rem; align-items: end; padding: 1rem; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-md); background: rgba(17, 27, 45, .72); }
    .search-form label { grid-column: 1 / -1; color: var(--neo-text-muted); font-size: .85rem; font-weight: 600; }
    .search-form input { width: 100%; min-height: 3rem; margin-top: .35rem; padding: .7rem .8rem; border: 1px solid var(--neo-border); border-radius: .6rem; background: var(--neo-ink-raised); color: var(--neo-text); }
    .search-form button { min-height: 3rem; padding: .7rem 1.25rem; border: 0; border-radius: .6rem; background: var(--neo-primary-strong); color: #fff; font-weight: 700; cursor: pointer; }
    .result-count { margin: 1.5rem 0 .75rem; color: var(--neo-text-muted); font-size: .9rem; }
    .search-results { display: grid; gap: .7rem; padding: 0; margin: 0; list-style: none; }
    .search-results a { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-sm); background: var(--neo-surface); color: var(--neo-text); text-decoration: none; transition: transform 180ms ease, border-color 180ms ease, background 180ms ease; }
    .search-results a:hover { border-color: rgba(96, 165, 250, .55); background: var(--neo-surface-strong); transform: translateX(3px); }
    .search-results a span:last-child { color: var(--neo-primary); font-size: 1.2rem; }
    @media (max-width: 30rem) { .search-form { grid-template-columns: 1fr; } .search-form button { width: 100%; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CatalogApiService);
  private readonly destroyed$ = new Subject<void>();
  protected readonly title = new FormControl('', { nonNullable: true });
  protected readonly results = signal<PageResult<MovieSummary>>({ content: [], page: 0, size: 24, totalElements: 0, totalPages: 0 });
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      takeUntil(this.destroyed$),
      switchMap((params) => {
        const value = params.get('title') ?? '';
        this.title.setValue(value, { emitEvent: false });
        return this.load(value);
      }),
    ).subscribe();
  }

  protected applySearch(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { title: this.title.value || null },
      queryParamsHandling: 'merge',
    });
  }

  protected load(value: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.api.movies({ title: value }).pipe(
      finalize(() => this.loading.set(false)),
      tap((page) => this.results.set(page)),
      catchError(() => {
        this.error.set('Unable to search movies. Please try again.');
        return of(this.results());
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
