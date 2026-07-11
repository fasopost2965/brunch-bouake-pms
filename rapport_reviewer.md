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
> 
> Un second test a été effectué sur `/dashboard/maintenance` avec le token Réceptionniste (route nécessitant `maintenance.write`) :
> ```bash
> $ curl -s -I -H "Cookie: access_token=$TOKEN_RECEPTIONIST" http://localhost:3000/dashboard/maintenance
> HTTP/1.1 307 Temporary Redirect
> location: /dashboard
> ```

> [!WARNING]
> **Dette Technique Identifiée - Permissions en Lecture :**
> Le mapping actuel confond l'accès en lecture à la page et la permission d'écriture pour les modules Housekeeping, Maintenance, Guests et Billing (ex: une seule permission `housekeeping.write` contrôle les deux). 
> **Action future :** Si un futur rôle nécessite un accès en lecture seule stricte à l'un de ces modules (sans droit d'écriture), il faudra introduire des permissions distinctes `*.read` dans le backend (`seed.ts`) et les refléter dans le middleware. Actuellement non bloquant pour le MVP vu les rôles existants.

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

## 7. Phase 3 : Profils Clients & DTOs
**Statut : Conforme ✅**
* Le composant `GuestDetailClient` a été implémenté avec trois onglets fonctionnels : Général (incluant les KPI de dépenses et nuitées), Documents (avec upload FormData natif), et Réservations (historique).
* Les DTOs du backend (`CreateGuestDto` et `UpdateGuestDto`) utilisent désormais l'annotation `@Transform` pour convertir proprement les chaînes vides `""` provenant des formulaires HTML natifs en `null`, évitant les erreurs Prisma `NaN` ou `Invalid type`.

> [!IMPORTANT]
> **Preuve Brute - Validation DTOs avec chaînes vides :**
> Un test `fetch` direct sur l'API `/guests` a été réalisé avec un payload contenant des champs vides pour `email`, `phone`, et `idType`.
> ```json
> // Payload envoyé
> {
>   "firstName": "Empty",
>   "lastName": "StringTest",
>   "phone": "",
>   "email": "",
>   "idType": "",
>   "idNumber": "",
>   "nationality": "",
>   "notes": ""
> }
> ```
> La réponse de l'API (HTTP 201) démontre la conversion correcte :
> ```json
> // Réponse de l'API
> {
>   "id": 42,
>   "firstName": "Empty",
>   "lastName": "StringTest",
>   "email": null,
>   "phone": null,
>   "idType": null,
>   ...
> }
> ```
>
> **Preuve Brute - RBAC Guest Update :**
> Une tentative de mise à jour d'un client par un réceptionniste sans la permission `guests.write` renvoie correctement un statut `403 Forbidden` bloqué par le `PermissionsGuard` de NestJS. Un administrateur avec la permission réussit avec un `200 OK`. L'UI s'adapte en cachant les formulaires d'édition si la permission fait défaut.

## 8. Injection UI/UX Dynamique (Phase 3.5)
**Statut : Conforme ✅**
Conformément à l'ordre de supervision stricte, les chantiers graphiques ont été intégrés :

* **A. Graphiques KPI Dashboard :** La librairie `recharts` a été intégrée dans le frontend via le nouveau composant client `DashboardChartsClient.tsx`. Un LineChart retrace le Taux d'Occupation sur 30 jours, et un BarChart expose la répartition des revenus par type de chambre.
* **B. Micro-interactions CSS :** Les survol (`:hover`) dans `DashboardLayout.module.css` (Sidebar) et `Card.module.css` bénéficient d'un `transition: all 0.2s ease-in-out` avec ombre portée (`box-shadow`) et `transform: translateY` pour un effet de carte tactile. Des animations Skeleton (`@keyframes skeletonPulse`) ont été ajoutées dans `globals.css` et implémentées sur `GuestDetailClient.tsx`.
* **C. Formulaires Intelligents :** Le `ReservationFormClient.tsx` calcule désormais en temps réel le montant estimé du séjour (`baseRate * nuits`) et désactive le bouton de validation ("Traitement en cours...") lors du clic pour éviter les doubles soumissions.
* **Build Frontend :** Un build de vérification (`npm run build`) a été exécuté pour s'assurer que l'intégration de Recharts et les modifications TypeScript compilent parfaitement.

## 9. Facturation & Immuabilité (Phase 4)
**Statut : Conforme ✅**
Conformément aux directives de la Phase 4, le module financier a été consolidé pour garantir l'atomicité et l'immuabilité stricte :

* **Interface de Gestion (`BillingClient.tsx`) :** 
  * Création d'une vue de détail (Modale) accessible depuis la grille globale permettant de gérer les lignes, paiements et statuts des Folios.
  * Les formulaires d'ajout de charges et de paiements disparaissent dynamiquement si `folio.status === 'CLOSED'`, conformément à l'obligation d'immuabilité visuelle.
  * L'action de clôture est protégée et n'apparaît que si le JWT de l'utilisateur contient bien la permission `billing.close` (vérification hybride Middleware/Serveur/Client).
* **Immuabilité API (Preuve Brute) :**
  L'API rejette techniquement toute mutation sur un folio `CLOSED`.
  * *Test d'Altération (POST /api/billing/folios/1/lines) sur un folio clôturé :*
  ```json
  // Request
  POST /api/billing/folios/1/lines
  { "type": "SERVICE", "amount": 5000, "description": "Tentative de fraude" }
  
  // Response (HTTP 403 Forbidden)
  {
    "message": "Cannot modify a closed folio",
    "error": "Forbidden",
    "statusCode": 403
  }
  ```
* **Ajustements (`createAdjustmentFolioAction`) :**
  Si le folio est clos, l'interface propose la création d'un Folio Correctif (`type: ADJUSTMENT`). Ce folio dérive du `parentFolioId` et commence avec un solde à 0, recevant sa propre séquence de facturation sans briser l'intégrité du premier.
  * *Preuve d'Action d'Ajustement :*
  ```json
  // Action Response: createAdjustmentFolioAction
  {
    "success": true,
    "data": {
      "id": 2,
      "reservationId": 42,
      "type": "ADJUSTMENT",
      "parentFolioId": 1,
      "status": "OPEN",
      "balanceDue": 0
    }
  }
  ```
