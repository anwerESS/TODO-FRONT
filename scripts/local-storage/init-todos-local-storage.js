(function initTodosLocalStorage() {
  const storageKey = 'todo-front.todos.v1';
  const storage = getBrowserLocalStorage();
  const now = new Date();

  function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  const todos = [
    {
      id: 1,
      title: 'Review Angular routing',
      description: 'Confirm home, detail, and creation routes are easy to navigate.',
      completed: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      priority: 'HIGH',
      category: 'Angular',
      dueDate: addDays(now, 1).toISOString(),
    },
    {
      id: 2,
      title: 'Add search and filters',
      description: 'Search by title and content, then filter by priority and completion.',
      completed: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      priority: 'MEDIUM',
      category: 'UI',
    },
    {
      id: 3,
      title: 'Prepare service integration',
      description: 'Keep the TodoService API ready for a future backend connection.',
      completed: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      priority: 'MEDIUM',
      category: 'Architecture',
      dueDate: addDays(now, 3).toISOString(),
    },
    {
      id: 4,
      title: 'Polish responsive layout',
      description: 'Check the list and forms on mobile and desktop widths.',
      completed: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      priority: 'LOW',
      category: 'Design',
    },
    {
      id: 5,
      title: 'Validate CRUD logs',
      description: 'Create, edit, and delete a todo while checking the browser console.',
      completed: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      priority: 'HIGH',
      category: 'Debug',
      dueDate: addDays(now, 2).toISOString(),
    },
  ];

  storage.setItem(storageKey, JSON.stringify(todos));
  console.log('[localStorage todo script]', {
    operation: 'INIT_TODOS',
    storageKey,
    todos,
  });

  function getBrowserLocalStorage() {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage;
    }

    throw new Error(
      [
        'localStorage is only available in a browser page.',
        'Open the app at http://localhost:4200, then run this script in DevTools Console.',
        'Running this file with Node cannot modify the browser localStorage for the app origin.',
      ].join(' '),
    );
  }
})();
