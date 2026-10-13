# Obslide V29.7.25 — Jauges carbone et clés de lecture chiffrées

## Corrections
- Refonte des cartes SVG : contenu borné dans chaque carte, onze déciles sur deux lignes, encart d'interprétation en bas, aucun texte SVG HTML/foreignObject.
- Répartition automatique : 1 pleine largeur ; 2 deux colonnes ; 3 deux cartes au-dessus et une pleine largeur dessous ; 4 grille 2x2.
- Pour chaque indicateur : bâtiments renseignés, projets distincts renseignés / total projets, taux de projets renseignés.
- Bande de dix tranches D1 à D10 : part des projets dans chaque tranche. Chaque code interne est compté une fois ; classification suivant la moyenne des bâtiments valides du projet, par rapport à la distribution des valeurs de bâtiments. Les déciles numériques D0...D10 restent fondés sur les bâtiments.
- Une interprétation calculée pour chacun des quatre indicateurs : Stock C, IC carbone, IC énergie et EGES ; unité EGES conservée comme unité du fichier source ; Stock C en kgC/m² (pas en kgCO2).
- Slide lots 1-13 : texte d'interprétation chiffré basé sur le lot le plus contributeur, % de projets renseignés pour chaque lot.
- Conservation du modèle JSON, des réglages et du mécanisme d'export SVG/PNG.

## QA réalisée
- Contrôle de syntaxe JavaScript : OK.
- Jeu d'essai : 50 lignes bâtiment, 30 codes projet distincts, données manquantes, lots 1..13.
- Pour chaque indicateur : somme des effectifs des 10 tranches = projets renseignés ; parts des projets totalisent 100 %.
- Génération SVG pour 1, 2, 3 et 4 jauges ; contrôle que chaque carte contient sa clé, ses pourcentages et les déciles.
- Rendu des quatre mises en page et de la slide lots en PNG pour vérification visuelle.
- Le rendu effectif avec données réelles et les interactions du navigateur restent à valider lors du déploiement.
