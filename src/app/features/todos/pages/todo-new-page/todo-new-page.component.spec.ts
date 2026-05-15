import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { TodoService } from '../../../../core/services/todo.service';
import { TodoNewPageComponent } from './todo-new-page.component';

describe('TodoNewPageComponent', () => {
  let fixture: ComponentFixture<TodoNewPageComponent>;
  let component: TodoNewPageComponent;
  let todoService: jasmine.SpyObj<TodoService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    todoService = jasmine.createSpyObj<TodoService>('TodoService', ['add']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    todoService.add.and.returnValue({
      id: 42,
      title: 'Created todo',
      completed: false,
      createdAt: new Date('2025-06-01T10:30:00.000Z'),
      updatedAt: new Date('2025-06-01T10:30:00.000Z'),
      priority: TodoPriority.MEDIUM,
    });
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TodoNewPageComponent],
      providers: [
        { provide: TodoService, useValue: todoService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            fragment: of(null),
            snapshot: {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoNewPageComponent);
    component = fixture.componentInstance;
  });

  it('creates a todo and navigates to its detail page', () => {
    const input = {
      title: 'Created todo',
      priority: TodoPriority.MEDIUM,
    };

    component.createTodo(input);

    expect(todoService.add).toHaveBeenCalledOnceWith(input);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/', 42]);
  });
});
