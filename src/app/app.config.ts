import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Ajoute les écouteurs globaux d’erreurs du navigateur pour remonter les erreurs non capturées Angular.
    provideBrowserGlobalErrorListeners(),
    // Configure le routeur Angular avec la liste des routes de l’application.
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    // Active l’hydratation côté client après le rendu serveur, avec rejeu des événements utilisateur capturés avant la fin de l’hydratation.
    provideClientHydration(withEventReplay()),
  ],
};
