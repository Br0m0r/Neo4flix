import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AppStateService } from './core/app-state.service';

describe('AppComponent', () => {
  it('renders the Neo4flix product shell', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('main')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Neo4flix');

    TestBed.inject(AppStateService).applicationName.set('Neo4flix preview');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-toolbar').textContent).toContain(
      'Neo4flix preview',
    );
    expect(fixture.nativeElement.querySelector('main h1').textContent).toContain(
      'Neo4flix preview',
    );
  });
});
