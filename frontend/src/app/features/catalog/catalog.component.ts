import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { CatalogApiService } from '../../core/catalog-api.service';
import { CatalogFilters, MovieSummary, PageResult } from '../../core/catalog.models';

const EMPTY_PAGE: PageResult<MovieSummary> = { content: [], page: 0, size: 24, totalElements: 0, totalPages: 0 };

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="catalog" aria-labelledby="catalog-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Explore the catalog</p>
          <h1 id="catalog-title">Movies</h1>
        </div>
        <p class="section-copy">Find a new favorite, then make it part of your story.</p>
      </div>
      <form class="catalog-toolbar" (submit)="$event.preventDefault(); applySearch()" aria-label="Movie filters">
        <mat-form-field appearance="outline">
          <mat-label>Search titles</mat-label>
          <input matInput [formControl]="search" />
        </mat-form-field>
        <button mat-flat-button class="catalog-search-button" type="submit">Search</button>
      </form>
      @if (loading()) {
        <p role="status">Loading movies…</p>
      } @else if (error()) {
        <p role="alert">{{ error() }}</p>
        <button mat-button type="button" (click)="retry()">Retry</button>
      } @else if (!results().content.length) {
        <p role="status">No movies found.</p>
        <a routerLink="/search">Try search</a>
      } @else {
        <p class="result-count" role="status">{{ results().totalElements }} movies</p>
        <div class="grid movie-grid" data-testid="movie-grid">
          @for (movie of results().content; track movie.id) {
            <mat-card class="movie-card">
              @if (movie.posterUrl) { <img class="movie-card__poster" mat-card-image [src]="movie.posterUrl" [alt]="movie.title + ' poster'" loading="lazy" /> }
              <mat-card-header>
                <mat-card-title>{{ movie.title }}</mat-card-title>
                <mat-card-subtitle>{{ movie.releaseYear }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ movie.overview }}</p>
                <p>{{ movie.averageRating ? (movie.averageRating + ' (' + movie.ratingCount + ' ratings)') : 'No ratings yet' }}</p>
                @if (movie.genres.length) { <p>{{ movie.genres.map(genreName).join(', ') }}</p> }
              </mat-card-content>
              <mat-card-actions><a mat-button class="movie-card__details" [routerLink]="['/movies', movie.id]">View details</a></mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .catalog { max-width: 78rem; margin: 0 auto; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 1.5rem; }
    .eyebrow { margin: 0 0 .6rem; color: var(--neo-primary); font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; }
    .section-copy { max-width: 25rem; margin: 0; color: var(--neo-text-muted); text-align: right; }
    .catalog-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-md); background: rgba(17, 27, 45, .72); }
    .catalog-toolbar mat-form-field { flex: 1 1 18rem; }
    .catalog-search-button { min-height: 3.5rem; border-radius: .75rem; }
    .result-count { margin: 0 0 1rem; color: var(--neo-text-muted); font-size: .9rem; }
    .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1.25rem; }
    .movie-card { overflow: hidden; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-md); background: var(--neo-surface); box-shadow: none; transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; }
    .movie-card:hover { border-color: rgba(96, 165, 250, .55); box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, .28); transform: translateY(-4px); }
    .movie-card__poster { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; background: var(--neo-surface-strong); }
    .movie-card mat-card-header { padding-top: 1rem; }
    .movie-card mat-card-title { color: var(--neo-text); font-family: "Lexend", "Avenir Next", sans-serif; }
    .movie-card mat-card-subtitle, .movie-card mat-card-content { color: var(--neo-text-muted); }
    .movie-card mat-card-content { min-height: 7rem; }
    .movie-card mat-card-content p { margin: .55rem 0; }
    .movie-card__details { color: var(--neo-primary) !important; font-weight: 700; }
    @media (max-width: 37.5rem) { .section-heading { align-items: start; flex-direction: column; gap: .4rem; } .section-copy { text-align: left; } .catalog-toolbar { align-items: stretch; flex-direction: column; } .catalog-toolbar mat-form-field, .catalog-toolbar button { width: 100%; } .movie-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; } .movie-card mat-card-content { min-height: 0; } }
    @media (max-width: 25rem) { .movie-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly results = signal<PageResult<MovieSummary>>(EMPTY_PAGE);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly filters = signal<CatalogFilters>({});

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filters = this.readFilters(params);
      this.filters.set(filters);
      this.search.setValue(filters.title ?? '', { emitEvent: false });
      this.load(filters);
    });
  }

  protected applySearch(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { title: this.search.value || null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  protected retry(): void { this.load(this.filters()); }

  protected genreName(genre: { name: string }): string { return genre.name; }

  private load(filters: CatalogFilters): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.movies(filters).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (page) => this.results.set(page),
      error: () => this.error.set('Unable to load movies. Please try again.'),
    });
  }

  private readFilters(params: import('@angular/router').ParamMap): CatalogFilters {
    const number = (name: string): number | undefined => {
      const raw = params.get(name);
      if (raw === null || raw === '') return undefined;
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    };
    const text = (name: string): string | undefined => params.get(name) || undefined;
    const direction = text('direction');
    return {
      title: text('title'), genre: text('genre'), minYear: number('minYear'), maxYear: number('maxYear'),
      fromDate: text('fromDate'), sort: text('sort'), direction: direction === 'asc' ? 'asc' : direction === 'desc' ? 'desc' : undefined,
      page: number('page'), size: number('size'),
    };
  }
}
