import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { AppStateService } from './core/app-state.service';

@Component({
  selector: 'app-root',
  imports: [MatToolbarModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly applicationName = inject(AppStateService).applicationName.asReadonly();
}
