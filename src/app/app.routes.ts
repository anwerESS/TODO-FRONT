import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/todos/pages/todo-home-page/todo-home-page.component').then(
        (m) => m.TodoHomePageComponent,
      ),
    title: 'Todos',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./features/todos/pages/todo-new-page/todo-new-page.component').then(
        (m) => m.TodoNewPageComponent,
      ),
    title: 'New todo',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./features/todos/pages/todo-detail-page/todo-detail-page.component').then(
        (m) => m.TodoDetailPageComponent,
      ),
    title: 'Todo details',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
