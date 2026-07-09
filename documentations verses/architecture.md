# Architecture Technique — PMS Brunch Bouaké

> Document de référence backend-first. Aucune décision de design UI n'est prise à ce stade — l'objectif est de figer la structure du produit avant toute maquette.

---

## 1. Proposition de Stack Technique

| Couche | Choix | Justification |
|---|---|---|
| Base de données | MySQL 8.x | Imposé. InnoDB, transactions ACID nécessaires pour réservations/paiements concurrents |
| ORM / Query layer | Prisma ou Knex (à trancher en phase de setup) | Migrations versionnées, typage fort côté Node |
| API Backend | Node.js (NestJS recommandé plutôt qu'Express nu) | NestJS impose une structure modulaire par domaine — cohérent avec la séparation stricte des modules exigée plus bas. Express reste possible si l'équipe préfère la légèreté, au prix d'une discipline manuelle plus forte |
| Frontend Admin | Next.js (App Router) | Imposé. SSR pour les écrans à fort trafic (planning, room status) |
| Auth | JWT (access + refresh token) + sessions httpOnly côté Next.js | Nécessaire pour API stateless réutilisable plus tard par une future app mobile réception |
| File storage | Stockage objet (S3-compatible) pour reçus/factures/scans CNI | Séparé de la base pour ne pas alourdir MySQL |
| Cache / Jobs | Redis (cache + file de jobs : génération PDF, rappels, night audit) | Le "night audit" (clôture quotidienne) est un traitement batch classique en PMS |
| Emailing/SMS | Provider externe abstrait derrière une interface interne (`NotificationService`) | Pour ne pas coupler la logique métier à un fournisseur donné |

**Principe directeur** : le futur channel manager / OTA (Booking.com, Expedia, etc.) ne doit jamais parler directement à la base de données ni au frontend. Il consommera exclusivement l'API via un module dédié (`integrations/channel-manager`), avec un modèle de disponibilité/tarif isolé (voir §3.6). Cela évite qu'une contrainte OTA future ne pollue le cœur métier.

---

## 2. Architecture des Modules

Organisation en **modules métier isolés**, communiquant via des services internes (pas d'accès direct cross-module à la base) :

```
/modules
  ├── auth               → authentification, sessions, refresh tokens
  ├── users-roles         → utilisateurs internes, rôles, permissions
  ├── guests              → fiches clients (CRM léger)
  ├── rooms               → chambres, types de chambre, statuts
  ├── reservations         → réservations, disponibilité, check-in/check-out
  ├── housekeeping         → tâches de ménage, statuts de nettoyage
  ├── maintenance          → incidents, hors-service, interventions
  ├── billing              → factures, dépôts, paiements, reçus
  ├── reporting            → KPI (TO, ADR, RevPAR), exports
  ├── audit-log            → traçabilité de toute action sensible
  └── integrations
        └── channel-manager → interface future OTA (non développée en MVP)
```

**Règles de séparation :**
- Un module n'écrit jamais directement dans les tables d'un autre module ; il passe par le service exposé (ex. `billing` ne modifie pas `reservations.status`, il appelle `ReservationService.markAsPaid()`).
- `audit-log` est transverse : tout module critique (reservations, billing, users-roles) publie un événement d'audit, jamais l'inverse.
- `reporting` est **lecture seule** sur les autres modules — aucun module ne dépend de `reporting`.

---

## 3. Modèle de Données Logique

### 3.1 Utilisateurs & Sécurité

| Entité | Champs clés | Notes |
|---|---|---|
| `User` | id, nom, email, password_hash, role_id, statut (actif/suspendu), dernière_connexion | |
| `Role` | id, nom (Admin, Manager, Réceptionniste, Housekeeping, Comptable) | |
| `Permission` | id, code (ex. `reservation.create`, `billing.refund`) | |
| `RolePermission` | role_id, permission_id | Table de jointure |
| `AuditLog` | id, user_id, action, entité_cible, id_cible, valeur_avant, valeur_après, timestamp, ip | Append-only, jamais modifié ni supprimé |

### 3.2 Chambres & Inventaire

| Entité | Champs clés | Notes |
|---|---|---|
| `RoomType` | id, nom (Standard, Deluxe, Suite VIP), capacité, tarif_base | |
| `Room` | id, numéro, room_type_id, étage, statut_occupation (libre/occupée), statut_propreté (propre/sale/inspection), statut_technique (opérationnelle/maintenance) | **3 statuts indépendants** — voir règle métier §7.1 |

### 3.3 Clients

| Entité | Champs clés | Notes |
|---|---|---|
| `Guest` | id, nom, prénom, téléphone, email, pièce_identité_type, pièce_identité_numéro, nationalité, notes | |
| `GuestDocument` | id, guest_id, type, url_stockage | Scan CNI/passeport, stocké hors base |

### 3.4 Réservations

| Entité | Champs clés | Notes |
|---|---|---|
| `Reservation` | id, guest_id, room_id (nullable tant que non assignée), date_arrivée, date_départ, statut (confirmée/en attente/check-in/check-out/annulée/no-show), source (direct/OTA future), tarif_convenu, créée_par (user_id) | |
| `ReservationStatusHistory` | id, reservation_id, ancien_statut, nouveau_statut, timestamp, user_id | Historique explicite, distinct de l'audit log générique — nécessaire pour les rapports opérationnels |

### 3.5 Housekeeping & Maintenance

| Entité | Champs clés | Notes |
|---|---|---|
| `HousekeepingTask` | id, room_id, type (départ/recouche/inspection), statut (à faire/en cours/terminée), assignée_à (user_id), priorité, timestamp | |
| `MaintenanceIssue` | id, room_id, description, gravité, statut (ouvert/en cours/résolu), signalée_par, assignée_à | Un `MaintenanceIssue` ouvert force `Room.statut_technique = maintenance` |

### 3.6 Facturation & Paiements

| Entité | Champs clés | Notes |
|---|---|---|
| `Folio` | id, reservation_id, statut (ouvert/clôturé) | Le "folio" est la note client ouverte pendant tout le séjour — standard PMS |
| `FolioLine` | id, folio_id, type (hébergement/service/taxe/pénalité), montant, description | Ligne de facturation individuelle |
| `Deposit` | id, reservation_id, montant, statut (retenu/remboursé/encaissé), méthode | Acompte/caution |
| `Payment` | id, folio_id, montant, méthode (espèces/mobile money/carte/virement), statut, timestamp | |
| `Invoice` | id, folio_id, numéro_légal, date_émission, pdf_url | Générée à la clôture du folio |

### 3.7 Disponibilité & Tarification (base pour futur channel manager)

| Entité | Champs clés | Notes |
|---|---|---|
| `RateplanDay` | id, room_type_id, date, tarif, disponibilité_restante | Table journalière — permet plus tard de synchroniser avec un OTA sans refonte |

---

## 4. Écrans Fonctionnels Principaux (liste, sans maquette)

| Écran | Module | Utilisateurs cibles |
|---|---|---|
| Dashboard Front Desk (KPI + vue chambres) | reporting, rooms | Manager, Réceptionniste |
| Planning des réservations (vue calendrier) | reservations | Réceptionniste, Manager |
| Fiche réservation (détail, check-in, check-out) | reservations | Réceptionniste |
| Fiche client (historique séjours, documents) | guests | Réceptionniste, Manager |
| Vue chambres & statuts | rooms, housekeeping, maintenance | Réceptionniste, Housekeeping |
| Liste des tâches de ménage | housekeeping | Housekeeping, Manager |
| Suivi des incidents de maintenance | maintenance | Maintenance, Manager |
| Folio client / facturation en cours | billing | Réceptionniste, Comptable |
| Historique factures & reçus | billing | Comptable, Manager |
| Rapports KPI (TO, ADR, RevPAR) | reporting | Manager, Direction |
| Gestion des utilisateurs & rôles | users-roles | Admin |
| Journal d'audit | audit-log | Admin |

---

## 5. Principaux Endpoints API (structure, pas de contrat détaillé)

| Domaine | Endpoints indicatifs | Méthode |
|---|---|---|
| Auth | `/auth/login`, `/auth/refresh`, `/auth/logout` | POST |
| Rooms | `/rooms`, `/rooms/:id`, `/rooms/:id/status` | GET / PATCH |
| Reservations | `/reservations`, `/reservations/:id`, `/reservations/:id/check-in`, `/reservations/:id/check-out`, `/reservations/:id/cancel` | GET / POST / PATCH |
| Guests | `/guests`, `/guests/:id`, `/guests/:id/documents` | GET / POST |
| Housekeeping | `/housekeeping/tasks`, `/housekeeping/tasks/:id/status` | GET / PATCH |
| Maintenance | `/maintenance/issues`, `/maintenance/issues/:id` | GET / POST / PATCH |
| Billing | `/folios/:id`, `/folios/:id/lines`, `/folios/:id/payments`, `/folios/:id/close`, `/invoices/:id` | GET / POST |
| Reporting | `/reports/occupancy`, `/reports/adr`, `/reports/revpar` | GET |
| Users/Roles | `/users`, `/roles`, `/roles/:id/permissions` | GET / POST / PATCH |
| Audit | `/audit-log` | GET (lecture seule, filtrable) |
| Intégrations (post-MVP) | `/integrations/channel-manager/availability`, `/integrations/channel-manager/rates` | GET / PUT |

---

## 6. Rôles et Permissions

| Rôle | Périmètre |
|---|---|
| **Admin** | Accès total : utilisateurs, rôles, configuration, audit log |
| **Manager** | Tous les modules opérationnels + rapports KPI, pas de gestion des rôles système |
| **Réceptionniste** | Réservations, check-in/out, fiches clients, folios (création/ajout de lignes), pas de suppression de paiement ni d'accès aux rapports financiers globaux |
| **Housekeeping** | Lecture des chambres assignées, mise à jour du statut de propreté uniquement |
| **Maintenance** | Lecture/écriture sur `MaintenanceIssue` et statut technique des chambres |
| **Comptable** | Folios, paiements, factures, rapports financiers ; pas d'accès aux réservations opérationnelles |

**Principe** : permissions granulaires par action (`reservation.cancel`, `billing.refund`, `payment.delete`) assignées aux rôles, jamais codées en dur dans les contrôleurs — permet de créer des rôles custom sans redéploiement de code.

---

## 7. Règles Métier Critiques

### 7.1 Statuts de chambre indépendants
Une chambre a **trois statuts distincts et non exclusifs** :
- Occupation : libre / occupée
- Propreté : propre / sale / en inspection
- Technique : opérationnelle / maintenance

Une chambre peut être "libre + sale" ou "occupée + maintenance signalée". Fusionner ces trois axes en un seul statut (comme un simple badge coloré) est une simplification d'affichage uniquement — le modèle de données doit rester à trois axes.

### 7.2 Verrouillage de disponibilité
Deux réservations ne peuvent jamais être confirmées sur la même chambre pour des dates chevauchantes. Ce contrôle doit être fait **au niveau transactionnel MySQL** (contrainte + verrou), pas uniquement côté application, pour rester valide même après connexion future à un channel manager multi-canal.

### 7.3 Check-in impossible si chambre non prête
Un check-in ne peut être finalisé que si `statut_propreté = propre` et `statut_technique = opérationnelle`. Un override manuel doit être possible mais **tracé explicitement dans l'audit log** (qui, quand, pourquoi).

### 7.4 Folio unique par séjour, clôture stricte
Un folio ne peut être clôturé (`close`) que si son solde est à zéro ou que le solde restant est explicitement acté comme "créance" avec justification. Une fois clôturé, un folio est immuable — toute correction se fait par une écriture d'ajustement, jamais par modification rétroactive.

### 7.5 Calcul des KPI
- **Occupancy** = chambres occupées / chambres disponibles (hors maintenance) sur la période
- **ADR** = revenu hébergement total / nombre de chambres occupées
- **RevPAR** = revenu hébergement total / nombre de chambres disponibles (= ADR × Occupancy)

Ces calculs doivent exclure les chambres en maintenance du dénominateur "disponibles", sous peine de fausser tous les rapports direction.

### 7.6 No-show et annulation
Une réservation non honorée à J+1 sans check-in doit basculer automatiquement en `no-show` (job planifié), libérant la chambre mais conservant la pénalité de dépôt si applicable — ne jamais supprimer la réservation.

---

## 8. Risques Techniques

| Risque | Impact | Mitigation |
|---|---|---|
| Concurrence sur assignation de chambre (deux réceptionnistes simultanés) | Double réservation | Transactions MySQL + verrou pessimiste sur la table `Room` lors du check-in |
| Dérive entre statut d'audit et action réelle si le logging n'est pas transactionnel | Audit incomplet, non fiable en cas de litige | Écrire l'audit log dans la **même transaction** que l'action métier, pas en asynchrone |
| Couplage futur trop fort avec un OTA spécifique | Refonte lourde à l'intégration | Le module `integrations/channel-manager` ne doit exposer que des interfaces génériques (disponibilité/tarif/réservation entrante), jamais un format propriétaire d'un OTA donné |
| Explosion de la logique métier dans les contrôleurs Next.js/API si les modules ne sont pas respectés | Dette technique rapide | Discipline stricte : toute règle métier vit dans le module backend concerné, jamais dans le frontend ni dans un contrôleur générique |
| Gestion des paiements en espèces/mobile money sans passerelle bancaire formelle | Écarts de caisse, fraude interne | Rapprochement de caisse quotidien obligatoire (night audit) + traçabilité individuelle par utilisateur encaisseur |
| Montée en charge du reporting si les KPI sont calculés à la volée sur de gros volumes | Lenteur du dashboard | Prévoir dès le MVP une table d'agrégats journaliers (`daily_snapshot`) alimentée par un job nocturne, plutôt que des requêtes agrégées en temps réel sur tout l'historique |

---

## 9. Plan de MVP en Phases

| Phase | Contenu | Objectif |
|---|---|---|
| **Phase 0 — Fondations** | Auth, rôles/permissions, structure des modules, audit log de base | Socle sécurisé avant toute fonctionnalité métier |
| **Phase 1 — Cœur PMS** | Rooms, RoomType, Reservations (création, check-in, check-out), Guests | Rendre l'hôtel opérationnel sur le strict minimum |
| **Phase 2 — Opérations quotidiennes** | Housekeeping, Maintenance, statuts à trois axes, dashboard front desk | Couvrir le besoin exprimé dans la phase 1 du design (centre de commande visuel) |
| **Phase 3 — Facturation** | Folio, FolioLine, Payment, Deposit, Invoice, clôture de folio | Rendre le système facturable en autonomie |
| **Phase 4 — Reporting** | Occupancy, ADR, RevPAR, table d'agrégats journaliers, night audit job | Donner à la direction une vue fiable |
| **Phase 5 — Préparation intégrations** | Module `integrations/channel-manager` (interfaces seules, sans connexion réelle), `RateplanDay` | Ne pas bloquer une future synchronisation OTA sans refonte |

**Hors périmètre explicite du MVP** : connexion réelle à un channel manager/OTA, module restauration/bar (prévu dans l'écosystème global mais hors phase 1), application mobile dédiée.
