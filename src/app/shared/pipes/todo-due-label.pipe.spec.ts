import { TodoDueLabelPipe } from './todo-due-label.pipe';

describe('TodoDueLabelPipe', () => {
  const pipe = new TodoDueLabelPipe();
  const now = new Date('2025-06-01T10:30:00');

  it('formats empty due dates', () => {
    expect(pipe.transform(undefined, now)).toBe('No due date');
  });

  it('formats relative due dates', () => {
    expect(pipe.transform(new Date('2025-05-31T23:59:00'), now)).toBe('Overdue by 1 day');
    expect(pipe.transform(new Date('2025-06-01T23:59:00'), now)).toBe('Due today');
    expect(pipe.transform(new Date('2025-06-02T00:00:00'), now)).toBe('Due tomorrow');
    expect(pipe.transform(new Date('2025-06-04T00:00:00'), now)).toBe('Due in 3 days');
  });
});
