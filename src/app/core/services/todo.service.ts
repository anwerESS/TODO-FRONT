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

  /** Read-only list for templates and other consumers. */
  readonly todos = this._todos.asReadonly();

  readonly count = computed(() => this._todos().length);

  readonly activeCount = computed(() => this._todos().filter((t) => !t.completed).length);

  readonly completedCount = computed(() => this._todos().filter((t) => t.completed).length);

  getAll(): Todo[] {
    return [...this._todos()];
  }

  getById(id: number): Todo | undefined {
    return this._todos().find((t) => t.id === id);
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
    return updated;
  }

  remove(id: number): boolean {
    const before = this._todos().length;
    this._todos.update((list) => list.filter((t) => t.id !== id));
    return this._todos().length < before;
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
  }

  /** Seed in-memory store for demos/tests. */
  seedSample(): void {
    if (this._todos().length > 0) {
      return;
    }
    this.add({
      title: 'Learn Angular signals',
      description: 'Use TodoService.todos() in templates.',
      priority: TodoPriority.HIGH,
    });
    this.add({
      title: 'Wire list UI',
      priority: TodoPriority.MEDIUM,
      completed: true,
    });
  }
}
