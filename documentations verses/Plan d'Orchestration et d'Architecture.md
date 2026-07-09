# **PLAN D'ORCHESTRATION ET D'ALIGNEMENT \- SPRINT 4 HEURES**

## **Projet : MaquisGo (Prototype Fonctionnel PMS & Restauration Hybride)**

## **1\. Découpage Modulaire Global du Projet**

Pour éviter l'effet "monolithe" et répondre à votre besoin de déploiement progressif, MaquisGo est découpé en modules indépendants mais connectés à la même base de données MySQL :  
             ┌──────────────────────────────────────────────────┐  
             │       MODULE 1 : HÉBERGEMENT (PMS)               │ \<--- ÉTAPE PRIORITAIRE DE CE SOIR  
             │ \- Gestion des Chambres, Tarifs & Disponibilités   │  
             │ \- Réservations, Check-in & Check-out             │  
             └───────────────────────┬──────────────────────────┘  
                                     │ (Partage de données Client/Paiement)  
                                     ▼  
             ┌──────────────────────────────────────────────────┐  
             │       MODULE 2 : RESTAURATION / BAR (POS)        │  
             │ \- QR Code Tables, Attribution des Serveurs       │  
             │ \- Prise de commande boissons/repas en salle      │  
             └───────────────────────┬──────────────────────────┘  
                                     │  
                                     ▼  
             ┌──────────────────────────────────────────────────┐  
             │       MODULE 3 : FACTURATION & PAIEMENT          │  
             │ \- Facturation Unifiée (Chambre \+ Maquis)         │  
             │ \- Paiement Direct Mobile Money (Wave, OM)        │  
             └──────────────────────────────────────────────────┘

## **2\. Architecture Technique Solide (Fin du localStorage)**

Le prototype utilisera une architecture Client-Serveur découplée afin de garantir la sécurité et d'éviter les pertes de données :

