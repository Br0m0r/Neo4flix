import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CatalogApiService } from '../../core/catalog-api.service';
import { MovieWrite } from '../../core/catalog.models';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <section class="admin-catalog" aria-labelledby="admin-catalog-title">
      <h1 id="admin-catalog-title">Catalog administration</h1>
      <p class="status" role="status">{{ status() }}</p>
      <mat-card>
        <mat-card-header><mat-card-title>Create movie</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="movieForm" (ngSubmit)="saveMovie()" aria-label="Create movie form">
            <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Overview</mat-label><textarea matInput formControlName="overview" required></textarea></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Release year</mat-label><input matInput type="number" formControlName="releaseYear" required /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Release date</mat-label><input matInput type="date" formControlName="releaseDate" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Runtime minutes</mat-label><input matInput type="number" formControlName="runtimeMinutes" /></mat-form-field>
            <button mat-flat-button type="submit">Create movie</button>
          </form>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Create genre</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="genreForm" (ngSubmit)="saveGenre()" aria-label="Create genre form">
            <mat-form-field appearance="outline"><mat-label>Genre name</mat-label><input matInput formControlName="name" required /></mat-form-field>
            <button mat-flat-button type="submit">Create genre</button>
          </form>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`.admin-catalog{max-width:52rem;margin:0 auto}.admin-catalog mat-card{margin-block:1rem}.admin-catalog form{display:grid;gap:1rem}.status{min-height:1.5rem}`],
})
export class AdminCatalogComponent {
  private readonly api = inject(CatalogApiService);
  readonly status = signal('');
  readonly movieForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    overview: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    releaseYear: new FormControl<number | null>(null, Validators.required),
    releaseDate: new FormControl<string | null>(null),
    runtimeMinutes: new FormControl<number | null>(null),
  });
  readonly genreForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  saveMovie(): void {
    if (this.movieForm.invalid) { this.status.set('Enter the required movie fields.'); return; }
    const value = this.movieForm.getRawValue();
    const movie: MovieWrite = {
      title: value.title.trim(), overview: value.overview.trim(), releaseYear: value.releaseYear!,
      releaseDate: value.releaseDate || null, runtimeMinutes: value.runtimeMinutes,
      posterUrl: null, externalSource: null, externalId: null, genreIds: [],
    };
    this.api.createMovie(movie).subscribe({
      next: () => { this.status.set('Movie created.'); this.movieForm.reset(); },
      error: () => this.status.set('Movie could not be created.'),
    });
  }

  saveGenre(): void {
    if (this.genreForm.invalid) { this.status.set('Enter a genre name.'); return; }
    this.api.createGenre(this.genreForm.controls.name.value.trim()).subscribe({
      next: () => { this.status.set('Genre created.'); this.genreForm.reset(); },
      error: () => this.status.set('Genre could not be created.'),
    });
  }
}
