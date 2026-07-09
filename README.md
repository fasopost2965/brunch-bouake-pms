# 🏨 Brunch Bouaké PMS

> Système de gestion hôtelière pour **Brunch Bouaké** — Bouaké, Côte d'Ivoire

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | NestJS (Node.js) |
| Frontend Admin | Next.js 15 (App Router) |
| Base de données | MySQL 8.0 |
| ORM | Prisma |
| Monorepo | Turborepo + npm workspaces |

## Structure du monorepo

```
brunch-bouake-pms/
├── apps/
│   ├── backend/          # API NestJS (:3001)
│   └── frontend/         # Admin Next.js (:3000)
├── packages/
│   ├── database/         # Prisma schema + client
│   └── shared-types/     # Types TypeScript partagés
├── docker-compose.yml    # MySQL + Adminer
├── turbo.json            # Pipeline Turborepo
└── .env                  # Variables d'environnement
```

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer MySQL (nécessite Docker)
docker compose up -d

# 3. Copier et configurer l'environnement
cp .env.example .env

# 4. Générer le client Prisma et appliquer les migrations
npm run db:generate
npm run db:migrate

# 5. Lancer en développement (backend + frontend en parallèle)
npm run dev
```

## Ports

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 3001 |
| MySQL | 3306 |
| Adminer | 8080 |

## Règles métier clés

- **Statuts de chambre** : 3 axes indépendants (occupation / propreté / technique)
- **Réservations** : anti-chevauchement via verrou transactionnel MySQL
- **Folio** : immuable après clôture
- **Audit log** : transactionnel
- **Settings** : configuration établissement / chambres / tarifs / rôles

## Licence

Propriétaire — Brunch Bouaké © 2026
