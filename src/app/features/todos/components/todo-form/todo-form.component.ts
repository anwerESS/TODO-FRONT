import { Component, effect, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { Todo } from '../../../../core/models/todo.model';
import { TodoCreateInput } from '../../../../core/services/todo.service';

const nonBlank: ValidatorFn = (control: AbstractControl<string | null>): ValidationErrors | null => {
  const value = control.value;
  return value === null || value.trim().length > 0 ? null : { blank: true };
};

const futureOrTodayDate: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  const dueDate = new Date(`${control.value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate >= today ? null : { pastDate: true };
};

const priorityValue: ValidatorFn = (
  control: AbstractControl<TodoPriority | null>,
): ValidationErrors | null =>
  control.value && Object.values(TodoPriority).includes(control.value)
    ? null
    : { invalidPriority: true };

@Component({
  selector: 'app-todo-form',
  imports: [ReactiveFormsModule],
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.scss',
})
export class TodoFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly todo = input<Todo | null>(null);
  readonly submitLabel = input('Save todo');
  readonly submitted = output<TodoCreateInput>();

  readonly priorities = Object.values(TodoPriority);

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, nonBlank, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    priority: [TodoPriority.MEDIUM, [Validators.required, priorityValue]],
    category: ['', [Validators.maxLength(60)]],
    dueDate: ['', [futureOrTodayDate]],
    completed: [false],
  });

  private readonly syncFormWithTodo = effect(() => {
    this.setFormValue(this.todo());
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      title: value.title,
      description: value.description || undefined,
      priority: value.priority,
      category: value.category || undefined,
      dueDate: value.dueDate ? new Date(`${value.dueDate}T00:00:00`) : undefined,
      completed: value.completed,
    });
  }

  hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(error) && (control.dirty || control.touched);
  }

  private setFormValue(todo: Todo | null): void {
    this.form.reset(
      {
        title: todo?.title ?? '',
        description: todo?.description ?? '',
        priority: todo?.priority ?? TodoPriority.MEDIUM,
        category: todo?.category ?? '',
        dueDate: this.toDateInputValue(todo?.dueDate),
        completed: todo?.completed ?? false,
      },
      { emitEvent: false },
    );
  }

  private toDateInputValue(date?: Date): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
