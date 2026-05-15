import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { TodoCreateInput, TodoService } from '../../../../core/services/todo.service';
import { TodoFormComponent } from '../../components/todo-form/todo-form.component';

@Component({
  selector: 'app-todo-detail-page',
  imports: [DatePipe, MatButtonModule, MatCardModule, RouterLink, TodoFormComponent],
  templateUrl: './todo-detail-page.component.html',
  styleUrl: './todo-detail-page.component.scss',
})
export class TodoDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly todoService = inject(TodoService);

  readonly saved = signal(false);
  readonly todoId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: Number.NaN },
  );
  readonly todo = computed(() => {
    const id = this.todoId();
    return Number.isInteger(id) ? this.todoService.getById(id) : undefined;
  });

  updateTodo(input: TodoCreateInput): void {
    const id = this.todoId();
    if (!Number.isInteger(id)) {
      return;
    }

    this.todoService.update(id, input);
    this.saved.set(true);
  }

  deleteTodo(): void {
    const id = this.todoId();
    if (Number.isInteger(id)) {
      this.todoService.remove(id);
    }

    void this.router.navigate(['/']);
  }
}
