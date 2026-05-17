import { Pipe, PipeTransform } from '@angular/core';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Pipe({
  name: 'todoDueLabel',
})
export class TodoDueLabelPipe implements PipeTransform {
  transform(value: Date | string | null | undefined, now: Date = new Date()): string {
    const dueDate = this.toDate(value);

    if (!dueDate) {
      return 'No due date';
    }

    const daysUntilDue = this.daysBetween(now, dueDate);

    if (daysUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
    }

    if (daysUntilDue === 0) {
      return 'Due today';
    }

    if (daysUntilDue === 1) {
      return 'Due tomorrow';
    }

    if (daysUntilDue <= 6) {
      return `Due in ${daysUntilDue} days`;
    }

    return `Due ${this.formatDate(dueDate, now)}`;
  }

  private toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.round((this.startOfDay(end).getTime() - this.startOfDay(start).getTime()) / DAY_IN_MS);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatDate(date: Date, now: Date): string {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    }).format(date);
  }
}
