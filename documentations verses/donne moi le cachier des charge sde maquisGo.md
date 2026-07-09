<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# donne moi le cachier des charge sde maquisGo

Bien sûr. Voici un **cahier des charges clair et présentable** pour **MaquisGo**, basé sur votre idée: digitaliser la prise de commande, le service serveur/gérant, et le paiement mobile dans les maquis. Le cadrage s’inspire des usages déjà observés dans les solutions de commande à table, QR code, caisse mobile et paiement intégré.[^1][^2][^3][^4]

# Cahier des charges — MaquisGo

## 1. Présentation du projet

**MaquisGo** est une application mobile de gestion de commande et de paiement conçue pour les maquis, bars et points de consommation sur place en Afrique de l’Ouest, en particulier en Côte d’Ivoire et au Burkina Faso. Le produit vise à remplacer le ticket papier, fluidifier le service en salle, simplifier la gestion des serveurs et intégrer le paiement mobile money comme usage central.[^3][^4][^5][^1]

L’application se distingue des plateformes de livraison classiques parce qu’elle est pensée d’abord pour le service au maquis, c’est-à-dire la consommation sur place, la commande à table et la gestion opérationnelle du point de vente.[^6][^7][^1]

## 2. Objectifs du projet

Le projet doit permettre de:

- enregistrer les commandes rapidement depuis un smartphone;
- associer chaque commande à une table et à un serveur;
- transmettre les commandes au bar, à la cuisine ou au gérant;
- supprimer ou réduire le ticket papier;
- suivre les paiements;
- accepter le mobile money;
- produire des statistiques simples pour le gérant.[^2][^5][^1][^3]

Le MVP doit surtout prouver que l’outil améliore la fluidité du service et la traçabilité des ventes.[^8][^1][^6]

## 3. Périmètre fonctionnel

### Inclus dans le MVP

- application serveur;
- application ou espace gérant;
- espace client léger via QR code ou lien;
- gestion des tables;
- prise de commande;
- gestion des statuts de commande;
- paiement mobile money;
- paiement cash;
- tableau de bord simple;
- export des ventes.[^4][^1][^2][^6]


### Exclu du MVP

- livraison à domicile;
- intelligence vocale;
- programme de fidélité complet;
- multi-établissement complexe;
- stock avancé;
- comptabilité complète;
- CRM avancé.[^1][^8][^6]


## 4. Utilisateurs cibles

Le système doit gérer trois rôles principaux:

- **Client**: consulte le menu, commande et paie.
- **Serveur**: enregistre les commandes et suit les tables.
- **Gérant**: contrôle les commandes, les paiements et les ventes.[^5][^3][^1]

Le client peut commander directement ou passer par le serveur selon l’organisation du maquis. Le serveur reste central au démarrage, car c’est le mode de fonctionnement naturel de nombreux établissements.[^7][^3][^1]

## 5. Parcours utilisateur

### Parcours client

1. Le client arrive au maquis.
2. Il scanne un QR code ou reçoit l’accès au menu.
3. Il visualise les articles disponibles.
4. Il choisit une table ou confirme sa position.
5. Il passe la commande.
6. Il paie par mobile money ou cash.
7. Il reçoit une confirmation.[^4][^6][^7]

### Parcours serveur

1. Le serveur se connecte à son compte.
2. Il sélectionne la table.
3. Il saisit la commande.
4. Il l’envoie au gérant, au bar ou à la cuisine.
5. Il met à jour l’état de service.
6. Il clôture la table au moment du paiement.[^3][^8][^1]

### Parcours gérant

1. Le gérant se connecte.
2. Il voit les commandes en temps réel.
3. Il supervise les serveurs.
4. Il consulte les ventes.
5. Il suit les paiements.
6. Il exporte un rapport simple.[^2][^1][^3]

## 6. Fonctionnalités détaillées

### 6.1 Fonctionnalités client

- Consultation du menu.
- Commande par table.
- Commande via QR code.
- Paiement mobile money.
- Paiement cash.
- Confirmation de commande.[^6][^7][^4]


### 6.2 Fonctionnalités serveur

