import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'todo-front.theme.v1';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _isDark = signal(this.readInitialTheme());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      const isDark = this._isDark();
      const root = this.document.documentElement;

      root.classList.toggle('app-theme-dark', isDark);
      root.classList.toggle('app-theme-light', !isDark);
      this.persistTheme(isDark);
    });
  }

  setDark(isDark: boolean): void {
    this._isDark.set(isDark);
  }

  toggle(): void {
    this._isDark.update((isDark) => !isDark);
  }

  private readInitialTheme(): boolean {
    const storedTheme = this.getStorage()?.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark') {
      return true;
    }

    if (storedTheme === 'light') {
      return false;
    }

    try {
      return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  }

  private persistTheme(isDark: boolean): void {
    this.getStorage()?.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  private getStorage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }
}
