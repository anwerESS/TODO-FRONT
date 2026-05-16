import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Todo } from '../models/todo.model';
import { TodoPriority } from '../models/todo-priority.enum';
import { TODO_API_URL, TodoCreateInput, TodoService } from './todo.service';

const API_TODO = {
  id: 12,
  title: 'API todo',
  description: 'Persisted description',
  completed: false,
  createdAt: '2025-05-01T08:00:00.000Z',
  updatedAt: '2025-05-02T09:00:00.000Z',
  priority: TodoPriority.HIGH,
  category: 'API',
  dueDate: '2025-05-10T00:00:00.000Z',
};

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
    createdAt: new Date('2025-06-01T10:30:00.000Z'),
    updatedAt: new Date('2025-06-01T10:30:00.000Z'),
    priority: TodoPriority.LOW,
  };
  return { ...base, ...overrides };
}

describe('TodoService', () => {
  let service: TodoService;
  let http: HttpTestingController;
  let consoleLogSpy: jasmine.Spy;

  beforeEach(async () => {
    consoleLogSpy = spyOn(console, 'log');

    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(TodoService);
    http = TestBed.inject(HttpTestingController);
    consoleLogSpy.calls.reset();
  });

  afterEach(() => {
    http.verify();
  });

  it('loads todos from the API and maps nullable date fields', () => {
    let loaded: Todo[] | undefined;

    service.loadTodos().subscribe((todos) => {
      loaded = todos;
    });

    const request = http.expectOne(TODO_API_URL);
    expect(request.request.method).toBe('GET');
    request.flush([API_TODO, { ...API_TODO, id: 13, dueDate: null, description: null }]);

    expect(loaded?.length).toBe(2);
    expect(loaded?.[0]).toEqual(
      jasmine.objectContaining({
        id: 12,
        createdAt: new Date('2025-05-01T08:00:00.000Z'),
        updatedAt: new Date('2025-05-02T09:00:00.000Z'),
        dueDate: new Date('2025-05-10T00:00:00.000Z'),
      }),
    );
    expect(loaded?.[1].dueDate).toBeUndefined();
    expect(loaded?.[1].description).toBeUndefined();
    expect(service.count()).toBe(2);
    expect(service.activeCount()).toBe(2);
  });

  it('loads one todo from the API and upserts it into the cache', () => {
    service.replaceAll([sampleTodo({ id: 12, title: 'Old title' })]);

    service.loadTodo(12).subscribe();

    const request = http.expectOne(`${TODO_API_URL}/12`);
    expect(request.request.method).toBe('GET');
    request.flush(API_TODO);

    expect(service.getById(12)?.title).toBe('API todo');
    expect(service.todos().length).toBe(1);
  });

  it('posts normalized create payloads and caches the created todo', () => {
    const dueDate = new Date('2025-12-24T00:00:00.000Z');
    let created: Todo | undefined;

    service
      .add(
        minimalCreate({
          title: '  Persist me  ',
          description: '  Details  ',
          category: '  Work  ',
          completed: true,
          dueDate,
        }),
      )
      .subscribe((todo) => {
        created = todo;
      });

    const request = http.expectOne(TODO_API_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Persist me',
      description: 'Details',
      priority: TodoPriority.MEDIUM,
      category: 'Work',
      completed: true,
      dueDate: dueDate.toISOString(),
    });
    request.flush({ ...API_TODO, title: 'Persist me', completed: true });

    expect(created?.title).toBe('Persist me');
    expect(service.getById(12)?.title).toBe('Persist me');
  });

  it('patches normalized update payloads and caches the response', () => {
    service.replaceAll([sampleTodo({ id: 12, title: 'Before' })]);

    service
      .update(12, {
        title: '  After  ',
        description: '',
        category: '',
        dueDate: undefined,
      })
      .subscribe();

    const request = http.expectOne(`${TODO_API_URL}/12`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      title: 'After',
      description: null,
      category: null,
      dueDate: null,
    });
    request.flush({ ...API_TODO, title: 'After', description: null, category: null, dueDate: null });

    expect(service.getById(12)?.title).toBe('After');
    expect(service.getById(12)?.description).toBeUndefined();
  });

  it('deletes todos through the API and removes them from the cache', () => {
    service.replaceAll([sampleTodo({ id: 1 }), sampleTodo({ id: 2 })]);
    let removed: boolean | undefined;

    service.remove(2).subscribe((value) => {
      removed = value;
    });

    const request = http.expectOne(`${TODO_API_URL}/2`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ removed: true });

    expect(removed).toBeTrue();
    expect(service.getById(2)).toBeUndefined();
    expect(service.count()).toBe(1);
  });

  it('toggles completion using a PATCH request', () => {
    service.replaceAll([sampleTodo({ id: 7, completed: false })]);

    service.toggleCompleted(7).subscribe();

    const request = http.expectOne(`${TODO_API_URL}/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ completed: true });
    request.flush({ ...API_TODO, id: 7, completed: true });

    expect(service.getById(7)?.completed).toBeTrue();
  });

  it('sets an error when the API request fails', () => {
    let failed = false;

    service.loadTodos().subscribe({
      error: () => {
        failed = true;
      },
    });

    const request = http.expectOne(TODO_API_URL);
    request.flush({ message: 'Nope' }, { status: 500, statusText: 'Server error' });

    expect(failed).toBeTrue();
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('Unable to reach the todo API.');
  });
});
