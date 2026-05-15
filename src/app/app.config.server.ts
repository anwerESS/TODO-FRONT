import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

// Configuration principale de l'application, partagée avec le navigateur.
import { appConfig } from './app.config';

// Routes spécifiques utilisées par Angular SSR pendant le rendu côté serveur.
import { serverRoutes } from './app.routes.server';

// Configuration propre au serveur.
const serverConfig: ApplicationConfig = {
  // Active le rendu côté serveur et indique à Angular quelles routes SSR utiliser.
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

// Fusionne la configuration commune de l'application avec la configuration serveur.
export const config = mergeApplicationConfig(appConfig, serverConfig);




/*
Ce fichier sert à configurer Angular côté serveur pour le SSR. Il importe la configuration commune de l’application, ajoute provideServerRendering(...) avec les routes serveur, puis fusionne tout avec mergeApplicationConfig(...) pour produire la config finale utilisée au démarrage serveur.
 */
