import { computed, Injectable, signal } from '@angular/core';

import { Todo } from '../models/todo.model';
import { TodoPriority } from '../models/todo-priority.enum';

/** Fields supplied when creating a todo; server-generated fields are omitted. */
export type TodoCreateInput = Pick<Todo, 'title' | 'priority'> &
  Partial<Pick<Todo, 'description' | 'category' | 'dueDate' | 'completed'>>;

/** Partial update; `id` and timestamps are managed by the service. */
export type TodoUpdateInput = Partial<
  Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
>;

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly _todos = signal<Todo[]>([]);
  private nextId = 1;

  constructor() {
    this.seedInitialTodos();
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
    this._todos.update((list) => [...list, todo]);
    this.logCrud('CREATE', todo);
    return todo;
  }

  update(id: number, patch: TodoUpdateInput): Todo | undefined {
    let updated: Todo | undefined;
    this._todos.update((list) =>
      list.map((t) => {
        if (t.id !== id) {
          return t;
        }
        const now = new Date();
        updated = {
          ...t,
          ...patch,
          title: patch.title !== undefined ? patch.title.trim() : t.title,
          description:
            patch.description !== undefined
              ? patch.description.trim() || undefined
              : t.description,
          category:
            patch.category !== undefined ? patch.category.trim() || undefined : t.category,
          updatedAt: now,
        };
        return updated;
      }),
    );

    this.logCrud('UPDATE', { id, patch, todo: updated });
    return updated;
  }

  remove(id: number): boolean {
    const before = this._todos().length;
    this._todos.update((list) => list.filter((t) => t.id !== id));
    const removed = this._todos().length < before;
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
    this._todos.update((list) => list.filter((t) => !t.completed));
    this.logCrud('DELETE_COMPLETED', { removedCount: completed.length, removedTodos: completed });
    return completed.length;
  }

  clear(): void {
    this._todos.set([]);
    this.nextId = 1;
  }

  /** Replace all todos (e.g. after loading from API); recomputes next id. */
  replaceAll(todos: Todo[]): void {
    this._todos.set([...todos]);
    this.nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
    this.logCrud('REPLACE_ALL', { todos });
  }

  /** Seed in-memory store for demos/tests. */
  seedSample(): void {
    if (this._todos().length > 0) {
      return;
    }
    this.seedInitialTodos();
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
