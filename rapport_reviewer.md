# Rapport d'Auto-Review — Brunch Bouaké PMS (Phase 2)

## 1. Fonctionnalité / Exigences
**Statut : Conforme ✅**
* Les 5 pages demandées (Rooms, Housekeeping, Maintenance, Billing, Reports) ont été implémentées avec leurs composants clients (`*Client.tsx`), pages serveurs (`page.tsx`) et CSS modules (`*.module.css`).
* La navigation latérale dynamique (`SidebarNav.tsx`) lit correctement le JWT de l'utilisateur pour afficher les menus pertinents.
* L'Audit de Nuit (Night Audit) est déclenchable via Server Action.

## 2. Sécurité / RBAC & Middleware
**Statut : Conforme ✅ (corrigé post-review)**
* **Correction critique :** Le `ROUTE_PERMISSIONS` de `middleware.ts` a été audité et corrigé. Il faisait initialement appel à des permissions inexistantes dans `seed.ts` (comme `settings.rooms.read`). Le mapping a été strictement calqué sur le référentiel de `seed.ts`.
* La route `/dashboard/rooms` a été retirée du mapping restrictif pour permettre un accès en lecture seule à tout utilisateur authentifié.

> [!NOTE] 
> **Extrait corrigé du mapping `middleware.ts` :**
> ```typescript
> const ROUTE_PERMISSIONS: Record<string, string[]> = {
>   '/dashboard/reservations': ['reservations.create', 'reservations.write', 'reservations.checkin', 'reservations.checkout'],
>   '/dashboard/housekeeping': ['housekeeping.write'],
>   '/dashboard/maintenance': ['maintenance.write'],
>   '/dashboard/guests': ['guests.write'],
>   '/dashboard/billing': ['billing.write', 'billing.close'],
>   '/dashboard/reports': ['reports.read'],
> };
> ```

> [!IMPORTANT]
> **Preuve Brute - Blocage par Middleware :**
> Un test via `curl` a été exécuté en forgeant le cookie JWT d'un utilisateur Réceptionniste essayant d'accéder à `/dashboard/reports` (route protégée par `reports.read`). Le Next.js middleware a correctement intercepté la requête et renvoyé une redirection `307` vers `/dashboard`.
> ```bash
> $ curl -s -I -H "Cookie: access_token=$TOKEN_RECEPTIONIST" http://localhost:3000/dashboard/reports
> HTTP/1.1 307 Temporary Redirect
> location: /dashboard
> ```
> Un test similaire sur l'Admin a retourné un `200 OK`.

## 3. Architecture / Clean Code
**Statut : Conforme ✅**
* Refonte du composant `Button` pour supporter nativement `size="small"`, éliminant les overrides CSS inline illégitimes.
* Agrégation des entités : l'inclusion de la relation `folios` (avec `lines`, `payments`, `invoice`) dans le `reservations.service.ts` permet de regrouper les requêtes pour le BillingClient, évitant le N+1 query problem tout en conservant la Réservation comme *Root Aggregate* du modèle.
* Ajout de `export const dynamic = 'force-dynamic'` dans le layout pour éviter les échecs de pre-rendering statique de Next.js dus aux cookies.

## 4. UI/UX & Design System
**Statut : Conforme ✅**
* Remplacement strict des codes couleurs hardcodés par les variables CSS du Design System (ex: `#FFF` remplacé par `var(--color-text-inverse)`).
* Les CSS modules maintiennent une encapsulation stricte, sans affecter le style global.

## 5. Tests & Validations
**Statut : Conforme ✅**
* Le `npm run build` côté frontend s'exécute sans erreur (Exit 0) sur les 14 routes.

> [!NOTE]
> **Preuve Brute - Accès /dashboard/rooms :**
> Un test d'accès direct sur `/dashboard/rooms` avec le token d'un Réceptionniste :
> ```bash
> $ curl -s -I -H "Cookie: access_token=$TOKEN_RECEPTIONIST" http://localhost:3000/dashboard/rooms
> HTTP/1.1 200 OK
> ```

## 6. Gestion d'erreurs / Edge Cases
**Statut : Conforme ✅**
* L'API backend est saine en cas d'accès non autorisé (renvoie un 403 propre) grâce aux Guards (JwtAuthGuard, PermissionsGuard).
* Les actions serveurs Next.js (`actions.ts`) encadrent les appels API dans des blocs try/catch et renvoient des objets `{ success, error }` pour éviter des crashs de l'interface.
