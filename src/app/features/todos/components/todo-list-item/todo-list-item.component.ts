import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

import { Todo } from '../../../../core/models/todo.model';
import { TodoPriorityDirective } from '../../../../shared/directives/todo-priority.directive';
import { TodoDueLabelPipe } from '../../../../shared/pipes/todo-due-label.pipe';
import { TodoPriorityLabelPipe } from '../../../../shared/pipes/todo-priority-label.pipe';
import { TodoActionsComponent } from '../todo-actions/todo-actions.component';

@Component({
  selector: 'app-todo-list-item',
  imports: [
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    RouterLink,
    TodoDueLabelPipe,
    TodoActionsComponent,
    TodoPriorityDirective,
    TodoPriorityLabelPipe,
  ],
  templateUrl: './todo-list-item.component.html',
  styleUrl: './todo-list-item.component.scss',
})
export class TodoListItemComponent {
  readonly todo = input.required<Todo>();
  readonly remove = output<number>();
  readonly toggleCompleted = output<number>();
}
