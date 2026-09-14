import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CatalogApiService } from '../../core/catalog-api.service';

@Component({ selector: 'app-movie-detail', standalone: true, imports: [AsyncPipe, RouterLink], template: `<a routerLink="/movies">← Movies</a>@if (movie$ | async; as movie) {<article><h1>{{ movie.title }}</h1><p>{{ movie.overview }}</p><p>{{ movie.releaseYear }} · {{ movie.runtimeMinutes ?? '—' }} minutes</p></article>} @else {<p>Movie not found.</p>}` })
export class MovieDetailComponent {
  private readonly route = inject(ActivatedRoute); private readonly api = inject(CatalogApiService);
  readonly movie$ = this.route.paramMap.pipe(map(params => params.get('id')), switchMap(id => id ? this.api.movie(id) : of(null)), catchError(() => of(null)));
}
