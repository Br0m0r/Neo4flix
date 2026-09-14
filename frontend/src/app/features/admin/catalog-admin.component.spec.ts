import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApiService } from '../../core/catalog-api.service';
import { AdminCatalogComponent } from './catalog-admin.component';

describe('AdminCatalogComponent', () => {
  let fixture: ComponentFixture<AdminCatalogComponent>;
  const api = {
    movies: vi.fn(),
    genres: vi.fn(),
    createMovie: vi.fn(),
    updateMovie: vi.fn(),
    deleteMovie: vi.fn(),
    createGenre: vi.fn(),
    renameGenre: vi.fn(),
    deleteGenre: vi.fn(),
  };

  const movie = {
    id: 'movie-1', title: 'Arrival', overview: 'First contact', releaseYear: 2016,
    releaseDate: '2016-11-11', posterUrl: null, genres: [], averageRating: 0, ratingCount: 0,
  };
  const genre = { id: 'genre-1', name: 'Science Fiction' };

  beforeEach(async () => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.movies.mockReturnValue(of({ content: [movie], page: 0, size: 24, totalElements: 1, totalPages: 1 }));
    api.genres.mockReturnValue(of([genre]));
    api.createMovie.mockReturnValue(of(movie));
    api.updateMovie.mockReturnValue(of(movie));
    api.deleteMovie.mockReturnValue(of(undefined));
    api.createGenre.mockReturnValue(of(genre));
    api.renameGenre.mockReturnValue(of(genre));
    api.deleteGenre.mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [AdminCatalogComponent],
      providers: [{ provide: CatalogApiService, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminCatalogComponent);
    fixture.detectChanges();
  });

  it('loads current movies and genres with edit and delete controls', () => {
    expect(fixture.nativeElement.textContent).toContain('Arrival');
    expect(fixture.nativeElement.textContent).toContain('Science Fiction');
    expect(fixture.nativeElement.querySelector('[data-testid="edit-movie-movie-1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="delete-movie-movie-1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="delete-genre-genre-1"]')).not.toBeNull();
  });

  it('updates the selected movie through the admin API', () => {
    (fixture.nativeElement.querySelector('[data-testid="edit-movie-movie-1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('[data-testid="movie-title"]') as HTMLInputElement;
    title.value = 'Arrival Updated';
    title.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('[data-testid="movie-form"]') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(api.updateMovie).toHaveBeenCalledWith('movie-1', expect.objectContaining({ title: 'Arrival Updated' }));
    expect(fixture.nativeElement.textContent).toContain('Movie updated.');
  });

  it('deletes movies and genres through their admin controls', () => {
    (fixture.nativeElement.querySelector('[data-testid="delete-movie-movie-1"]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('[data-testid="delete-genre-genre-1"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(api.deleteMovie).toHaveBeenCalledWith('movie-1');
    expect(api.deleteGenre).toHaveBeenCalledWith('genre-1');
    expect(fixture.nativeElement.textContent).toContain('Genre deleted.');
  });
});
