import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RecommendationApiService } from '../../core/recommendation-api.service';
import { RecommendationFilters, RecommendationItem, RecommendationResponse } from '../../core/recommendation.models';
import { WatchlistApiService } from '../../core/watchlist-api.service';

const DEFAULT_SORT = 'recommendation';
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

type FilterForm = {
  genre: FormControl<string>;
  fromYear: FormControl<string>;
  toYear: FormControl<string>;
  minimumAverageRating: FormControl<string>;
  sort: FormControl<string>;
  page: FormControl<number>;
  size: FormControl<number>;
};

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="recommendations" aria-labelledby="recommendations-title">
      <a routerLink="/movies">← Browse movies</a>
      <h1 id="recommendations-title">Recommendations</h1>
      <form [formGroup]="form" (ngSubmit)="applyFilters()" aria-label="Recommendation filters">
        <label>Genre <input formControlName="genre" maxlength="80" /></label>
        <label>From year <input formControlName="fromYear" inputmode="numeric" /></label>
        <label>To year <input formControlName="toYear" inputmode="numeric" /></label>
        <label>Minimum rating <input formControlName="minimumAverageRating" inputmode="decimal" /></label>
        <label>Sort
          <select formControlName="sort">
            <option value="recommendation">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="newest">Newest</option>
          </select>
        </label>
        <button data-testid="apply-filters" type="submit">Apply filters</button>
        <button type="button" (click)="resetFilters()">Reset</button>
      </form>

      @if (loading()) {
        <p role="status">Loading recommendations…</p>
      } @else if (errorStatus() === 503) {
        <p role="alert">Recommendations are temporarily unavailable. Please try again later.</p>
        <button type="button" (click)="retry()">Retry</button>
        <a routerLink="/movies">Browse movies</a>
      } @else if (error()) {
        <p role="alert">{{ error() }}</p>
        <button type="button" (click)="retry()">Retry</button>
      } @else if (!items().length) {
        <p class="empty" role="status">Rate a few movies to get personalized recommendations.</p>
        <a routerLink="/movies">Browse movies</a>
      } @else {
        <p data-testid="strategy">{{ strategyLabel(response()?.strategy) }}</p>
        <div data-testid="recommendations" class="grid">
          @for (item of items(); track item.movie.id) {
            <article>
              <h2>{{ item.movie.title }}</h2>
              @if (item.movie.releaseYear) { <p>{{ item.movie.releaseYear }}</p> }
              <p>{{ item.reason.text }}</p>
              <a data-testid="movie-details" [routerLink]="['/movies', item.movie.id]">Details</a>
              <button data-testid="watchlist-add" type="button" [disabled]="busyMovieId() === item.movie.id" (click)="addToWatchlist(item)">
                {{ busyMovieId() === item.movie.id ? 'Adding…' : 'Add to watchlist' }}
              </button>
            </article>
          }
        </div>
        @if (watchlistError()) { <p role="alert">{{ watchlistError() }}</p> }
        <nav aria-label="Recommendation pages">
          <button type="button" [disabled]="!hasPreviousPage()" (click)="changePage(currentPage() - 1)">Previous</button>
          <button type="button" [disabled]="!hasNextPage()" (click)="changePage(currentPage() + 1)">Next</button>
        </nav>
      }
    </section>
  `,
  styles: [`.recommendations{max-width:1100px;margin:2rem auto;padding:0 1rem}.recommendations form{display:flex;flex-wrap:wrap;gap:1rem;align-items:end;margin:1rem 0}.recommendations label{display:flex;flex-direction:column;gap:.25rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.grid article{border:1px solid #ddd;border-radius:8px;padding:1rem}.grid button{margin-left:.75rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationsComponent implements OnInit {
  private readonly api = inject(RecommendationApiService);
  private readonly watchlist = inject(WatchlistApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = new FormGroup<FilterForm>({
    genre: new FormControl('', { nonNullable: true }),
    fromYear: new FormControl('', { nonNullable: true }),
    toYear: new FormControl('', { nonNullable: true }),
    minimumAverageRating: new FormControl('', { nonNullable: true }),
    sort: new FormControl(DEFAULT_SORT, { nonNullable: true }),
    page: new FormControl(DEFAULT_PAGE, { nonNullable: true }),
    size: new FormControl(DEFAULT_SIZE, { nonNullable: true }),
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorStatus = signal<number | null>(null);
  protected readonly response = signal<RecommendationResponse | null>(null);
  protected readonly items = signal<RecommendationItem[]>([]);
  protected readonly busyMovieId = signal<string | null>(null);
  protected readonly watchlistError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filters = this.filtersFromQuery(params);
      this.patchForm(filters);
      this.load(filters);
    });
  }

  protected applyFilters(): void {
    const filters = this.formFilters();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.queryParams(filters),
      replaceUrl: true,
    });
    this.load(filters);
  }

  protected resetFilters(): void {
    this.form.reset({ genre: '', fromYear: '', toYear: '', minimumAverageRating: '', sort: DEFAULT_SORT, page: DEFAULT_PAGE, size: DEFAULT_SIZE });
    this.applyFilters();
  }

  protected retry(): void {
    this.load(this.formFilters());
  }

  protected changePage(page: number): void {
    if (page < 0) return;
    this.form.controls.page.setValue(page);
    this.applyFilters();
  }

  protected addToWatchlist(item: RecommendationItem): void {
    if (this.busyMovieId()) return;
    this.busyMovieId.set(item.movie.id);
    this.watchlistError.set(null);
    this.watchlist.add(item.movie.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busyMovieId.set(null)),
    ).subscribe({ error: () => this.watchlistError.set('Unable to update your watchlist. Please try again.') });
  }

  protected strategyLabel(strategy: RecommendationResponse['strategy'] | undefined): string {
    return strategy === 'PERSONALIZED' ? 'Personalized recommendations' : 'Popular recommendations';
  }

  protected currentPage(): number {
    return this.response()?.page ?? this.form.controls.page.value;
  }

  protected hasPreviousPage(): boolean {
    return this.currentPage() > 0;
  }

  protected hasNextPage(): boolean {
    const current = this.response();
    return !!current && current.page + 1 < current.totalPages;
  }

  private load(filters: RecommendationFilters): void {
    this.loading.set(true);
    this.error.set(null);
    this.errorStatus.set(null);
    this.watchlistError.set(null);
    this.api.list(filters).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (result) => {
        this.response.set(result);
        this.items.set(result.items ?? []);
      },
      error: (failure: unknown) => {
        const status = failure instanceof HttpErrorResponse ? failure.status : null;
        this.errorStatus.set(status);
        this.error.set(status === 503 ? null : 'Unable to load recommendations. Please try again.');
        this.response.set(null);
        this.items.set([]);
      },
    });
  }

  private filtersFromQuery(params: import('@angular/router').ParamMap): RecommendationFilters {
    return {
      genre: params.get('genre')?.slice(0, 80) || null,
      fromYear: this.numberParam(params.get('fromYear')),
      toYear: this.numberParam(params.get('toYear')),
      minimumAverageRating: this.numberParam(params.get('minimumAverageRating')),
      sort: this.sortParam(params.get('sort')),
      page: this.pageParam(params.get('page')),
      size: this.sizeParam(params.get('size')),
    };
  }

  private patchForm(filters: RecommendationFilters): void {
    this.form.patchValue({
      genre: filters.genre ?? '',
      fromYear: filters.fromYear?.toString() ?? '',
      toYear: filters.toYear?.toString() ?? '',
      minimumAverageRating: filters.minimumAverageRating?.toString() ?? '',
      sort: filters.sort ?? DEFAULT_SORT,
      page: filters.page ?? DEFAULT_PAGE,
      size: filters.size ?? DEFAULT_SIZE,
    }, { emitEvent: false });
  }

  private formFilters(): RecommendationFilters {
    const value = this.form.getRawValue();
    return {
      genre: value.genre.trim().slice(0, 80) || null,
      fromYear: this.numberParam(value.fromYear),
      toYear: this.numberParam(value.toYear),
      minimumAverageRating: this.numberParam(value.minimumAverageRating),
      sort: this.sortParam(value.sort),
      page: this.pageParam(value.page),
      size: this.sizeParam(value.size),
    };
  }

  private queryParams(filters: RecommendationFilters): Record<string, string | number> {
    const result: Record<string, string | number> = {
      sort: filters.sort ?? DEFAULT_SORT,
      page: filters.page ?? DEFAULT_PAGE,
      size: filters.size ?? DEFAULT_SIZE,
    };
    if (filters.genre) result['genre'] = filters.genre;
    if (filters.fromYear !== null && filters.fromYear !== undefined) result['fromYear'] = filters.fromYear;
    if (filters.toYear !== null && filters.toYear !== undefined) result['toYear'] = filters.toYear;
    if (filters.minimumAverageRating !== null && filters.minimumAverageRating !== undefined) result['minimumAverageRating'] = filters.minimumAverageRating;
    return result;
  }

  private numberParam(value: string | number | null): number | null {
    if (value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private sortParam(value: string | null): string {
    return value === 'rating' || value === 'newest' || value === DEFAULT_SORT ? value : DEFAULT_SORT;
  }

  private pageParam(value: string | number | null): number {
    const parsed = this.numberParam(value);
    return parsed === null ? DEFAULT_PAGE : Math.min(10000, Math.max(0, Math.trunc(parsed)));
  }

  private sizeParam(value: string | number | null): number {
    const parsed = this.numberParam(value);
    return parsed === null ? DEFAULT_SIZE : Math.min(50, Math.max(1, Math.trunc(parsed)));
  }
}
