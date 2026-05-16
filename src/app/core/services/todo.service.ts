import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, EMPTY, map, Observable, tap, throwError } from 'rxjs';

import { TodoPriority } from '../models/todo-priority.enum';
import { Todo } from '../models/todo.model';

export const TODO_API_URL = 'http://localhost:8080/api/todos';

/** Fields supplied when creating a todo; server-generated fields are omitted. */
export type TodoCreateInput = Pick<Todo, 'title' | 'priority'> &
  Partial<Pick<Todo, 'description' | 'category' | 'dueDate' | 'completed'>>;

/** Partial update; `id` and timestamps are managed by the API. */
export type TodoUpdateInput = Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>;

type TodoApiDto = {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  priority: TodoPriority;
  category?: string | null;
  dueDate?: string | null;
};

type TodoApiPayload = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: TodoPriority;
  category?: string | null;
  dueDate?: string | null;
};

type DeleteResponse = {
  removed: boolean;
};

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _todos = signal<Todo[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Read-only list for templates and other consumers. */
  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly count = computed(() => this._todos().length);

  readonly activeCount = computed(() => this._todos().filter((todo) => !todo.completed).length);

  readonly completedCount = computed(() => this._todos().filter((todo) => todo.completed).length);

  loadTodos(): Observable<Todo[]> {
    if (!this.isBrowser) {
      return EMPTY;
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<TodoApiDto[]>(TODO_API_URL).pipe(
      map((todos) => todos.map((todo) => this.fromApi(todo))),
      tap((todos) => {
        this._todos.set(todos);
        this._loading.set(false);
        this.logCrud('READ_ALL', {});
      }),
      catchError((error: unknown) => this.handleError<Todo[]>('READ_ALL', error)),
    );
  }

  loadTodo(id: number): Observable<Todo> {
    if (!this.isBrowser) {
      return EMPTY;
    }

    this._loading.set(true);
    this._error.set(null);

    return this.http.get<TodoApiDto>(`${TODO_API_URL}/${id}`).pipe(
      map((todo) => this.fromApi(todo)),
      tap((todo) => {
        this.upsertTodo(todo);
        this._loading.set(false);
        this.logCrud('READ_ONE', { id, todo });
      }),
      catchError((error: unknown) => this.handleError<Todo>('READ_ONE', error)),
    );
  }

  getById(id: number): Todo | undefined {
    const todo = this._todos().find((item) => item.id === id);
    this.logCrud('READ_ONE_CACHE', { id, todo });
    return todo;
  }

  add(input: TodoCreateInput): Observable<Todo> {
    const payload = this.toApiPayload(input);
    this._error.set(null);

    return this.http.post<TodoApiDto>(TODO_API_URL, payload).pipe(
      map((todo) => this.fromApi(todo)),
      tap((todo) => {
        this.upsertTodo(todo);
        this.logCrud('CREATE', todo);
      }),
      catchError((error: unknown) => this.handleError<Todo>('CREATE', error)),
    );
  }

  update(id: number, patch: TodoUpdateInput): Observable<Todo> {
    const payload = this.toApiPayload(patch);
    this._error.set(null);

    return this.http.patch<TodoApiDto>(`${TODO_API_URL}/${id}`, payload).pipe(
      map((todo) => this.fromApi(todo)),
      tap((todo) => {
        this.upsertTodo(todo);
        this.logCrud('UPDATE', { id, patch, todo });
      }),
      catchError((error: unknown) => this.handleError<Todo>('UPDATE', error)),
    );
  }

  remove(id: number): Observable<boolean> {
    this._error.set(null);

    return this.http.delete<DeleteResponse>(`${TODO_API_URL}/${id}`).pipe(
      map((response) => response.removed),
      tap((removed) => {
        if (removed) {
          this._todos.update((todos) => todos.filter((todo) => todo.id !== id));
        }
        this.logCrud('DELETE', { id, removed });
      }),
      catchError((error: unknown) => this.handleError<boolean>('DELETE', error)),
    );
  }

  toggleCompleted(id: number): Observable<Todo> {
    const current = this.getById(id);
    if (!current) {
      return throwError(() => new Error(`Todo ${id} is not loaded.`));
    }

    return this.update(id, { completed: !current.completed });
  }

  replaceAll(todos: Todo[]): void {
    this._todos.set([...todos]);
    this.logCrud('REPLACE_CACHE', { todos });
  }

  private upsertTodo(todo: Todo): void {
    this._todos.update((todos) => {
      const index = todos.findIndex((item) => item.id === todo.id);
      if (index === -1) {
        return [...todos, todo];
      }

      return todos.map((item) => (item.id === todo.id ? todo : item));
    });
  }

  private fromApi(todo: TodoApiDto): Todo {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description ?? undefined,
      completed: todo.completed,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      priority: todo.priority,
      category: todo.category ?? undefined,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    };
  }

  private toApiPayload(input: TodoCreateInput | TodoUpdateInput): TodoApiPayload {
    const payload: TodoApiPayload = {};

    if ('title' in input) {
      payload.title = input.title?.trim();
    }

    if ('description' in input) {
      payload.description = input.description?.trim() || null;
    }

    if ('completed' in input) {
      payload.completed = input.completed;
    }

    if ('priority' in input) {
      payload.priority = input.priority;
    }

    if ('category' in input) {
      payload.category = input.category?.trim() || null;
    }

    if ('dueDate' in input) {
      payload.dueDate = input.dueDate ? input.dueDate.toISOString() : null;
    }

    return payload;
  }

  private handleError<T>(operation: string, error: unknown): Observable<T> {
    this._loading.set(false);
    this._error.set('Unable to reach the todo API.');
    this.logCrud(`${operation}_ERROR`, error);
    return throwError(() => error);
  }

  private logCrud(operation: string, payload: unknown): void {
    console.log('[TodoService]', {
      operation,
      payload,
      todos: this._todos().map((todo) => ({ ...todo })),
    });
  }
}
