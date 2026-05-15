import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-todo-actions',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './todo-actions.component.html',
  styleUrl: './todo-actions.component.scss',
})
export class TodoActionsComponent {
  readonly todoId = input.required<number>();
  readonly remove = output<void>();
}
