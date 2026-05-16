import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { Todo } from '../../../../core/models/todo.model';
import { TodoCreateInput, TodoService } from '../../../../core/services/todo.service';
import { TodoDetailPageComponent } from './todo-detail-page.component';

const EXISTING_TODO: Todo = {
  id: 3,
  title: 'Existing todo',
  completed: false,
  createdAt: new Date('2025-06-01T10:30:00.000Z'),
  updatedAt: new Date('2025-06-01T10:30:00.000Z'),
  priority: TodoPriority.LOW,
};

describe('TodoDetailPageComponent', () => {
  let fixture: ComponentFixture<TodoDetailPageComponent>;
  let component: TodoDetailPageComponent;
  let todoService: jasmine.SpyObj<TodoService>;
  let router: jasmine.SpyObj<Router>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: '3' }));
    todoService = jasmine.createSpyObj<TodoService>(
      'TodoService',
      ['loadTodo', 'getById', 'update', 'remove'],
      {
        loading: signal(false).asReadonly(),
        error: signal<string | null>(null).asReadonly(),
      },
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    todoService.loadTodo.and.returnValue(of(EXISTING_TODO));
    todoService.getById.and.callFake((id: number) => (id === 3 ? EXISTING_TODO : undefined));
    todoService.update.and.returnValue(of(EXISTING_TODO));
    todoService.remove.and.returnValue(of(true));
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TodoDetailPageComponent],
      providers: [
        { provide: TodoService, useValue: todoService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoDetailPageComponent);
    component = fixture.componentInstance;
  });

  it('loads the todo from the current route id', () => {
    expect(component.todo()).toBe(EXISTING_TODO);
    expect(todoService.loadTodo).toHaveBeenCalledWith(3);
    expect(todoService.getById).toHaveBeenCalledWith(3);
  });

  it('updates the route todo and marks the page as saved', () => {
    const input: TodoCreateInput = {
      title: 'Updated todo',
      priority: TodoPriority.HIGH,
    };

    component.updateTodo(input);

    expect(todoService.update).toHaveBeenCalledOnceWith(3, input);
    expect(component.saved()).toBeTrue();
  });

  it('ignores updates when the route id is invalid', () => {
    paramMap$.next(convertToParamMap({ id: 'not-a-number' }));

    component.updateTodo({ title: 'Ignored', priority: TodoPriority.MEDIUM });

    expect(todoService.update).not.toHaveBeenCalled();
    expect(component.saved()).toBeFalse();
  });

  it('removes the route todo and navigates back to the list', () => {
    component.deleteTodo();

    expect(todoService.remove).toHaveBeenCalledOnceWith(3);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
  });
});
