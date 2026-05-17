import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TodoPriority } from '../../core/models/todo-priority.enum';
import { TodoPriorityDirective } from './todo-priority.directive';

@Component({
  imports: [TodoPriorityDirective],
  template: `<span class="priority-pill" [appTodoPriority]="priority">Priority</span>`,
})
class TodoPriorityDirectiveHostComponent {
  priority: TodoPriority | 'ALL' | null = TodoPriority.HIGH;
}

describe('TodoPriorityDirective', () => {
  let fixture: ComponentFixture<TodoPriorityDirectiveHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoPriorityDirectiveHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoPriorityDirectiveHostComponent);
    fixture.detectChanges();
  });

  it('sets the priority data attribute and matching class', () => {
    const element = fixture.debugElement.query(By.directive(TodoPriorityDirective)).nativeElement;

    expect(element.dataset.priority).toBe(TodoPriority.HIGH);
    expect(element.classList).toContain('priority-pill--high');
  });

  it('updates classes when the priority changes', () => {
    fixture.componentInstance.priority = TodoPriority.LOW;
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.directive(TodoPriorityDirective)).nativeElement;

    expect(element.dataset.priority).toBe(TodoPriority.LOW);
    expect(element.classList).toContain('priority-pill--low');
    expect(element.classList).not.toContain('priority-pill--high');
  });

  it('clears priority styling for the ALL filter value', () => {
    fixture.componentInstance.priority = 'ALL';
    fixture.detectChanges();

    const element = fixture.debugElement.query(By.directive(TodoPriorityDirective)).nativeElement;

    expect(element.dataset.priority).toBeUndefined();
    expect(element.classList).not.toContain('priority-pill--low');
    expect(element.classList).not.toContain('priority-pill--medium');
    expect(element.classList).not.toContain('priority-pill--high');
  });
});
