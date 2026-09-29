import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RecommendationApiService } from '../../core/recommendation-api.service';
import { RecommendationItem } from '../../core/recommendation.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="home" aria-labelledby="home-title">
      <div class="home-hero">
        <div class="home-hero__copy">
          <p class="eyebrow">Graph-powered movie discovery</p>
          <h1 id="home-title">Find your next <span>favorite story.</span></h1>
          <p class="home-hero__lead">Discover movies, rate what you love, and let Neo4flix connect the dots.</p>
          <nav class="home-actions" aria-label="Discovery shortcuts">
            <a class="home-primary-cta" routerLink="/movies">Browse movies</a>
            <a class="home-secondary-cta" routerLink="/recommendations">See recommendations</a>
            <a class="home-text-link" routerLink="/watchlist">Open watchlist</a>
          </nav>
        </div>
        <div class="home-hero__signal" aria-hidden="true">
          <span class="signal-orbit signal-orbit--one"></span>
          <span class="signal-orbit signal-orbit--two"></span>
          <span class="signal-core">N</span>
        </div>
      </div>
      <section class="home-recommendations surface-panel" aria-labelledby="home-recommendations-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">A little inspiration</p>
            <h2 id="home-recommendations-title">Recommended for you</h2>
          </div>
          <a class="home-text-link" routerLink="/recommendations">View all</a>
        </div>
        @if (loading()) {
          <div class="inline-state" role="status">Loading recommendations…</div>
        } @else if (error()) {
          <div class="inline-state inline-state--error" role="alert">
            <p>{{ error() }}</p>
            <a routerLink="/recommendations">Open recommendations</a>
          </div>
        } @else if (!items().length) {
          <div class="inline-state" role="status">
            <p>Rate a few movies to improve your recommendations.</p>
            <a routerLink="/movies">Browse movies to rate</a>
          </div>
        } @else {
          <ul class="recommendation-grid" aria-label="Recommended movies">
            @for (item of items(); track item.movie.id) {
              <li class="recommendation-tile">
                <a [routerLink]="['/movies', item.movie.id]">
                  @if (item.movie.posterUrl) {
                    <img [src]="item.movie.posterUrl" [alt]="item.movie.title + ' poster'" loading="lazy" />
                  } @else {
                    <span class="poster-placeholder" aria-hidden="true">N4</span>
                  }
                  <span class="recommendation-tile__body">
                    <strong>{{ item.movie.title }}</strong>
                    <span>{{ item.reason.text }}</span>
                  </span>
                </a>
              </li>
            }
          </ul>
        }
      </section>
    </section>
  `,
  styles: [`
    .home { max-width: 78rem; margin: 0 auto; }
    .home-hero { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(14rem, .8fr); align-items: center; gap: clamp(2rem, 8vw, 8rem); padding: clamp(2rem, 6vw, 5rem) 0 clamp(3rem, 7vw, 6rem); }
    .eyebrow { margin: 0 0 .8rem; color: var(--neo-primary); font-size: .78rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h1 { max-width: 11ch; margin: 0; font-size: clamp(2.75rem, 8vw, 6.6rem); }
    h1 span { color: var(--neo-primary); }
    .home-hero__lead { max-width: 38rem; margin: 1.5rem 0 0; color: var(--neo-text-muted); font-size: clamp(1.05rem, 2vw, 1.3rem); }
    .home-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1.25rem; margin-top: 2rem; }
    .home-actions a { text-decoration: none; }
    .home-primary-cta, .home-secondary-cta { display: inline-flex; align-items: center; min-height: 3rem; padding: .75rem 1.2rem; border-radius: 999px; font-weight: 700; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
    .home-primary-cta { background: var(--neo-cta); color: #1c0d03; box-shadow: 0 .65rem 1.5rem rgba(249, 115, 22, .22); }
    .home-secondary-cta { border: 1px solid var(--neo-border); background: rgba(96, 165, 250, .09); color: var(--neo-text); }
    .home-primary-cta:hover, .home-secondary-cta:hover { transform: translateY(-2px); }
    .home-primary-cta:hover { box-shadow: 0 .85rem 1.8rem rgba(249, 115, 22, .3); }
    .home-text-link { color: var(--neo-primary); font-weight: 700; }
    .home-hero__signal { position: relative; display: grid; min-height: 19rem; place-items: center; }
    .signal-core { display: grid; width: clamp(7rem, 18vw, 11rem); height: clamp(7rem, 18vw, 11rem); place-items: center; border: 1px solid rgba(147, 197, 253, .5); border-radius: 2.4rem; background: linear-gradient(145deg, rgba(59, 130, 246, .8), rgba(30, 64, 175, .45)); box-shadow: 0 0 0 1.5rem rgba(59, 130, 246, .05), 0 0 5rem rgba(59, 130, 246, .35); color: white; font: 700 clamp(3rem, 7vw, 5rem)/1 "Lexend", sans-serif; transform: rotate(-8deg); }
    .signal-orbit { position: absolute; display: block; border: 1px solid rgba(96, 165, 250, .26); border-radius: 50%; transform: rotate(-22deg); }
    .signal-orbit--one { width: 17rem; height: 9rem; }
    .signal-orbit--two { width: 9rem; height: 17rem; }
    .surface-panel { padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid var(--neo-border); border-radius: var(--neo-radius-lg); background: linear-gradient(145deg, rgba(23, 36, 58, .88), rgba(13, 20, 34, .88)); box-shadow: var(--neo-shadow); }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; }
    h2 { margin: 0; font-size: clamp(1.45rem, 3vw, 2.1rem); }
    .recommendation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 1rem; padding: 0; margin: 0; list-style: none; }
    .recommendation-tile a { display: flex; min-height: 9rem; height: 100%; overflow: hidden; border: 1px solid var(--neo-border); border-radius: var(--neo-radius-md); background: rgba(7, 11, 20, .52); color: var(--neo-text); text-decoration: none; transition: transform 180ms ease, border-color 180ms ease, background 180ms ease; }
    .recommendation-tile a:hover { border-color: rgba(96, 165, 250, .55); background: rgba(30, 64, 175, .16); transform: translateY(-3px); }
    .recommendation-tile img, .poster-placeholder { width: 5.5rem; min-width: 5.5rem; height: 9rem; object-fit: cover; }
    .poster-placeholder { display: grid; place-items: center; background: linear-gradient(145deg, #1e3a8a, #111827); color: rgba(255, 255, 255, .74); font: 700 1.5rem "Lexend", sans-serif; }
    .recommendation-tile__body { display: flex; min-width: 0; flex-direction: column; gap: .45rem; padding: 1rem; }
    .recommendation-tile__body strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .recommendation-tile__body span { color: var(--neo-text-muted); font-size: .9rem; }
    .inline-state { padding: 1.25rem; border: 1px dashed var(--neo-border); border-radius: var(--neo-radius-sm); color: var(--neo-text-muted); }
    .inline-state p { margin-top: 0; }
    .inline-state--error { border-color: rgba(248, 113, 113, .45); }
    @media (max-width: 48rem) { .home-hero { grid-template-columns: 1fr; min-height: auto; padding-top: 2rem; } .home-hero__signal { order: -1; min-height: 12rem; } .signal-orbit--one { width: 12rem; height: 6rem; } .signal-orbit--two { width: 6rem; height: 12rem; } }
    @media (max-width: 30rem) { .home-actions { align-items: stretch; flex-direction: column; } .home-actions a { justify-content: center; width: 100%; } .section-heading { align-items: start; flex-direction: column; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(RecommendationApiService);
  protected readonly items = signal<RecommendationItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.list({ size: 6 }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => this.items.set(response.items),
      error: () => this.error.set('Recommendations are temporarily unavailable.'),
    });
  }
}
