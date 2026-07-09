# Design System — Brunch Resto-Bar Vip (Bouaké)

> Spécifications de design pour la plateforme web/mobile de l'établissement.
> Direction artistique : premium, épurée, chaleureuse. Inspirée du logo (toque de chef, couverts fins, arcs dorés, typographie "BRUNCH" impactante).

---

## 1. Palette de Couleurs (Color Tokens)

### 1.1 Couleurs de marque

| Rôle | Nom du token | HEX | Usage |
|---|---|---|---|
| **Primaire** | `--color-brand-primary` | `#E8491D` | CTA principaux, liens actifs, éléments d'énergie/action, badges "Populaire" |
| **Primaire — hover** | `--color-brand-primary-hover` | `#C93C15` | État hover/active des CTA primaires |
| **Primaire — tint** | `--color-brand-primary-tint` | `#FBE6DE` | Fonds légers, badges discrets, surlignage subtil |
| **Secondaire** | `--color-brand-chocolate` | `#3A1E17` | Titres, texte principal, header/footer premium, fond de sections "signature" |
| **Secondaire — clair** | `--color-brand-chocolate-soft` | `#5C3A2E` | Texte secondaire sur fond clair, sous-titres |
| **Accent Or / Vip** | `--color-brand-gold` | `#D9A441` | Étoiles, badges VIP, séparateurs décoratifs, micro-interactions (à utiliser à moins de 10% de la surface visible) |
| **Accent Or — hover** | `--color-brand-gold-hover` | `#C4903A` | État hover du bouton gold — assombrissement cohérent avec le pattern `primary → primary-hover` |
| **Accent Or — clair** | `--color-brand-gold-light` | `#F0D9A0` | Fonds de badge "VIP", hover discret sur icônes or |

### 1.2 Neutres & fonds

| Rôle | Nom du token | HEX | Usage |
|---|---|---|---|
| Fond principal | `--color-bg-base` | `#FDFBF8` | Fond global de l'app (blanc cassé, jamais blanc pur) |
| Fond secondaire | `--color-bg-subtle` | `#F5F0E9` | Sections alternées, cartes sur fond clair |
| Fond sombre (premium) | `--color-bg-dark` | `#231310` | Hero sombre, footer, sections "signature dish" |
| Bordures | `--color-border` | `#E7DED2` | Séparateurs, bordures de cartes/inputs |
| Bordure forte | `--color-border-strong` | `#D8CBB8` | Bordures actives, focus rings secondaires |
| Texte principal | `--color-text-primary` | `#2B1A14` | Corps de texte sur fond clair |
| Texte secondaire | `--color-text-secondary` | `#7A6A5C` | Légendes, métadonnées, placeholders |
| Texte inversé | `--color-text-inverse` | `#FDFBF8` | Texte sur fond sombre/chocolate |

### 1.3 Feedback (à teinter avec la charte, jamais criard)

| Rôle | Token CSS | HEX | Usage |
|---|---|---|---|
| Succès | `--color-status-success` | `#3F7D5C` | Confirmation de réservation/commande, statut opérationnel |
| Erreur | `--color-status-error` | `#B23A2E` | Erreurs bloquantes, statuts critiques (CANCELLED, panne matérielle) — rouge brique, jamais rouge pur |
| Avertissement | `--color-status-warning` | `#9A6B1A` | Statuts à traiter, non bloquants (ex : chambre à nettoyer DIRTY, non-présentation NO_SHOW) — ambre cohérent avec la palette gold |
| Info | `--color-status-info` | `#5C7A8A` | Notices neutres, statuts informatifs (CONFIRMED, INSPECTION) |

**Règle d'or** : le rouge-orange (`primary`) ne doit jamais dépasser ~15% de la surface d'un écran. Le chocolate porte la structure, l'or ponctue, le rouge-orange agit.

---

## 2. Typographie & Hiérarchie

### 2.1 Couple de polices (Google Fonts)

- **Titres — `--font-heading`** : **"Fraunces"** (serif élégante, avec un axe optique variable, chaleureuse et haut de gamme — écho aux empattements travaillés du "RESTO-BAR" du logo, mais raffinée). Graisses utilisées : 600 (SemiBold) et 900 (Black) pour les très grands titres hero.
  - Alternative si besoin d'un rendu plus géométrique/contemporain : **"Fraunces"** pour l'émotion + garder cette police unique pour toute la hiérarchie de titres.
