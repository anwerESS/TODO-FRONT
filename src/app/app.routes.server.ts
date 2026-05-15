import { RenderMode, ServerRoute } from '@angular/ssr';

// Configuration des routes utilisee par Angular SSR.
// Elle complete les routes Angular classiques en indiquant comment chaque URL
// doit etre rendue: a l'avance au build ou a la demande par le serveur.
export const serverRoutes: ServerRoute[] = [
  {
    // Page d'accueil: correspond a l'URL "/".
    // Prerender = Angular genere une page HTML statique pendant le build.
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    // Page "/new".
    // Elle est aussi pre-generee, car son contenu ne depend pas d'un parametre.
    path: 'new',
    renderMode: RenderMode.Prerender,
  },
  {
    // Page dynamique, par exemple "/1" ou "/todo-42".
    // Server = Angular rend la page au moment de la requete,
    // utile quand le contenu depend de l'id present dans l'URL.
    path: ':id',
    renderMode: RenderMode.Server,
  },
  {
    // Route de secours: capture toutes les URL non declarees plus haut.
    // Ici elle est pre-generee pour fournir une reponse statique.
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
