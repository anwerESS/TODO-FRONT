import { TodoPriority } from "./todo-priority.enum";

export interface Todo {
  id: number;
  title: string;
  description?: string;

  completed: boolean;

  createdAt: Date;
  updatedAt: Date;

  priority: TodoPriority;

  category?: string;

  dueDate?: Date;
}