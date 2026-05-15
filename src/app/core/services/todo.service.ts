import { computed, Injectable, signal } from '@angular/core';

import { Todo } from '../models/todo.model';
import { TodoPriority } from '../models/todo-priority.enum';

export const TODO_STORAGE_KEY = 'todo-front.todos.v1';

/** Fields supplied when creating a todo; server-generated fields are omitted. */
export type TodoCreateInput = Pick<Todo, 'title' | 'priority'> &
  Partial<Pick<Todo, 'description' | 'category' | 'dueDate' | 'completed'>>;

/** Partial update; `id` and timestamps are managed by the service. */
export type TodoUpdateInput = Partial<
  Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
>;

type StoredTodo = Omit<Todo, 'createdAt' | 'updatedAt' | 'dueDate'> & {
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
};

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly _todos = signal<Todo[]>([]);
  private nextId = 1;

  constructor() {
    const storedTodos = this.readStoredTodos();
    if (storedTodos) {
      this.hydrateTodos(storedTodos);
      return;
    }

    // this.seedInitialTodos();
    // this.persistTodos();
  }

  /** Read-only list for templates and other consumers. */
  readonly todos = this._todos.asReadonly();

  readonly count = computed(() => this._todos().length);

  readonly activeCount = computed(() => this._todos().filter((t) => !t.completed).length);

  readonly completedCount = computed(() => this._todos().filter((t) => t.completed).length);

  getAll(): Todo[] {
    const todos = [...this._todos()];
    this.logCrud('READ_ALL', {});
    return todos;
  }

  getById(id: number): Todo | undefined {
    const todo = this._todos().find((t) => t.id === id);
    this.logCrud('READ_ONE', { id, todo });
    return todo;
  }

  add(input: TodoCreateInput): Todo {
    const now = new Date();
    const todo: Todo = {
      id: this.nextId++,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now,
      priority: input.priority,
      category: input.category?.trim() || undefined,
      dueDate: input.dueDate,
    };
    this._todos.set([...this._todos(), todo]);
    this.persistTodos();
    this.logCrud('CREATE', todo);
    return todo;
  }

  update(id: number, patch: TodoUpdateInput): Todo | undefined {
    let updated: Todo | undefined;
    const nextTodos = this._todos().map((t) => {
      if (t.id !== id) {
        return t;
      }
      const now = new Date();
      updated = {
        ...t,
        ...patch,
        title: patch.title !== undefined ? patch.title.trim() : t.title,
        description:
          patch.description !== undefined ? patch.description.trim() || undefined : t.description,
        category: patch.category !== undefined ? patch.category.trim() || undefined : t.category,
        updatedAt: now,
      };
      return updated;
    });

    if (updated) {
      this._todos.set(nextTodos);
      this.persistTodos();
    }

    this.logCrud('UPDATE', { id, patch, todo: updated });
    return updated;
  }

  remove(id: number): boolean {
    const before = this._todos().length;
    const nextTodos = this._todos().filter((t) => t.id !== id);
    const removed = nextTodos.length < before;
    if (removed) {
      this._todos.set(nextTodos);
      this.persistTodos();
    }
    this.logCrud('DELETE', { id, removed });
    return removed;
  }

  toggleCompleted(id: number): Todo | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }
    return this.update(id, { completed: !current.completed });
  }

  setCompleted(id: number, completed: boolean): Todo | undefined {
    return this.update(id, { completed });
  }

  removeCompleted(): number {
    const completed = this._todos().filter((t) => t.completed);
    if (completed.length > 0) {
      this._todos.set(this._todos().filter((t) => !t.completed));
      this.persistTodos();
    }
    this.logCrud('DELETE_COMPLETED', { removedCount: completed.length, removedTodos: completed });
    return completed.length;
  }

  clear(): void {
    this._todos.set([]);
    this.nextId = 1;
    this.persistTodos();
  }

  /** Replace all todos (e.g. after loading from API/localStorage); recomputes next id. */
  replaceAll(todos: Todo[]): void {
    this.hydrateTodos(todos);
    this.persistTodos();
    this.logCrud('REPLACE_ALL', { todos });
  }

  /** Seed localStorage-backed store for demos/tests. */
  seedSample(): void {
    if (this._todos().length > 0) {
      return;
    }
    this.seedInitialTodos();
    this.persistTodos();
  }

  private seedInitialTodos(): void {
    if (this._todos().length > 0) {
      return;
    }

    const now = new Date();
    const initialTodos: Todo[] = [
      {
        id: this.nextId++,
        title: 'Review Angular routing',
        description: 'Confirm home, detail, and creation routes are easy to navigate.',
        completed: false,
        createdAt: now,
        updatedAt: now,
        priority: TodoPriority.HIGH,
        category: 'Angular',
        dueDate: this.addDays(now, 1),
      },
      {
        id: this.nextId++,
        title: 'Add search and filters',
        description: 'Search by title and content, then filter by priority and completion.',
        completed: true,
        createdAt: now,
        updatedAt: now,
        priority: TodoPriority.MEDIUM,
        category: 'UI',
      },
      {
        id: this.nextId++,
        title: 'Prepare service integration',
        description: 'Keep the TodoService API ready for a future backend connection.',
        completed: false,
        createdAt: now,
        updatedAt: now,
        priority: TodoPriority.MEDIUM,
        category: 'Architecture',
        dueDate: this.addDays(now, 3),
      },
      {
        id: this.nextId++,
        title: 'Polish responsive layout',
        description: 'Check the list and forms on mobile and desktop widths.',
        completed: false,
        createdAt: now,
        updatedAt: now,
        priority: TodoPriority.LOW,
        category: 'Design',
      },
      {
        id: this.nextId++,
        title: 'Validate CRUD logs',
        description: 'Create, edit, and delete a todo while checking the browser console.',
        completed: false,
        createdAt: now,
        updatedAt: now,
        priority: TodoPriority.HIGH,
        category: 'Debug',
        dueDate: this.addDays(now, 2),
      },
    ];

    this._todos.set(initialTodos);
  }

  private hydrateTodos(todos: Todo[]): void {
    this._todos.set([...todos]);
    this.nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
  }

  private readStoredTodos(): Todo[] | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    const rawTodos = storage.getItem(TODO_STORAGE_KEY);
    if (rawTodos === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawTodos) as StoredTodo[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((todo) => this.deserializeTodo(todo));
    } catch {
      return null;
    }
  }

  private persistTodos(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify(this._todos().map((todo) => this.serializeTodo(todo))),
    );
  }

  private serializeTodo(todo: Todo): StoredTodo {
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      dueDate: todo.dueDate?.toISOString(),
    };
  }

  private deserializeTodo(todo: StoredTodo): Todo {
    return {
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
    };
  }

  private getStorage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private logCrud(operation: string, payload: unknown): void {
    console.log('[TodoService]', {
      operation,
      payload,
      todos: this._todos().map((todo) => ({ ...todo })),
    });
  }
}
