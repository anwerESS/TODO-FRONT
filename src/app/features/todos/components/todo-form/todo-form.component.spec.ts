import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { Todo } from '../../../../core/models/todo.model';
import { TodoFormComponent } from './todo-form.component';

const FIXED_NOW = new Date('2025-06-01T10:30:00.000Z');

function todo(overrides?: Partial<Todo>): Todo {
  return {
    id: 7,
    title: 'Existing todo',
    description: 'Existing details',
    completed: true,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    priority: TodoPriority.HIGH,
    category: 'Work',
    dueDate: new Date('2025-06-15T00:00:00.000Z'),
    ...overrides,
  };
}

describe('TodoFormComponent', () => {
  let fixture: ComponentFixture<TodoFormComponent>;
  let component: TodoFormComponent;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(FIXED_NOW);

    await TestBed.configureTestingModule({
      imports: [TodoFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('rejects a blank title and marks controls as touched on submit', () => {
    const emitSpy = spyOn(component.submitted, 'emit');

    component.form.patchValue({ title: '   ' });
    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(component.form.controls.title.hasError('blank')).toBeTrue();
    expect(component.form.controls.title.touched).toBeTrue();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('rejects due dates before today', () => {
    component.form.patchValue({
      title: 'Valid title',
      dueDate: '2025-05-31',
    });

    expect(component.form.controls.dueDate.hasError('pastDate')).toBeTrue();
    expect(component.form.invalid).toBeTrue();
  });

  it('emits a normalized create payload for valid values', () => {
    const emitSpy = spyOn(component.submitted, 'emit');

    component.form.setValue({
      title: 'Prepare release',
      description: '',
      priority: TodoPriority.HIGH,
      category: 'Engineering',
      dueDate: '2025-06-05',
      completed: true,
    });
    component.submit();

    expect(emitSpy).toHaveBeenCalledOnceWith({
      title: 'Prepare release',
      description: undefined,
      priority: TodoPriority.HIGH,
      category: 'Engineering',
      dueDate: new Date('2025-06-05T00:00:00'),
      completed: true,
    });
  });

  it('prefills the form from an existing todo for editing', () => {
    fixture.componentRef.setInput('todo', todo());
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      title: 'Existing todo',
      description: 'Existing details',
      priority: TodoPriority.HIGH,
      category: 'Work',
      dueDate: '2025-06-15',
      completed: true,
    });
  });
});
