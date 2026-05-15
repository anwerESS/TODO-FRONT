import { TestBed } from '@angular/core/testing';

import { Todo } from '../models/todo.model';
import { TodoPriority } from '../models/todo-priority.enum';
import { TODO_STORAGE_KEY, TodoCreateInput, TodoService } from './todo.service';

/** Fixed instant for deterministic `createdAt` / `updatedAt` assertions. */
const FIXED_NOW = new Date('2025-06-01T10:30:00.000Z');

function minimalCreate(overrides?: Partial<TodoCreateInput>): TodoCreateInput {
  return {
    title: 'Default title',
    priority: TodoPriority.MEDIUM,
    ...overrides,
  };
}

function sampleTodo(overrides: Partial<Todo> & Pick<Todo, 'id'>): Todo {
  const base: Todo = {
    id: overrides.id,
    title: 'T',
    completed: false,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    priority: TodoPriority.LOW,
  };
  return { ...base, ...overrides };
}

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length(): number {
      return Object.keys(store).length;
    },
    clear(): void {
      store = {};
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
  };
}

describe('TodoService', () => {
  let service: TodoService;
  let consoleLogSpy: jasmine.Spy;
  let localStorageMock: Storage;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(FIXED_NOW);
    consoleLogSpy = spyOn(console, 'log');
    localStorageMock = createLocalStorageMock();
    spyOnProperty(window, 'localStorage', 'get').and.returnValue(localStorageMock);
    localStorageMock.clear();

    await TestBed.configureTestingModule({}).compileComponents();
    service = TestBed.inject(TodoService);
    service.clear();
    consoleLogSpy.calls.reset();
  });

  afterEach(() => {
    localStorageMock.clear();
    jasmine.clock().uninstall();
  });

  describe('initial state', () => {
    it('starts empty when there are no stored todos', () => {
      localStorageMock.removeItem(TODO_STORAGE_KEY);
      const emptyService = new TodoService();

      expect(emptyService.todos().length).toBe(0);
      expect(emptyService.add(minimalCreate()).id).toBe(1);
    });

    it('can seed five sample todos explicitly', () => {
      service.seedSample();

      expect(service.todos().length).toBe(5);
      expect(service.add(minimalCreate()).id).toBe(6);
    });

    it('exposes an empty list and zero counts', () => {
      expect(service.todos()).toEqual([]);
      expect(service.count()).toBe(0);
      expect(service.activeCount()).toBe(0);
      expect(service.completedCount()).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    it('loads todos from localStorage and restores date fields', () => {
      localStorage.setItem(
        TODO_STORAGE_KEY,
        JSON.stringify([
          {
            id: 12,
            title: 'Stored todo',
            description: 'Persisted description',
            completed: false,
            createdAt: '2025-05-01T08:00:00.000Z',
            updatedAt: '2025-05-02T09:00:00.000Z',
            priority: TodoPriority.HIGH,
            category: 'Storage',
            dueDate: '2025-05-10T00:00:00.000Z',
          },
        ]),
      );

      const storedService = new TodoService();
      const loaded = storedService.getById(12);

      expect(loaded?.title).toBe('Stored todo');
      expect(loaded?.createdAt).toEqual(new Date('2025-05-01T08:00:00.000Z'));
      expect(loaded?.updatedAt).toEqual(new Date('2025-05-02T09:00:00.000Z'));
      expect(loaded?.dueDate).toEqual(new Date('2025-05-10T00:00:00.000Z'));
      expect(storedService.add(minimalCreate()).id).toBe(13);
    });

    it('persists created todos to localStorage', () => {
      service.add(
        minimalCreate({
          title: 'Persist me',
          dueDate: new Date('2025-12-24T00:00:00.000Z'),
        }),
      );

      const stored = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY) ?? '[]') as Array<{
        title: string;
        dueDate?: string;
      }>;

      expect(stored).toEqual([
        jasmine.objectContaining({
          title: 'Persist me',
          dueDate: '2025-12-24T00:00:00.000Z',
        }),
      ]);
    });

    it('persists updates and removals to localStorage', () => {
      const created = service.add(minimalCreate({ title: 'Before' }));

      service.update(created.id, { title: 'After' });
      expect(localStorage.getItem(TODO_STORAGE_KEY)).toContain('"title":"After"');

      service.remove(created.id);
      expect(localStorage.getItem(TODO_STORAGE_KEY)).toBe('[]');
    });
  });

  describe('add', () => {
    it('appends a todo with trimmed title and sequential ids', () => {
      const first = service.add(minimalCreate({ title: '  First  ' }));
      const second = service.add(minimalCreate({ title: 'Second', priority: TodoPriority.HIGH }));

      expect(first.id).toBe(1);
      expect(first.title).toBe('First');
      expect(second.id).toBe(2);
      expect(service.todos().length).toBe(2);
      expect(service.count()).toBe(2);
    });

    it('logs the create operation with payload and the updated list', () => {
      const todo = service.add(minimalCreate({ title: 'Logged create' }));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TodoService]',
        jasmine.objectContaining({
          operation: 'CREATE',
          payload: todo,
          todos: [jasmine.objectContaining({ title: 'Logged create' })],
        }),
      );
    });

    it('sets description to undefined when omitted, empty, or whitespace-only', () => {
      expect(service.add(minimalCreate()).description).toBeUndefined();
      expect(service.add(minimalCreate({ description: '' })).description).toBeUndefined();
      expect(service.add(minimalCreate({ description: '   ' })).description).toBeUndefined();
    });

    it('preserves non-empty trimmed description', () => {
      const todo = service.add(minimalCreate({ description: '  details  ' }));
      expect(todo.description).toBe('details');
    });

    it('defaults completed to false when omitted', () => {
      expect(service.add(minimalCreate()).completed).toBe(false);
    });

    it('respects explicit completed true', () => {
      expect(service.add(minimalCreate({ completed: true })).completed).toBe(true);
    });

    it('normalizes category like description', () => {
      expect(service.add(minimalCreate({ category: '  work  ' })).category).toBe('work');
      expect(service.add(minimalCreate({ category: '' })).category).toBeUndefined();
    });

    it('passes dueDate through unchanged', () => {
      const due = new Date('2025-12-24T00:00:00.000Z');
      expect(service.add(minimalCreate({ dueDate: due })).dueDate).toEqual(due);
    });

    it('sets createdAt and updatedAt to the same instant on create', () => {
      const todo = service.add(minimalCreate());
      expect(todo.createdAt).toEqual(FIXED_NOW);
      expect(todo.updatedAt).toEqual(FIXED_NOW);
    });

    it('updates active and completed counts', () => {
      service.add(minimalCreate());
      service.add(minimalCreate({ completed: true }));

      expect(service.activeCount()).toBe(1);
      expect(service.completedCount()).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns the todo when id exists', () => {
      const created = service.add(minimalCreate({ title: 'Find me' }));
      expect(service.getById(created.id)?.title).toBe('Find me');
    });

    it('returns undefined when id is missing', () => {
      expect(service.getById(999)).toBeUndefined();
    });

    it('logs the read-one operation with payload and the current list', () => {
      const created = service.add(minimalCreate({ title: 'Find me' }));
      consoleLogSpy.calls.reset();

      service.getById(created.id);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TodoService]',
        jasmine.objectContaining({
          operation: 'READ_ONE',
          payload: jasmine.objectContaining({
            id: created.id,
            todo: jasmine.objectContaining({ title: 'Find me' }),
          }),
          todos: [jasmine.objectContaining({ title: 'Find me' })],
        }),
      );
    });
  });

  describe('getAll', () => {
    it('returns all todos as a copy of the list', () => {
      const first = service.add(minimalCreate({ title: 'First' }));
      const second = service.add(minimalCreate({ title: 'Second' }));

      const todos = service.getAll();

      expect(todos).toEqual([first, second]);
      expect(todos).not.toBe(service.todos());
    });

    it('logs the read-all operation with payload and the current list', () => {
      service.add(minimalCreate({ title: 'First' }));
      service.add(minimalCreate({ title: 'Second' }));
      consoleLogSpy.calls.reset();

      service.getAll();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TodoService]',
        jasmine.objectContaining({
          operation: 'READ_ALL',
          payload: {},
          todos: [
            jasmine.objectContaining({ title: 'First' }),
            jasmine.objectContaining({ title: 'Second' }),
          ],
        }),
      );
    });
  });

  describe('update', () => {
    it('merges patch, trims string fields, and bumps updatedAt', () => {
      const created = service.add(
        minimalCreate({ title: 'Old', description: 'desc', category: 'c' }),
      );

      jasmine.clock().mockDate(new Date('2025-06-02T12:00:00.000Z'));

      const updated = service.update(created.id, {
        title: '  New title  ',
        description: '',
        completed: true,
      });

      expect(updated?.title).toBe('New title');
      expect(updated?.description).toBeUndefined();
      expect(updated?.completed).toBe(true);
      expect(updated?.updatedAt).toEqual(new Date('2025-06-02T12:00:00.000Z'));
      expect(updated?.createdAt).toEqual(FIXED_NOW);
    });

    it('leaves omitted fields unchanged', () => {
      const created = service.add(minimalCreate({ title: 'Stable' }));
      const updated = service.update(created.id, { completed: true });
      expect(updated?.title).toBe('Stable');
    });

    it('returns undefined when id does not exist', () => {
      expect(service.update(42, { title: 'Nope' })).toBeUndefined();
    });

    it('logs the update operation with payload and the updated list', () => {
      const created = service.add(minimalCreate({ title: 'Before update' }));
      consoleLogSpy.calls.reset();

      service.update(created.id, { title: 'After update' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TodoService]',
        jasmine.objectContaining({
          operation: 'UPDATE',
          payload: jasmine.objectContaining({
            id: created.id,
            patch: jasmine.objectContaining({ title: 'After update' }),
            todo: jasmine.objectContaining({ title: 'After update' }),
          }),
          todos: [jasmine.objectContaining({ title: 'After update' })],
        }),
      );
    });
  });

  describe('remove', () => {
    it('removes by id and returns true when something was removed', () => {
      const { id } = service.add(minimalCreate());
      expect(service.remove(id)).toBe(true);
      expect(service.todos().length).toBe(0);
    });

    it('returns false when id is unknown', () => {
      expect(service.remove(1)).toBe(false);
    });

    it('logs the delete operation with payload and the updated list', () => {
      const { id } = service.add(minimalCreate({ title: 'Remove me' }));
      consoleLogSpy.calls.reset();

      service.remove(id);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TodoService]',
        jasmine.objectContaining({
          operation: 'DELETE',
          payload: { id, removed: true },
          todos: [],
        }),
      );
    });
  });

  describe('toggleCompleted', () => {
    it('flips completed and returns updated todo', () => {
      const { id } = service.add(minimalCreate({ completed: false }));
      const toggled = service.toggleCompleted(id);
      expect(toggled?.completed).toBe(true);
      expect(service.getById(id)?.completed).toBe(true);
    });

    it('returns undefined when id is missing', () => {
      expect(service.toggleCompleted(99)).toBeUndefined();
    });
  });

  describe('setCompleted', () => {
    it('sets completed to the given value', () => {
      const { id } = service.add(minimalCreate({ completed: true }));
      expect(service.setCompleted(id, false)?.completed).toBe(false);
    });
  });

  describe('removeCompleted', () => {
    it('removes all completed todos and returns how many were removed', () => {
      service.add(minimalCreate({ completed: true }));
      service.add(minimalCreate({ completed: true }));
      service.add(minimalCreate({ completed: false }));

      expect(service.removeCompleted()).toBe(2);
      expect(service.todos().length).toBe(1);
      expect(service.getById(3)?.completed).toBe(false);
    });
  });

  describe('clear', () => {
    it('empties the list and resets id generation', () => {
      service.add(minimalCreate());
      service.add(minimalCreate());
      service.clear();

      expect(service.todos()).toEqual([]);
      expect(service.add(minimalCreate()).id).toBe(1);
    });
  });

  describe('replaceAll', () => {
    it('replaces the store and sets nextId from max existing id + 1', () => {
      service.add(minimalCreate());
      const batch: Todo[] = [
        sampleTodo({ id: 5, title: 'A' }),
        sampleTodo({ id: 10, title: 'B' }),
      ];
      service.replaceAll(batch);

      expect(service.todos().length).toBe(2);
      expect(service.getById(10)?.title).toBe('B');

      const next = service.add(minimalCreate({ title: 'New' }));
      expect(next.id).toBe(11);
    });

    it('resets nextId to 1 when the replacement list is empty', () => {
      service.add(minimalCreate());
      service.replaceAll([]);

      expect(service.add(minimalCreate()).id).toBe(1);
    });
  });

  describe('seedSample', () => {
    it('adds sample todos only when the store is empty', () => {
      service.seedSample();
      expect(service.todos().length).toBe(5);

      const beforeTitles = service.todos().map((t) => t.title);
      service.seedSample();
      expect(service.todos().map((t) => t.title)).toEqual(beforeTitles);
    });

    it('does nothing when todos already exist', () => {
      service.add(minimalCreate({ title: 'Existing' }));
      service.seedSample();
      expect(service.todos().length).toBe(1);
    });
  });
});
