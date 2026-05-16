import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  readonly theme = inject(ThemeService);
}
