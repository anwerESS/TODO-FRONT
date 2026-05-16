import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { TODO_API_URL, TodoService } from '../../../../core/services/todo.service';
import { TodoHomePageComponent } from './todo-home-page.component';

const NOW = new Date('2025-06-01T10:30:00.000Z');

describe('TodoHomePageComponent', () => {
  let fixture: ComponentFixture<TodoHomePageComponent>;
  let component: TodoHomePageComponent;
  let todoService: TodoService;
  let http: HttpTestingController;

  beforeEach(async () => {
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [TodoHomePageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    todoService = TestBed.inject(TodoService);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(TodoHomePageComponent);
    component = fixture.componentInstance;

    http.expectOne(TODO_API_URL).flush([
      {
        id: 1,
        title: 'Write Angular tests',
        description: 'Cover the form and pages',
        completed: false,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
        priority: TodoPriority.HIGH,
      },
      {
        id: 2,
        title: 'Ship filters',
        description: null,
        completed: true,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
        priority: TodoPriority.LOW,
        category: null,
        dueDate: null,
      },
      {
        id: 3,
        title: 'Prepare docs',
        description: 'Testing notes',
        completed: false,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
        priority: TodoPriority.MEDIUM,
      },
    ]);
  });

  afterEach(() => {
    http.verify();
  });

  it('filters todos by search, priority, and completion', () => {
    component.updateFilters({
      search: 'test',
      priority: TodoPriority.HIGH,
      completion: 'active',
    });

    expect(component.filteredTodos().map((item) => item.id)).toEqual([1]);
  });

  it('delegates delete and toggle actions to the service', () => {
    component.deleteTodo(2);
    http.expectOne(`${TODO_API_URL}/2`).flush({ removed: true });
    expect(todoService.getById(2)).toBeUndefined();

    component.toggleCompleted(1);
    const toggleRequest = http.expectOne(`${TODO_API_URL}/1`);
    expect(toggleRequest.request.method).toBe('PATCH');
    expect(toggleRequest.request.body).toEqual({ completed: true });
    toggleRequest.flush({
      id: 1,
      title: 'Write Angular tests',
      description: 'Cover the form and pages',
      completed: true,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      priority: TodoPriority.HIGH,
    });

    expect(todoService.getById(1)?.completed).toBeTrue();
  });

  it('exposes total, active, and completed counts from the service', () => {
    expect(component.totalCount()).toBe(3);
    expect(component.activeCount()).toBe(2);
    expect(component.completedCount()).toBe(1);
  });
});
