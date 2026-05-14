import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { TodoService } from '../../../../core/services/todo.service';
import { TodoCreateComponent } from './todo-create.component';

const FIXED_TODAY = new Date('2026-05-14T10:00:00.000Z');

describe('TodoCreateComponent', () => {
  let fixture: ComponentFixture<TodoCreateComponent>;
  let component: TodoCreateComponent;
  let service: TodoService;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(FIXED_TODAY);
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [TodoCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoCreateComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TodoService);
    service.clear();
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('creates the form with the expected defaults', () => {
    expect(component.form.getRawValue()).toEqual({
      title: '',
      description: '',
      priority: TodoPriority.MEDIUM,
      category: '',
      dueDate: '',
      completed: false,
    });
  });

  it('rejects blank titles and does not add a todo', () => {
    component.form.patchValue({ title: '   ' });

    component.submit();

    expect(component.form.controls.title.hasError('blank')).toBeTrue();
    expect(component.form.controls.title.touched).toBeTrue();
    expect(service.getAll()).toEqual([]);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('rejects due dates in the past', () => {
    component.form.patchValue({
      title: 'Schedule review',
      dueDate: '2026-05-13',
    });

    component.submit();

    expect(component.form.controls.dueDate.hasError('pastDate')).toBeTrue();
    expect(service.getAll()).toEqual([]);
  });

  it('rejects values outside the TodoPriority enum', () => {
    component.form.patchValue({
      title: 'Invalid priority',
      priority: 'URGENT' as TodoPriority,
    });

    component.submit();

    expect(component.form.controls.priority.hasError('invalidPriority')).toBeTrue();
    expect(service.getAll()).toEqual([]);
  });

  it('adds a todo through TodoService, logs the list, and resets the form', () => {
    component.form.setValue({
      title: '  Write tests  ',
      description: '  cover form behavior  ',
      priority: TodoPriority.HIGH,
      category: '  learning  ',
      dueDate: '2026-05-20',
      completed: true,
    });

    component.submit();

    const todos = service.getAll();
    expect(todos.length).toBe(1);
    expect(todos[0]).toEqual(
      jasmine.objectContaining({
        id: 1,
        title: 'Write tests',
        description: 'cover form behavior',
        priority: TodoPriority.HIGH,
        category: 'learning',
        dueDate: new Date('2026-05-20T00:00:00'),
        completed: true,
      }),
    );
    expect(console.log).toHaveBeenCalledOnceWith(todos);
    expect(component.form.getRawValue()).toEqual({
      title: '',
      description: '',
      priority: TodoPriority.MEDIUM,
      category: '',
      dueDate: '',
      completed: false,
    });
  });
});
