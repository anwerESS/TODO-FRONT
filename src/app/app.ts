import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TodoService } from './core/services/todo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly pageTitle = 'Todo App';

  constructor(private todoService: TodoService) {
    console.log(this.todoService.getAll());
  }
}
