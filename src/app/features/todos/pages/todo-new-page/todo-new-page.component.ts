import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { TodoCreateInput, TodoService } from '../../../../core/services/todo.service';
import { TodoFormComponent } from '../../components/todo-form/todo-form.component';

@Component({
  selector: 'app-todo-new-page',
  imports: [MatButtonModule, RouterLink, TodoFormComponent],
  templateUrl: './todo-new-page.component.html',
  styleUrl: './todo-new-page.component.scss',
})
export class TodoNewPageComponent {
  private readonly router = inject(Router);
  private readonly todoService = inject(TodoService);

  createTodo(input: TodoCreateInput): void {
    const todo = this.todoService.add(input);
    void this.router.navigate(['/', todo.id]);
  }
}
