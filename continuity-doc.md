# Document de Continuité — Brunch Bouaké PMS

Ce document constitue la mémoire technique et opérationnelle du projet Brunch Bouaké PMS. Il est conçu pour assurer une passation parfaite et permettre une reprise ou un audit indépendant sans aucune perte de contexte.

---

## 1. Résumé Exécutif & Stack Réelle

Le projet Brunch Bouaké PMS est une application de gestion hôtelière robuste conçue pour répondre à des exigences élevées de sécurité, d'immuabilité et de traçabilité.
L'infrastructure locale est construite sur une architecture Monorepo stricte :

*   **Architecture :** Monorepo géré par Turborepo (`packages/database`, `packages/ui`, `packages/config-typescript`, `apps/backend`, `apps/frontend`).
*   **Base de données :** MySQL 8.x tournant sous Docker (InnoDB / utf8mb4_unicode_ci).
*   **ORM :** Prisma (gestion des schémas, migrations et typage strict).
*   **Backend :** NestJS (TypeScript, API RESTful, Validation DTO, Guards RBAC).
*   **Frontend :** Next.js 15 (App Router, Server Actions, CSS Modules stricts, Recharts pour les KPIs).

L'état actuel du dépôt local est entièrement fonctionnel : le cycle de build s'exécute avec succès (0 erreur) et la base de données répond aux exigences transactionnelles du MVP.

---

## 2. Registre des Règles Métier Validées

Les 9 règles métier critiques suivantes sont rigoureusement implémentées dans le backend et l'interface utilisateur :

1.  **3 Axes de Statut de Chambre :** Les statuts d'occupation (`OccupancyStatus`), de propreté (`CleanlinessStatus`) et techniques (`TechnicalStatus`) sont strictement indépendants.
2.  **Verrouillage MySQL Anti-chevauchement :** Les réservations sont protégées contre le surbooking par un verrou d'inventaire transactionnel en base de données.
3.  **Réservation comme Root Aggregate :** La `Reservation` orchestre les folios, paiements et statuts. L'API retourne les relations imbriquées (ex: `folios` avec `lines` et `payments`) pour éviter le problème des N+1 requêtes.
4.  **Immuabilité Stricte des Folios Fermés :** Un folio au statut `CLOSED` ne peut **JAMAIS** être rouvert, ni altéré. Le backend rejette par un `HTTP 403 Forbidden` toute tentative d'ajout de ligne ou de paiement sur un folio clôturé. L'interface masque ces formulaires automatiquement.
5.  **Folios Correctifs Indépendants :** Toute correction post-clôture exige la génération d'un nouveau folio de type `ADJUSTMENT` couplé à sa propre facture.
6.  **Atomicité et Inclusion des Logs :** Chaque transaction financière (création de ligne, encaissement, clôture) s'exécute dans une même transaction Prisma (`$transaction`). Le journal d'audit (`AuditLog`) est inscrit de manière atomique avec l'opération.
7.  **Auto-clean Housekeeping :** Le `CleanlinessStatus` passe automatiquement à `DIRTY` lors du Check-out (ou après une intervention de maintenance majeure).
8.  **Maintenance Cumulative :** Une chambre marquée en `MAINTENANCE` le reste de manière persistante tant que tous les `MaintenanceIssue` ouverts ne sont pas résolus.
9.  **Protection Granulaire RBAC :** Un réceptionniste ne peut clôturer de facture (sans `billing.close`) ni modifier les paramètres systèmes de l'hôtel, sécurité appliquée tant sur le backend (`PermissionsGuard`) que sur le middleware frontend de Next.js.

---

## 3. État des Lieux des Modules Livrés

Le développement des phases 0 à 4 est validé et les modules suivants sont pleinement opérationnels :

*   **Phase 0 & 1 : Cœur du Système**
    *   **Auth & Sécurité :** Gestion JWT, Refresh tokens, hashage bcrypt.
    *   **Rôles/Permissions :** Système de permissions granulaires hybrides (Backend et Middleware Next.js).
    *   **Entités de Base :** Modélisation robuste des Rooms, Guests, et Reservations.
*   **Phase 2 & 3 : Opérations Hôtelières**
    *   **Housekeeping :** Suivi des tâches, inspection et bascule automatique (Auto-clean).
    *   **Maintenance :** Déclaration et gestion d'incidents cumulés bloquant l'opérationnalité des chambres.
    *   **CRM (Guests) :** Fiche client complète avec 3 onglets (Général, Pièces jointes, Historique). Implémentation du DTO Sanitization avec `@Transform` convertissant de manière stricte les champs texte vides en `null` pour le backend MySQL. Upload de pièces d'identité natif (`FormData`).
*   **Phase 4 & UI/UX : Facturation & Dashboard Visuel**
    *   **Billing :** Folios (Main et Adjustment), encaissements multi-méthodes, factures générées automatiquement et immuables post-clôture.
    *   **Analytics :** Graphiques intégrés via Recharts affichant l'évolution du Taux d'Occupation (TO) sur 30 jours et la répartition des revenus par type de chambre.
    *   **Micro-interactions :** Animations CSS (`@keyframes skeletonPulse`), transitions au survol sur la navigation latérale et les cartes, et boutons désactivés intelligemment ("Traitement en cours...") pour bloquer le spam côté client.

---

## 4. Cartographie de Sécurité Restante (Dette Technique)

Bien que le MVP soit robuste et audité, les chantiers suivants ont été identifiés et documentés pour les versions ultérieures (Phase 5+) :

*   **Invalidation des tokens :** Implémenter l'invalidation explicite des *refresh tokens* existants en base de données lors d'un changement de mot de passe par l'utilisateur.
*   **Permissions en lecture seule :** Actuellement, le `*.write` est requis de manière globale pour lire et éditer les modules Housekeeping, Maintenance, Guests et Billing. Il faudra séparer la granularité (`*.read`) si de futurs rôles limités (ex: Femme de chambre sans édition) sont introduits dans le fichier `seed.ts`.

---

## 5. Procédure de Lancement en Local

Pour déployer et démarrer l'environnement de développement en partant de zéro, exécutez les commandes suivantes dans l'ordre :

```bash
# 1. Démarrer le conteneur MySQL via Docker (S'assurer que le service Docker tourne)
docker-compose up -d

# 2. Installer toutes les dépendances du Monorepo
npm install

# 3. Générer le client Prisma, pousser le schéma et peupler la BDD
cd packages/database
npx prisma generate
npx prisma db push
npx prisma db seed

# 4. Revenir à la racine et lancer le monorepo en mode dev (Turborepo)
cd ../../
npm run dev
```

L'API Backend (NestJS) sera accessible sur `http://localhost:3001/api` et l'interface Frontend (Next.js) sur `http://localhost:3000`. L'accès au Dashboard sécurisé s'effectue avec l'identifiant Admin par défaut généré par le Seed.
