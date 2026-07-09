<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# PLAN DE TRAVAIL ET D'ALIGNEMENT - SPRINT PMS BRUNCH BOUAKÉ

Projet : Brunch Bouaké (Property Management System Professionnel)

1. Périmètre Fonctionnel Prioritaire (Module Hébergement / PMS)
Le prototype de ce soir se concentre exclusivement sur les fonctionnalités de gestion d'hébergement requises par Brunch Bouaké, préparant l'architecture pour des connexions futures (Channel Manager) :
┌────────────────────────────────────────────────────────┐
│             RECEPTION \& FRONT DESK                     │
│  - Check-in \& Check-out rapides                        │
│  - Gestion des clients (Fiches d'identité conformes)   │
└──────────────────────────┬─────────────────────────────┘
▼
┌────────────────────────────────────────────────────────┐
│             SUIVI DES CHAMBRES \& ACTIONS               │
│  - Statuts dynamiques : Disponible, Occupé, Sale...    │
│  - Création / Configuration complète des chambres      │
└──────────────────────────┬─────────────────────────────┘
▼
┌────────────────────────────────────────────────────────┐
│             OPÉRATIONS \& SYNC EXTERNE                  │
│  - Gestion du ménage et tâches d'entretien             │
│  - Facturation \& encaissements (Taxe de séjour, TVA)    │
│  - Structure prête pour sync Booking.com \& Airbnb      │
└────────────────────────────────────────────────────────┘
2. Indicateurs Clés de Performance Financière (KPI)
Le backend calculera en temps réel les indicateurs clés pour le gérant de Brunch Bouaké.
Soit $R_{\text{occupées}}$ le nombre de chambres occupées, $R_{\text{totales}}$ le nombre total de chambres du complexe, et $T_{\text{chambres}}$ le revenu total généré par les nuitées.
Le Taux d'Occupation ($TO$) est défini par :

$$
TO = \frac{R_{\text{occupées}}}{R_{\text{totales}}} \times 100
$$

Le Tarif Journalier Moyen ($ADR$) est calculé comme suit :

$$
ADR = \frac{T_{\text{chambres}}}{R_{\text{occupées}}}
$$

Le Revenu par Chambre Disponible ($RevPAR$) respecte la formule :

$$
RevPAR = ADR \times \left(\frac{TO}{100}\right) = \frac{T_{\text{chambres}}}{R_{\text{totales}}}
$$

3. Schéma de Base de Données MySQL (Production)
Voici la structure relationnelle complète à exécuter sur votre base de données MySQL Hostinger via Antigravity IDE ou votre interface phpMyAdmin. Ce schéma élimine totalement l'usage de tout localStorage et prévoit les tables nécessaires à la conformité administrative et technique.
-- 1. Table des Équipements / Caractéristiques de chambre
CREATE TABLE room_features (
id INT AUTO_INCREMENT PRIMARY KEY,
feature_name VARCHAR(50) NOT NULL UNIQUE, -- Climatisation, Canal+, Mini-bar, Jacuzzi
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des Chambres (Processus de création complet)
CREATE TABLE rooms (
id INT AUTO_INCREMENT PRIMARY KEY,
room_number VARCHAR(10) NOT NULL UNIQUE,
room_type ENUM('Standard', 'VIP', 'Suite', 'Luxe') NOT NULL,
floor INT DEFAULT 0,
price_per_night DECIMAL(10, 2) NOT NULL,
status ENUM('available', 'occupied', 'cleaning_needed', 'maintenance') DEFAULT 'available',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Jointure Chambres - Équipements
CREATE TABLE room_feature_mapping (
room_id INT,
feature_id INT,
PRIMARY KEY (room_id, feature_id),
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
FOREIGN KEY (feature_id) REFERENCES room_features(id) ON DELETE CASCADE
);

-- 3. Fiches Clients (Gestion des clients)
CREATE TABLE guests (
id INT AUTO_INCREMENT PRIMARY KEY,
full_name VARCHAR(100) NOT NULL,
phone VARCHAR(20) NOT NULL,
email VARCHAR(100),
id_type ENUM('CNI', 'Passport', 'Permis', 'Attestation') NOT NULL,
id_number VARCHAR(50) NOT NULL,
country VARCHAR(50) DEFAULT 'Côte d''Ivoire',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table des Réservations (Check-in / Check-out)
CREATE TABLE bookings (
id INT AUTO_INCREMENT PRIMARY KEY,
guest_id INT,
room_id INT,
check_in_date DATE NOT NULL,
check_out_date DATE NOT NULL,
actual_check_in DATETIME NULL,
actual_check_out DATETIME NULL,
adults_count INT DEFAULT 1,
children_count INT DEFAULT 0,
status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE RESTRICT,
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

-- 5. Facturation \& Encaissements
CREATE TABLE invoices (
id INT AUTO_INCREMENT PRIMARY KEY,
booking_id INT,
invoice_number VARCHAR(50) NOT NULL UNIQUE, -- Format : INV-YYYYMMDD-XXXX
room_charges DECIMAL(10, 2) NOT NULL,
tax_amount DECIMAL(10, 2) NOT NULL, -- Taxe de séjour / TVA
extra_charges DECIMAL(10, 2) DEFAULT 0.00, -- Consommations annexes
total_amount DECIMAL(10, 2) NOT NULL,
payment_status ENUM('unpaid', 'partially_paid', 'paid', 'refunded') DEFAULT 'unpaid',
payment_method ENUM('cash', 'orange_money', 'wave', 'card') NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 6. Tâches de Ménage \& Entretien
CREATE TABLE housekeeping_tasks (
id INT AUTO_INCREMENT PRIMARY KEY,
room_id INT,
staff_name VARCHAR(100) NOT NULL,
task_type ENUM('cleaning', 'deep_cleaning', 'maintenance_repair', 'inspection') DEFAULT 'cleaning',
priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
notes TEXT,
assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
completed_at DATETIME NULL,
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- 7. Table de Préparation Channel Manager (Airbnb / Booking)
-- Permet de lier une chambre locale à une annonce externe
CREATE TABLE channel_manager_sync (
id INT AUTO_INCREMENT PRIMARY KEY,
room_id INT,
channel_name ENUM('booking_com', 'airbnb', 'expedia') NOT NULL,
external_listing_id VARCHAR(100) NOT NULL, -- ID de l'annonce sur l'OTA
sync_active BOOLEAN DEFAULT TRUE,
last_sync_time DATETIME NULL,
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
UNIQUE KEY unique_channel_room (room_id, channel_name)
);

4. Chronogramme Révisé (Sprint 4 Heures)
[00:00 - 00:30]  Phase 0 : Configuration de la BDD Hostinger + Synchronisation NotebookLM
[00:30 - 01:15]  Phase 1 : Design UI Responsive (Stitch) -> Gestion chambres \& check-in
[01:15 - 02:45]  Phase 2 : Écriture API Node (Express/MySQL) \& Dashboard (Google AI Studio)
[02:45 - 03:30]  Phase 3 : Intégration du flux de données \& Test Local (Antigravity IDE)
[03:30 - 04:00]  Phase 4 : Tests de non-régression, Versioning Git \& Déploiement Hostinger

Voici une version **structurée et exploitable** de ton **plan de travail + alignement sprint** pour **BRUNCH BOUAKÉ PMS**. Je l’ai reformulé en document clair, avec périmètre, objectifs, priorités, architecture de données et séquencement de sprint. Les indicateurs d’occupation, d’ADR et de RevPAR sont bien des métriques standard de pilotage hôtelier, et le PMS couvre classiquement front desk, réservations, housekeeping et facturation.[^1][^2][^3]

# Plan de travail et d’alignement

## Sprint PMS — Brunch Bouaké

### 1. Contexte du sprint

Le sprint de ce soir vise à poser un **prototype fonctionnel** du module hébergement du PMS Brunch Bouaké. Le périmètre est volontairement limité aux opérations essentielles de réception, gestion des chambres, tâches de ménage, facturation et préparation à une future synchronisation avec des canaux externes.[^2][^3]

L’objectif n’est pas encore de couvrir tout le système hôtelier, mais de livrer une base propre, stable et extensible. Cette phase doit surtout valider la structure métier, la logique de données et la fluidité du parcours front desk.[^3][^2]

### 2. Périmètre prioritaire

Le prototype se concentre sur trois blocs fonctionnels:

- **Réception et front desk**: check-in, check-out, fiche client et conformité des informations.
- **Suivi des chambres**: création des chambres, configuration, statuts dynamiques.
- **Opérations et synchronisation future**: ménage, facturation, encaissements et base prête pour Booking.com / Airbnb.[^2][^3]

Ce découpage est cohérent avec les fonctions principales attendues d’un PMS hôtelier moderne.[^3][^2]

### 3. Indicateurs de pilotage

Les KPI retenus sont:

- **Taux d’occupation** $TO$: $\frac{R_{\text{occupées}}}{R_{\text{totales}}} \times 100$
- **ADR**: $\frac{T_{\text{chambres}}}{R_{\text{occupées}}}$
- **RevPAR**: $ADR \times \frac{TO}{100}$

Le RevPAR est bien une mesure reconnue pour évaluer la performance des chambres disponibles, et peut aussi être exprimé comme revenu total divisé par le nombre de chambres disponibles sur la période.[^4][^5][^6][^1]

### 4. Architecture fonctionnelle

Le PMS doit être organisé autour de quatre sous-systèmes:

- **Front desk**: gestion des arrivées, départs et dossiers clients.
- **Room management**: gestion des chambres, types, équipements et statuts.
- **Housekeeping**: planification et suivi des tâches d’entretien.
- **Billing \& reporting**: facturation, paiements et KPI.[^2][^3]

Cette architecture correspond à ce qu’on attend d’un PMS hôtelier orienté exploitation quotidienne.[^3][^2]

### 5. Schéma de données

Le schéma MySQL proposé est pertinent pour le MVP car il sépare correctement les entités métier:

- `room_features`
- `rooms`
- `room_feature_mapping`
- `guests`
- `bookings`
- `invoices`
- `housekeeping_tasks`
- `channel_manager_sync`[^2][^3]

La logique relationnelle est bonne pour préparer une évolution future vers un channel manager, tout en gardant une base simple pour le prototype. Les champs de dates et timestamps sont adaptés à un système transactionnel, et MySQL supporte l’usage de `CURRENT_TIMESTAMP` comme valeur par défaut dans les colonnes temporelles.[^7][^2]

### 6. Flux métier cible

Le parcours utilisateur doit suivre cette séquence:

1. Création ou ouverture d’un dossier client.
2. Attribution d’une chambre.
3. Check-in.
4. Suivi du séjour.
5. Check-out.
6. Facturation.
7. Mise à jour du statut de la chambre.
8. Planification du ménage si nécessaire.[^3][^2]

Ce flux est conforme aux usages habituels d’un PMS centré réception et opérations.[^2][^3]

### 7. Chronogramme de sprint

Le planning en 4 heures est cohérent si l’objectif est un prototype de cadrage et non une version exhaustive.

- **00:00–00:30**: configuration BDD Hostinger et synchronisation documentaire.
- **00:30–01:15**: design UI responsive pour chambres et check-in.
- **01:15–02:45**: API Node/Express/MySQL et dashboard.
- **02:45–03:30**: intégration, flux de données, test local.
- **03:30–04:00**: tests, versioning Git et déploiement.[^3][^2]

Le séquençage est logique: base de données d’abord, interface ensuite, puis logique applicative, intégration et validation.[^2][^3]

### 8. Risques et points d’attention

Le principal risque est de vouloir couvrir trop de fonctionnalités avant d’avoir stabilisé le cœur du PMS. Il faut surtout éviter de mélanger le prototype d’hébergement avec des modules secondaires qui ralentiraient la livraison.[^3][^2]

Un autre point sensible est la cohérence des statuts de chambre et des réservations. Il faudra donc bien verrouiller les transitions: disponible, occupé, sale, maintenance, confirmé, check-in, check-out.[^2][^3]

### 9. Recommandation d’exécution

Pour ce sprint, je recommande de livrer en priorité:

- le schéma BDD finalisé;
- les modèles métiers principaux;
- l’API de base;
- l’écran réception;
- l’écran chambres;
- un dashboard minimal des KPI.[^1][^3][^2]

Cela donnera une base saine pour continuer vers un PMS complet et préparer ensuite la synchronisation OTA.[^3][^2]

Si tu veux, je peux maintenant te transformer ce document en **version propre de type note interne d’équipe**, ou en **plan de sprint opérationnel avec tâches par heure et livrables attendus**.
<span style="display:none">[^10][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.adventuresincre.com/glossary/revenue-per-available-room/

[^2]: https://hotels.pricelabs.co/blog/property-management-system-in-hotel/

[^3]: https://acquaintsoft.com/blog/hotel-pms-development-front-desk-housekeeping-and-guest-management-in-one-system

[^4]: https://www.costar.com/products/benchmark/resources/data-insights-blog/what-revenue-available-room-revpar-and-how

[^5]: https://www.canarytechnologies.com/post/adr-vs-revpar

[^6]: https://www.mews.com/en/blog/what-is-revpar

[^7]: https://stackoverflow.com/questions/11400147/mysql-current-timestamp-as-default

[^8]: https://www.wallstreetprep.com/knowledge/revpar/

[^9]: https://ada-cosmetics.com/expert-stories/revpar/

[^10]: https://www.linkedin.com/posts/abdellah-merizak-a643541b9_hotelrevenue-revpar-adr-activity-7402815629621112833-RUkw

