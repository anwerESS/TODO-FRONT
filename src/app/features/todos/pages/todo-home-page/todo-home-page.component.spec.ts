import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { Todo } from '../../../../core/models/todo.model';
import { TodoService } from '../../../../core/services/todo.service';
import { TodoHomePageComponent } from './todo-home-page.component';

const NOW = new Date('2025-06-01T10:30:00.000Z');

function todo(overrides: Partial<Todo> & Pick<Todo, 'id' | 'title'>): Todo {
  return {
    completed: false,
    createdAt: NOW,
    updatedAt: NOW,
    priority: TodoPriority.MEDIUM,
    ...overrides,
  };
}

describe('TodoHomePageComponent', () => {
  let fixture: ComponentFixture<TodoHomePageComponent>;
  let component: TodoHomePageComponent;
  let todoService: TodoService;

  beforeEach(async () => {
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [TodoHomePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    todoService = TestBed.inject(TodoService);
    todoService.replaceAll([
      todo({
        id: 1,
        title: 'Write Angular tests',
        description: 'Cover the form and pages',
        priority: TodoPriority.HIGH,
      }),
      todo({
        id: 2,
        title: 'Ship filters',
        completed: true,
        priority: TodoPriority.LOW,
      }),
      todo({
        id: 3,
        title: 'Prepare docs',
        description: 'Testing notes',
        priority: TodoPriority.MEDIUM,
      }),
    ]);

    fixture = TestBed.createComponent(TodoHomePageComponent);
    component = fixture.componentInstance;
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
    expect(todoService.getById(2)).toBeUndefined();

    component.toggleCompleted(1);
    expect(todoService.getById(1)?.completed).toBeTrue();
  });

  it('exposes total, active, and completed counts from the service', () => {
    expect(component.totalCount()).toBe(3);
    expect(component.activeCount()).toBe(2);
    expect(component.completedCount()).toBe(1);
  });
});
