# Brunch Bouaké PMS - Frontend

Application web pour la gestion hôtelière construite avec **Next.js (App Router)**.

## Sécurité et RBAC (Role-Based Access Control)

Le frontend implémente une vérification stricte des permissions en se basant sur le JWT.

1. **Middleware UX (`src/middleware.ts`)** : 
   - Le middleware décode et vérifie la signature cryptographique du JWT (via la librairie `jose`).
   - Il extrait la liste des `permissions` contenue dans le payload du token (insérée par le backend lors du login).
   - Il vérifie si l'utilisateur possède la permission requise pour accéder à la route (ex: `/dashboard/billing` nécessite `billing.read`).
   - **IMPORTANT** : Ce middleware agit uniquement comme une **couche UX** (User Experience) pour bloquer l'accès visuel et rediriger l'utilisateur. La véritable barrière de sécurité reste le backend (`PermissionsGuard`) qui vérifie systématiquement les droits en temps réel lors de chaque requête API.

2. **Synchronisation du `JWT_SECRET`** :
   - Le middleware doit vérifier le token de manière autonome. Il nécessite donc le même `JWT_SECRET` que celui utilisé par le backend.
   - **ATTENTION** : Le `JWT_SECRET` défini dans `apps/frontend/.env.local` est dupliqué depuis l'environnement du backend (ou `packages/database`). Il doit impérativement provenir d'une seule et même source de vérité en production pour éviter toute désynchronisation silencieuse (ex: via un gestionnaire de secrets ou des variables injectées par CI/CD).
