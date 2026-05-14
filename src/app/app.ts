import { Component } from '@angular/core';
import { TodoCreateComponent } from './features/todos/components/todo-create/todo-create.component';

@Component({
  selector: 'app-root',
  imports: [TodoCreateComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly pageTitle = 'Todo App';
}