* **Frontend (Mobile-first) :** React, Tailwind CSS (généré par Google Stitch pour l'interface).  
* **Backend (REST API) :** Node.js avec Express.js.  
* **Base de Données :** MySQL (hébergée sur votre serveur Hostinger).  
* **Estimation d'usage de stockage** : Soit ![][image1] le nombre de réservations actives par jour et ![][image2] la taille moyenne d'une ligne de transaction (![][image3]). La charge de données brute journalière ![][image4] respecte la formule :![][image5]  
  Ce modèle ultra-léger permet une synchronisation rapide même sur une connexion ![][image6] instable.

## **3\. Schéma de Base de Données MySQL (Module Hébergement / PMS)**

Voici la structure de données que nous allons exécuter sur votre base de données MySQL Hostinger. Elle est optimisée pour gérer les états de réservation sans conflits :  
\-- Table des Chambres / Hébergements  
CREATE TABLE rooms (  
    id INT AUTO\_INCREMENT PRIMARY KEY,  
    room\_number VARCHAR(10) NOT NULL UNIQUE,  
    room\_type VARCHAR(50) NOT NULL, \-- Standard, VIP, Suite  
    price\_per\_night DECIMAL(10, 2\) NOT NULL,  
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Table des Réservations  
CREATE TABLE bookings (  
    id INT AUTO\_INCREMENT PRIMARY KEY,  
    guest\_name VARCHAR(100) NOT NULL,  
    guest\_phone VARCHAR(20) NOT NULL,  
    room\_id INT,  
    check\_in\_date DATE NOT NULL,  
    check\_out\_date DATE NOT NULL,  
    total\_amount DECIMAL(10, 2\) NOT NULL,  
    status ENUM('pending', 'confirmed', 'checked\_in', 'checked\_out', 'cancelled') DEFAULT 'pending',  
    created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (room\_id) REFERENCES rooms(id) ON DELETE SET NULL  
);

## **4\. Chronogramme Révisé du Sprint (4 Heures)**

\[00:00 \- 00:30\]  Phase 0 : Briefing & Configuration IA (Perplexity & NotebookLM)  
\[00:30 \- 01:15\]  Phase 1 : Design des écrans PMS (Google Stitch) \-\> Export de l'UI  
\[01:15 \- 02:45\]  Phase 2 : Développement de l'API Node/MySQL & Dashboard (Google AI Studio)  
\[02:45 \- 03:30\]  Phase 3 : Intégration du flux de données & Test Local (Antigravity IDE)  
\[03:30 \- 04:00\]  Phase 4 : Versionnage GitHub, Déploiement Hostinger & Clôture  


[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABDElEQVR4XmNgGAXDFzgD8S0gfg/E/4H4IKo0GJwF4n8MEPlvQDwbVRoTbAHiewwQDZZociCQDcTLgJgJXQIdsALxGSCOYIAYthZVGgymMEB8QRDYAPFkIGYG4vtA/BeIVVBUQCxjRxPDChqB2A/KzmWAuG4aQppBCoi3I/HxggNAzAtlcwHxGwZIQItAxeKBuAjKxgv4GCCGIYMmBojr6qD85UCsi5DGDfyBuB5NTBSIvwPxKyDmBuLLqNK4ASiWrNEFgWA6A8R1c4B4EZocTnAOiFnQBRkgsQmKVZCBMWhyWIEdEJ9GF0QCoPQGMkwCXQIZuAHxAwZEFnkCxPbICqDAnAGSlUbBKBhQAADIFjDhxd8YOAAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAaCAYAAACHD21cAAAA3ElEQVR4Xu3QsY4BURSA4SPZKLawFdW2WyLRUIhks6VO7Q0UXoAt2QfYhGjFC0isRKJHQSQSGj21SlaW/5or7pylVYg/+Yo5Z+4wI/Lodn2gixEG6CCKNiLOfb7KWCDmzJLYYOrMfKWxR1wvqIUvPTxVxx+e9YK+kdHDU2ZpfrGHd/E/4AUB59rXG9biHTZ+MUTWvelaIeTRwFy8B+zk8nsfu/aZq+IdLuqFKYy+HtpS4h3M6YXJ/LWJHtoqWCKoF6YmtijJ+Us+oYAVEnb2rx+84hNjzKyanT+60w5g7iek98V0vgAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGcAAAAaCAYAAACq/ULmAAAERklEQVR4Xu2YW+hVRRTGv9LKshuiQdHDX7HIsqx8yMoCySclCKN6SVSojCJDKLqZVoj2ZD4EXehBEQlCC6X7jX9p0QUssYvZDUOksjTsftXvY+3xzFnM7L3PIQpqfvA9nLVm7332rJm11mygUCgUCoVCiiOo47yxhmup6dRIajh1HvUEdW48yPEC9RO1r9Jf1HfUiGjM784/p7LvoH6OfN9SX1NfUbupt6krq7H/GTQxM6gt1E3OV8cGdCYq6Cnq0HhQgoOpj2Hjz3I+cSlswi+jDne+I2HXfersWlgrYL6l3a7euIh6hnqLegP2QqdT69Hbyv07WE19Qb0Ie7FegjNIbYWt6I3UXNjEt+E92PPGOrveX/NyprMHhsKue987YIHTzvqTOtH5WnEn7IXOiGznUN9TmyPbP80k9B6cl6gBb2xJKjjHwHaj0mOOEBxdn2I7zH+BdzQxGXbhBO+AreB7vTGD8vsob0xwiDfU0E9wtNsGvLElPjhKX6pHUw+MSFMXnONh9Up16Gjna+RBWIFTfvTcT13ojQ5t21XUH9Qv1DZqFnVQPKhC6WWJN9bQT3A0mTfCUrSK8dPUKV0j8sTBUY16lnqoa0SaXHC0WLVYdqF5HpMoALrx89QUdAdJWzo1yTG6fhF1LGystv+T1GvUxGicmEfd4Gx19BOc56hl6NSZxdRO6oQDI/KE4Iyj1lC/wrq4gWhMihCcH2E1L0jp7CP0kc4CJ8G6EN1c0hZ8E9aOtiG3sqbB6tjr1EpqE2w1HxYPaqCf4JyK7gZgNOweyyNbjhCcQWo+dVv1e100JkVu54irYc2AFkxfKBeqF3+Y+hD2IKWpVB3yKLg5NEnnw84EmuheCcG52Tt6YAjsHkq3TYTgqEESSm1aYLLVLda64IjHYf7Zzl5LrkVWT66bKXe34XLqFepd6j5YEcxxlTfUEIJzi3dk0ATuhf2fGNXUH5wtRVxzAjpiyKYzzLDIHtMUnOtg/pe9I4eKldrOFGFSdAhsYibsXKQJUdFTwVeuDSfomNNgNaAt4X/c6h0Z7oKNvyOyqYbKpgNmE6ngiMcq+z3OHmgKzjUwv+pwK5TG3vHGCk2wVkrTqVroj/sTsw5bOsQOwlazUt8VsNP+mM6wRkJwlPtTqMWND4aXwOqDUlkg3KPNCT0XHL2Pdp4ahJOdTzQFZy3Mf7t35FD7q4ctQKdD00Oup76kzq5sTdR1X9pN2lVqJV9F/fetFNqJeqm7vYOMh/n0LSugGreRurj6rQ5S6fYD6qgwKIM6TdUl3TNVa1fAfLq/znQx6mrlU32K0ZlOKVk+pfzUcSWJ+n+tiIWwTkpRlx6o7P8mSh+fofMxUt2OUqX+c0D18nPY56UY2R+lPoF9wnkE9hG0Du3yPbBnSb/BOtjw4XNR5JO0qHVfoWfEH031VeUb2IJUay2/OjWdBwuFQqFQKBQKhULhf8d+nXgTMM7Nt5wAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAAA8UlEQVR4Xu2SvWoCQRRGLyoIilpYBDRYxtZC0MImD5BOfBdfwifwESy0MyCilSB2/mBnUgVSREUQG9Hvcndl9iu0sgjsgVPsnNm7wzIiIf+fKlzCPbzAX7j23MAD7MCS/8IjumKDirT+CvtiA/Wjd4nAP/jNwSMDt3DCgSmLnabNwWEktidN6wGaYpsaHBz0NLrnjYPLEJ5hloNHVOwf6aAEtRsaTnDGwaEmNmTOwaUltumdg0dO7DRTGKMWQO/QEcY5gBQci92nPLUABbHTfNJ6EtbhFxzAl0B1qMAF3IkN0lutz+oK/sAe/PBfCAl5FlcQ0zIpTsXAXQAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAtCAYAAAATDjfFAAACNElEQVR4Xu3cPawNQRgG4PFPgaCgo1eQKKhENCIiISFCSalQoKCkoBKFUqPRCIXcgkpLIiJCEKJCo/dTCN9kNjlzx95zCluck/s8yZud+WZzfrovuzubEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwuCxpCwAA0y43MF+r+Z7Ix8jGqjakC5FPkUtN/W1kQ1P7X98iR7vxlsjvyKbRMgDAbNgZudPU9kauNbWhPIrsTqVJXFnVr1bj1o62ENZF9rfFytrIuab2tJkDAMyEx5HNTW1Vmn/VrfZyQtaPTu11ozv+ibyp6iuqcZ8XkW3deE3k0Gip17HIh8jxqra6GgMAzITcmH1vi6ncFn3WFgdysDvmK225acu2dsdxdqXStOWrcnPNWp98Xv78nNy45VuxAAAz53oaNU21V5HtbXEA7TNqz1NpxB409YUsj7xL/37OJAdS//8EAJh6+YrVz6Z2OI1vbnKTNS7jbonm25S1E5F7qTSIkyyN3I3sizyZv9RrWTXOGyt+VHMAgJmRG7N6t+b5yM1UrmQNLe/S/NwWU/kNuXGb5Eozf5gWfu7tTOR+Nf8SOV3NAQCm3tnI+1Sapby54HUqz3ndrk8aUH5FyK9Uvu9is5a/f9KrNo60hXAycrktdm5FTqXyv/LGhrwrFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWDT+AtskTYei/G/TAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAZCAYAAAAv3j5gAAABwElEQVR4Xu2UTyjlURTHv5MZMhIRKTZkOZRYWKhZiGShLMSWLGxmNoqVjbJRVpY2r7BQmgVl409YyEyIEhYspCwMjUZSTMP3OPe+d971vA0bet/61O9+77n3/M659/cDUnpLaiFrZIPskQGSFhcR00fSRZbJX3JDFslXN/+DFLjnONWTbZLnxo3knoxFI2IqIr/IJflOCp1fSqbJLHStxD1RBDrZ6cYfyDX5h1hyURbZJVekwvheUukKkiQagk62GU/a8R+6udcwNK7feKHqkCSRVOBbIPoCDV4w3mdoJc9u4iR7/UHymEflkDlySsqN3wRNcmK859RBMkPTaoIcQw+6Npj7Bk20GfgvUjO5g94qL5/op/FeRavQy+Ar8607ikbEVAPtxBm0G4I8t9sgUTWpCrwIdOMRN/aXQZLnOy9UBvRsZV1ZMIdi6Pdyi/ibMgldMGo8SSper/FCSWUJb6YYMnEBfWuvdee3Gi+bHEArqzS+l1Qkv6SEiURTZJzkunEDtEUz0O/CqoRsQc9BLoj/c0g7I2Qe2qGEidLJIDmEHvY+6SOfbJCR+N1kiZyT32SH9EBfTF7U/lFSSuk96wEGK2IHDpU7iwAAAABJRU5ErkJggg==>