import { Routes } from '@angular/router';

import { authChildGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Login',
  },
  {
    path: '',
    canActivateChild: [authChildGuard],
    children: [
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
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
