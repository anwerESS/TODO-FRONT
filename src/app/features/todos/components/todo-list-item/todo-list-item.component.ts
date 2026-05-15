import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { Todo } from '../../../../core/models/todo.model';
import { TodoActionsComponent } from '../todo-actions/todo-actions.component';

@Component({
  selector: 'app-todo-list-item',
  imports: [
    DatePipe,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    RouterLink,
    TodoActionsComponent,
  ],
  templateUrl: './todo-list-item.component.html',
  styleUrl: './todo-list-item.component.scss',
})
export class TodoListItemComponent {
  readonly todo = input.required<Todo>();
  readonly remove = output<number>();
  readonly toggleCompleted = output<number>();
  readonly TodoPriority = TodoPriority;
}