- **Corps de texte — `--font-body`** : **"Plus Jakarta Sans"** (sans-serif ultra-lisible, chaleureuse, excellent rendu sur mobile). Graisses : 400 (Regular), 500 (Medium), 600 (SemiBold pour labels/boutons).
- **Accent / citations / badges** (optionnel) : **"Fraunces Italic"** pour les accroches ("Le brunch comme on l'aime"), en petites doses uniquement.

```css
--font-heading: 'Fraunces', serif;
--font-body: 'Plus Jakarta Sans', sans-serif;
```

### 2.2 Échelle de tailles (base 16px, ratio ~1.25)

| Token | Taille | Line-height | Poids | Usage |
|---|---|---|---|---|
| `--text-h1` | 3.5rem / 56px (mobile: 2.25rem/36px) | 1.05 | 700–900 | Titre hero |
| `--text-h2` | 2.5rem / 40px (mobile: 1.875rem/30px) | 1.1 | 600–700 | Titres de section |
| `--text-h3` | 1.75rem / 28px | 1.2 | 600 | Sous-titres, titres de carte |
| `--text-h4` | 1.25rem / 20px | 1.3 | 600 | Titres de composants (ex: nom de plat) |
| `--text-body-lg` | 1.125rem / 18px | 1.6 | 400 | Intro de section, texte mis en avant |
| `--text-body` | 1rem / 16px | 1.6 | 400 | Corps de texte standard |
| `--text-body-sm` | 0.875rem / 14px | 1.5 | 400 | Légendes, métadonnées |
| `--text-caption` | 0.75rem / 12px | 1.4 | 500 (uppercase, letter-spacing 0.06em) | Labels, badges, kickers |

**Kickers / éyebrows** (ex: "MENU" avant "Nos Brunchs Signature") : `--text-caption`, couleur `--color-brand-gold`, `letter-spacing: 0.12em`, `text-transform: uppercase`.

---

## 3. Composants UI Clés

### 3.1 Boutons (CTA)

**Bouton primaire**
- Fond : `--color-brand-primary`
- Texte : `--color-text-inverse`, `--text-body` 600, `letter-spacing: 0.01em`
- Padding : `14px 28px`
- `border-radius: 10px` (angle légèrement adouci — jamais 999px/pill, pour rester "restaurant premium" et non "app générique")
- Ombre : `0 4px 14px rgba(232, 73, 29, 0.25)`
- Hover : fond `--color-brand-primary-hover`, translateY(-1px), transition 200ms ease
- Active : translateY(0), ombre réduite
- Disabled : fond `#E7DED2`, texte `--color-text-secondary`, aucune ombre

**Bouton secondaire (outline)**
- Fond transparent, bordure `1.5px solid --color-brand-chocolate`
- Texte `--color-brand-chocolate`
- Hover : fond `--color-brand-chocolate`, texte inversé

**Bouton tertiaire / lien**
- Pas de fond, texte `--color-brand-chocolate` avec soulignement animé au hover (largeur 0→100%, 250ms)

**Bouton "Or" (VIP / réservation premium)**
- Fond `--color-brand-gold`, texte `--color-brand-chocolate` (jamais blanc sur or — contraste insuffisant)
- Réservé aux actions à forte valeur : "Réserver une table VIP", "Devenir membre"

### 3.2 Cartes & Conteneurs

- Fond : `--color-bg-base` ou blanc `#FFFFFF` selon contexte
- `border-radius: 16px`
- Bordure fine optionnelle : `1px solid --color-border`
- Ombre portée (soft shadow, jamais de noir dur) :
  ```css
  box-shadow: 0 2px 8px rgba(43, 26, 20, 0.04), 0 8px 24px rgba(43, 26, 20, 0.06);
  ```
- Hover (cartes cliquables — ex: carte plat/menu) :
  ```css
  box-shadow: 0 8px 20px rgba(43, 26, 20, 0.08), 0 16px 40px rgba(43, 26, 20, 0.10);
  transform: translateY(-2px);
  ```
- Image dans carte : `border-radius: 12px` en interne (légèrement inférieur au conteneur), `object-fit: cover`, ratio 4:5 ou 1:1 selon grille

### 3.3 Iconographie

- Style : **icônes filaires fines** (stroke-width 1.5px), coins légèrement arrondis — cohérent avec la finesse de la fourchette/couteau/cuillère du logo
- Bibliothèque recommandée : **Phosphor Icons** (weight "light" ou "regular") ou **Lucide**
- Couleur par défaut : `--color-brand-chocolate` ; accent or uniquement pour icônes de notation/étoiles/statut VIP
- Taille standard : 20px (UI courante), 32px (mise en avant, ex: icônes de catégories menu)
- Jamais d'icônes 3D, emoji, ou glyphes remplis criards

