# Obslide V29.25.0 — unité des cartes département / région — 26/11/2026

Demande : laisser le choix de l'unité des cartographies par département et par région.

| Fichier | Modification |
|---|---|
| `app.js` | Réglage « Unité » de la slide carte : nombre d'opérations (par défaut, comportement inchangé), de logements ou de bâtiments. En données connectées, les valeurs sont recalculées depuis les colonnes logements / bâtiments des opérations (mêmes champs que la slide des maîtres d'ouvrage). Titre, sous-titre, encart « Une bulle = … », « TOTAL … », zoom Île-de-France et réglages suivent l'unité. Ligne d'alerte « N opérations sans logements / bâtiments renseignés ». En mode manuel, l'unité change les libellés : les valeurs saisies ou collées sont dans cette unité. |
| `index.html` | Version V29.25.0. |

## Essais (Chrome sans interface, copie locale, fichier OPERATIONS fictif `fr_utf8.csv`)

| Essai | Résultat |
|---|---|
| Opérations (défaut) | 4 opérations, titre « CARTOGRAPHIE DES OPÉRATIONS », inchangé |
| Logements | 1 282 logements ; « CARTOGRAPHIE DES LOGEMENTS » ; « 2 opérations sans logements renseignés » |
| Bâtiments | 8 bâtiments ; titres adaptés |
| Retour aux opérations | 4, libellés d'origine |
| Vue région + bâtiments | régions recalculées, « Répartition des bâtiments par région » |
| Console | aucune erreur |

## Compléments V29.25.0 (même jour)

| Fichier | Modification |
|---|---|
| `analytics-slides.js` | « Volume par client et famille de MOA » : menu TOP 3 / 5 / 10 / 15 / 20 + champ libre « TOP : nombre libre » (1 à 50), synchronisés ; titre « Principaux clients — TOP N » ; barres resserrées au-delà de 12 et 25 clients. La valeur existante (12) est conservée et affichée « TOP 12 (personnalisé) ». |
| `app.js`, `style.css` | Mode Présentation : la barre « Filtres de la slide active » n'était pas déduite de la hauteur → bas des slides coupé (toutes slides). Masquée en Présentation. |
| `app.js`, `style.css` | « Répartition bailleurs / promoteurs » : légende compacte au-delà de 4 catégories, regroupement « Autres (n catégories) » au-delà de 7 (écran et PNG). |
| `app.js`, `style.css` | Case « Limiter au périmètre Observatoire » dans la barre des filtres (si un périmètre est transmis). Décochée : toutes les opérations reçues (Observatoire ≥ V6.67 : périmètre + contrats hors filtre) ou toute la source chargée. Réglage gardé sur le poste (clé `obslide.perimetre.tous.v1`). Avec un Observatoire plus ancien : case grisée (infobulle). Les exigences restent celles transmises par l'Observatoire. Badge « N opérations » = opérations réellement utilisées. |

Observatoire V6.67 (dépôt observatoire-prestaterre-beta, non poussé) : `generatorHandoffData` envoie `otherOperationRows` (contrats disponibles hors du périmètre filtré, comparés par code, anonymisés comme les autres lignes) ; écran de chargement : coulure sous la tête de clou ; 251 tests OK.

| Essai (pont simulé, 6 opérations dont 4 dans le périmètre) | Résultat |
|---|---|
| Case cochée | badge 4 opérations, slides sur 4 |
| Case décochée | badge 6, « Évolution » total 6, bandeau « (non appliqué) » |
| Re-cochée | retour à 4 |
| Observatoire sans complément | case grisée, comportement inchangé |
| TOP 12 → TOP 3 → libre 2 | 3 puis 2 lignes, menu synchronisé |
| Bailleurs / promoteurs, 6 catégories longues, Présentation | légende dans la carte, slide entière à l'écran |
| Non-régression pont normal + carte unités | identique |
