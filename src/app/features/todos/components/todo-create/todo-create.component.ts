import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { TodoCreateInput, TodoService } from '../../../../core/services/todo.service';

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
  selector: 'app-todo-create',
  imports: [ReactiveFormsModule],
  templateUrl: './todo-create.component.html',
  styleUrl: './todo-create.component.scss',
})
export class TodoCreateComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly todoService = inject(TodoService);

  readonly priorities = Object.values(TodoPriority);

  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, nonBlank, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    priority: [TodoPriority.MEDIUM, [Validators.required, priorityValue]],
    category: ['', [Validators.maxLength(60)]],
    dueDate: ['', [futureOrTodayDate]],
    completed: [false],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: TodoCreateInput = {
      title: value.title,
      description: value.description || undefined,
      priority: value.priority,
      category: value.category || undefined,
      dueDate: value.dueDate ? new Date(`${value.dueDate}T00:00:00`) : undefined,
      completed: value.completed,
    };

    this.todoService.add(input);
    console.log(this.todoService.getAll());

    this.form.reset({
      title: '',
      description: '',
      priority: TodoPriority.MEDIUM,
      category: '',
      dueDate: '',
      completed: false,
    });
  }

  hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return control.hasError(error) && (control.dirty || control.touched);
  }
}
