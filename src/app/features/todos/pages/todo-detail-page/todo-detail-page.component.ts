import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, EMPTY, map, switchMap, tap } from 'rxjs';

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
  private readonly destroyRef = inject(DestroyRef);

  readonly saved = signal(false);
  readonly loading = this.todoService.loading;
  readonly error = this.todoService.error;
  readonly todoId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: Number.NaN },
  );
  readonly todo = computed(() => {
    const id = this.todoId();
    return Number.isInteger(id) ? this.todoService.getById(id) : undefined;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        distinctUntilChanged(),
        tap(() => this.saved.set(false)),
        switchMap((id) =>
          Number.isInteger(id)
            ? this.todoService.loadTodo(id).pipe(catchError(() => EMPTY))
            : EMPTY,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateTodo(input: TodoCreateInput): void {
    const id = this.todoId();
    if (!Number.isInteger(id)) {
      return;
    }

    this.todoService
      .update(id, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.saved.set(true),
        error: () => this.saved.set(false),
      });
  }

  deleteTodo(): void {
    const id = this.todoId();
    if (Number.isInteger(id)) {
      this.todoService
        .remove(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => void this.router.navigate(['/']),
          error: () => undefined,
        });
      return;
    }

    void this.router.navigate(['/']);
  }
}
