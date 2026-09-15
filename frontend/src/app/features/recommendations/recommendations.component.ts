import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  template: '<main><h1>Recommendations</h1></main>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendationsComponent {}
