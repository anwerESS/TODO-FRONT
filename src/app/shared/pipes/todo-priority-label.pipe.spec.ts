import { TodoPriority } from '../../core/models/todo-priority.enum';
import { TodoPriorityLabelPipe } from './todo-priority-label.pipe';

describe('TodoPriorityLabelPipe', () => {
  const pipe = new TodoPriorityLabelPipe();

  it('formats todo priority enum values for display', () => {
    expect(pipe.transform(TodoPriority.LOW)).toBe('Low');
    expect(pipe.transform(TodoPriority.MEDIUM)).toBe('Medium');
    expect(pipe.transform(TodoPriority.HIGH)).toBe('High');
  });

  it('formats filter and empty priority values', () => {
    expect(pipe.transform('ALL')).toBe('All priorities');
    expect(pipe.transform(undefined)).toBe('No priority');
  });
});
