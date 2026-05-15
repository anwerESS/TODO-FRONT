import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-todo-actions',
  imports: [RouterLink],
  templateUrl: './todo-actions.component.html',
  styleUrl: './todo-actions.component.scss',
})
export class TodoActionsComponent {
  readonly todoId = input.required<number>();
  readonly remove = output<void>();
}