- Authentification.
- Sélection de table.
- Ajout d’articles.
- Envoi de commande.
- Modification avant validation.
- Suivi du statut.
- Clôture de table.[^8][^1][^3]


### 6.3 Fonctionnalités gérant

- Création du maquis.
- Création des comptes serveurs.
- Gestion des tables.
- Gestion des menus.
- Supervision des commandes.
- Vue des paiements.
- Tableau des ventes journalières.[^1][^2][^3]


## 7. Règles de gestion

- Une commande appartient à un seul maquis.
- Une commande est reliée à une table ou à un point de service.
- Un serveur appartient à un maquis.
- Un gérant supervise un ou plusieurs serveurs.
- Une commande peut être en attente, envoyée, servie, payée ou annulée.
- Le paiement peut être mobile money ou cash.[^5][^2][^3][^1]

Ces règles servent à garder un fonctionnement simple et cohérent pour le pilote.[^6][^1]

## 8. Exigences fonctionnelles

- L’interface doit être simple et rapide à utiliser.
- Les boutons doivent être visibles et lisibles.
- Le parcours doit fonctionner sur smartphone.
- Le système doit tolérer une connexion instable.
- Les commandes doivent s’enregistrer en quelques secondes.
- Les données doivent être synchronisées dès que possible.[^7][^2][^1][^6]


## 9. Exigences techniques

- Application mobile Android en priorité.
- Architecture évolutive.
- Base de données structurée par maquis, tables, commandes, utilisateurs et paiements.
- Préparation à l’intégration future du mobile money.
- Préparation à l’ajout d’un module fidélité et d’un module vocal.[^4][^5][^1][^6]


## 10. Indicateurs de réussite

Le pilote sera jugé sur:

- le nombre de commandes enregistrées;
- le temps moyen de prise de commande;
- le taux d’adoption par les serveurs;
- le retour des clients;
- la réduction du ticket papier;
- la satisfaction du gérant;
- la part des paiements numériques.[^2][^3][^8][^1]


## 11. Phase pilote

Le projet doit commencer avec **un seul maquis partenaire**. Cette phase permettra de tester la simplicité du produit, la réaction des serveurs, la fluidité du service et la perception du client.[^3][^7][^1]

Après validation du pilote, l’application pourra être déployée dans un petit réseau de maquis pour mesurer l’effet bouche à oreille et l’adoption progressive.[^9][^1][^6]

## 12. Évolutions futures

Après le MVP, MaquisGo pourra intégrer:

- un système de fidélité;
- des notifications;
- la commande vocale;
- des statistiques avancées;
- une réservation de table;
- des offres promotionnelles;
- un module de vendeur partenaire.[^7][^1][^6]


## 13. Conclusion

MaquisGo doit être conçu comme un **outil de service pour le maquis**, et non comme une simple application de livraison. Le succès du MVP dépendra surtout de sa simplicité, de la vitesse de prise en main et de sa capacité à remplacer le ticket papier tout en gardant le serveur au centre du service.[^1][^3][^6]

Je peux maintenant te faire la version **Word/PDF plus formelle**, avec page de garde, sommaire, numérotation propre et style documentaire prêt à présenter.
<span style="display:none">[^10][^11]</span>

<div align="center">⁂</div>

[^1]: https://www.sapaad.com/ae/sapaad-waiter/

[^2]: https://play.google.com/store/apps/details?id=com.qtmwaiter\&hl=en_IE

[^3]: https://play.google.com/store/apps/details?id=io.waiter.android

[^4]: https://play.google.com/store/apps/details?id=com.africa.orga

[^5]: https://play.google.com/store/apps/details?id=com.carteresto.afripayway.com

[^6]: https://www.rstepos.com/waiter-ordering-system

[^7]: https://smartbiashara.com/qr-menu/

[^8]: https://play.google.com/store/apps/details?id=com.quicklyservices.restaurants\&hl=en_SG

[^9]: https://www.linkedin.com/posts/euniceajim_startupfunding-africantech-venturecapital-activity-7287834567258910720-L-DV

[^10]: https://play.google.com/store/apps/details?id=com.eats365.waiter

[^11]: https://www.mypos.com/sk-sk/appmarket/application/25453

