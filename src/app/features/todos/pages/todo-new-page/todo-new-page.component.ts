import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly error = this.todoService.error;

  createTodo(input: TodoCreateInput): void {
    this.todoService
      .add(input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (todo) => void this.router.navigate(['/', todo.id]),
        error: () => undefined,
      });
  }
}