### 3.4 Éléments décoratifs signature (issus du logo)

- **Arc courbé fin** (repris des lignes orange/or du logo) utilisable comme séparateur de section ou soulignement de titre — en SVG trait fin, couleur `--color-brand-gold` ou `--color-brand-primary` à 40% d'opacité
- **Étoiles** : à réserver aux notations clients et badges "VIP" / "Signature" — jamais décoratives en fond de page

---

## 4. Layout, Espacement & Grille

### 4.1 Grille

- **Desktop** : grille 12 colonnes, `max-width: 1280px`, gouttière 24px, marges latérales 80px (≥1440px) / 48px (1024–1439px)
- **Tablette** : grille 8 colonnes, marges 32px
- **Mobile** : grille 4 colonnes, marges 20px, gouttière 16px

### 4.2 Échelle d'espacement (base 8px)

| Token | Valeur |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 16px |
| `--space-4` | 24px |
| `--space-5` | 32px |
| `--space-6` | 48px |
| `--space-7` | 64px |
| `--space-8` | 96px |
| `--space-9` | 128px |

- Espacement vertical entre sections majeures : `--space-8` / `--space-9` (96–128px) sur desktop, `--space-6` sur mobile
- Padding interne carte : `--space-4` à `--space-5`

### 4.3 White space

- Le "respire" est un élément de marque à part entière : ne jamais coller deux blocs de contenu sans un espace d'au moins `--space-6`
- Une section hero doit avoir minimum 70% de hauteur d'écran avec un seul point focal (photo + titre + un CTA)
- Éviter plus de 3 CTA visibles simultanément sur un même écran

---

## 5. Directives pour éviter le "look IA générique"

- ❌ Aucun dégradé arc-en-ciel ou multicolore saturé — dégradés autorisés uniquement en **duo de tons de la même famille** (ex: chocolate foncé → chocolate profond, pour un hero sombre), toujours subtils
- ❌ Aucune illustration 3D plastique, aucun blob vectoriel générique, aucun pattern "IA stock"
- ❌ Aucune icône remplie flashy ni emoji dans l'UI de production
- ✅ Photographie réelle haut de gamme uniquement : plats, ambiance du lieu, portraits clients — traitement colorimétrique chaud légèrement désaturé pour matcher la palette chocolate/or
- ✅ Alignement pixel-perfect : toute grille de cartes doit être parfaitement alignée sur la baseline typographique
- ✅ Un seul accent vif par écran maximum (le rouge-orange du CTA) — le reste de la hiérarchie visuelle repose sur le contraste chocolate/crème et les micro-touches d'or
- ✅ Micro-interactions discrètes (200–250ms ease-out) plutôt que des animations spectaculaires
- ✅ Priorité à la typographie et à l'espacement plutôt qu'à la décoration : si un écran a besoin d'un ornement pour "faire premium", c'est que la hiérarchie typographique n'est pas encore juste

---

## 6. Tokens CSS — récapitulatif prêt à l'emploi

```css
:root {
  /* Couleurs de marque */
  --color-brand-primary: #E8491D;
  --color-brand-primary-hover: #C93C15;
  --color-brand-primary-tint: #FBE6DE;
  --color-brand-chocolate: #3A1E17;
  --color-brand-chocolate-soft: #5C3A2E;
  --color-brand-gold: #D9A441;
  --color-brand-gold-hover: #C4903A;      /* hover bouton gold — assombrissement */
  --color-brand-gold-light: #F0D9A0;

  /* Feedback / Statuts */
  --color-status-success: #3F7D5C;
  --color-status-error: #B23A2E;
  --color-status-warning: #9A6B1A;        /* statuts à traiter, non bloquants */
  --color-status-info: #5C7A8A;

  --color-bg-base: #FDFBF8;
  --color-bg-subtle: #F5F0E9;
  --color-bg-dark: #231310;
  --color-border: #E7DED2;
  --color-border-strong: #D8CBB8;
  --color-text-primary: #2B1A14;
  --color-text-secondary: #7A6A5C;
  --color-text-inverse: #FDFBF8;

  /* Typo */
  --font-heading: 'Fraunces', serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;

  /* Rayons & ombres */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-soft: 0 2px 8px rgba(43,26,20,0.04), 0 8px 24px rgba(43,26,20,0.06);
  --shadow-hover: 0 8px 20px rgba(43,26,20,0.08), 0 16px 40px rgba(43,26,20,0.10);

  /* Espacement */
  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 48px; --space-7: 64px; --space-8: 96px; --space-9: 128px;
}
```
