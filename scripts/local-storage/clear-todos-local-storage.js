(function clearTodosLocalStorage() {
  const storageKey = 'todo-front.todos.v1';
  const storage = getBrowserLocalStorage();
  const previousTodos = storage.getItem(storageKey);

  storage.removeItem(storageKey);
  console.log('[localStorage todo script]', {
    operation: 'CLEAR_TODOS',
    storageKey,
    removed: previousTodos !== null,
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
