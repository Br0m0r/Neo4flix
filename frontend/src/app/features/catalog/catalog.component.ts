import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { catchError, of, startWith, switchMap } from 'rxjs';
import { CatalogApiService } from '../../core/catalog-api.service';

@Component({
  selector: 'app-catalog', standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, RouterLink],
  template: `<section class="catalog"><h1>Movies</h1><mat-form-field appearance="outline"><mat-label>Search titles</mat-label><input matInput [formControl]="search" /></mat-form-field>@if (results$ | async; as results) {<p>{{ results.totalElements }} movies</p><div class="grid">@for (movie of results.content; track movie.id) {<mat-card><mat-card-header><mat-card-title>{{ movie.title }}</mat-card-title><mat-card-subtitle>{{ movie.releaseYear }}</mat-card-subtitle></mat-card-header><mat-card-content><p>{{ movie.overview }}</p></mat-card-content><mat-card-actions><a mat-button [routerLink]="['/movies', movie.id]">Details</a></mat-card-actions></mat-card>}</div>} @else {<p>Loading movies…</p>}</section>`,
  styles: [`.catalog{max-width:1100px;margin:2rem auto;padding:0 1rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}`],
})
export class CatalogComponent {
  private readonly api = inject(CatalogApiService);
  readonly search = new FormControl('', { nonNullable: true });
  readonly results$ = this.search.valueChanges.pipe(startWith(''), switchMap(title => this.api.movies({ title })), catchError(() => of({ content: [], page: 0, size: 24, totalElements: 0, totalPages: 0 })));
}
