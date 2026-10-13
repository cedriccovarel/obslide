# QA V29.9 — Slides « Exigences »

Base : Obslide V29.8 (V29.7.29 + export PPTX fidèle). Les slides et fonctions existantes ne changent pas.

## Nouveauté : type de slide « Exigences »

Menu **Ajouter slide ▾ → Exigences**. Le type peut être ajouté plusieurs fois : chaque slide garde sa vue, son titre et ses filtres.

### Source de données

C'est la même que l'onglet Exigences de l'Observatoire : l'export **RAPPORT**, avec une ligne par exigence retenue dans une évaluation.

- Import dans le panneau de gauche : dépôt d'un fichier Excel `.xlsx`, CSV ou TSV, ou collage depuis Excel / Google Sheets.
- Les colonnes sont reconnues automatiquement, quel que soit leur ordre :

| Statut | Colonnes |
|---|---|
| Indispensables | `Évaluation: Code interne` (à défaut `Évaluation: Opération: Code interne`) et `Exigence associée: Nom` (ou `Code d'exigence`) |
| Facultatives | `Code d'exigence`, `Exigence validée`, `Évaluation: Statut`, `Évaluation: Opération: Référentiel: Nom du référentiel`, version du référentiel, maître d'ouvrage, `Évaluation: Opération: Mentions`, région, année ou date de création |

- **La base est commune à toutes les slides Exigences.** Elle est enregistrée avec le projet (stockage du navigateur et bouton **Sauvegarder**) sous une forme compacte : environ 0,5 Mo pour 7 700 lignes.

### Règles de calcul (identiques à l'Observatoire)

- Une évaluation = un dossier.
- Une exigence n'est comptée qu'une fois par dossier (couple évaluation + exigence).
- La cible (1 à 4) est le premier chiffre du code d'exigence.
- Neuf ou Rénovation est déduit du nom du référentiel.
- Les pourcentages sont des **parts de dossiers** : « 39 % » = 39 % des dossiers du périmètre ont retenu l'exigence.
- Année retenue, dans cet ordre : année de l'opération, sinon date de création de l'évaluation, sinon année de version du référentiel. La base utilisée est rappelée en bas de chaque slide.

### Les 5 vues (inspirées de l'onglet Exigences de l'Observatoire)

1. **Vue d'ensemble** : dossiers analysés, exigences retenues, Neuf, Rénovation ; répartition par cible ; Top 8 des exigences.
2. **Exigences les plus récurrentes** : classement Top 5 à 15, avec pastille de code colorée par cible, part et nombre de dossiers.
3. **Exigences par cible** : les 4 cibles côte à côte, Top 5 de chacune, barre séparant Neuf et Rénovation.
4. **Évolution par année** : carte de chaleur (Top N × années), part des dossiers de chaque année.
5. **Mentions & exigences associées** : mentions les plus demandées ; exigences retenues par les dossiers de la mention choisie, avec l'écart en points par rapport à l'ensemble du panel.

### Filtres propres à chaque slide

Neuf / Rénovation, années de… à…, mention, maître d'ouvrage, référentiels, statut de l'évaluation, exigences validées uniquement. Le périmètre retenu est écrit en bas de la slide.

### Exports

Les slides sont dessinées en SVG, comme « Distribution carbone ». Elles fonctionnent donc avec :

- le PNG 4K ;
- le SVG ;
- l'export classeur (PDF) ;
- l'export **Google Slides / PPTX fidèle**, où tous les textes restent modifiables.

## Correctifs inclus

- **Slides qui réapparaissaient** : après le chargement d'une sauvegarde puis un rechargement de la page, cinq slides supprimées revenaient (Zonage, Bailleurs / promoteurs, Maîtres d'ouvrage, Performances, Mentions). La migration en cause ne s'exécute plus qu'une fois.
- **Export classeur (PDF)** : les slides « Distribution carbone » (et Exigences) sont maintenant dessinées par leur propre moteur. Elles passaient par le dessin générique, qui ne les connaît pas.
- **Stockage du navigateur plein** : un message invite à utiliser « Sauvegarder », au lieu d'une erreur silencieuse.

## Tests effectués (Chromium)

- Chargement de la sauvegarde réelle `c428e42b-bbca.json`, puis ajout de 3 slides Exigences.
- Import d'un export RAPPORT Excel de test, **fictif** : 320 évaluations, 7 690 lignes, intitulés réels du catalogue BEE (`exemples/RAPPORT_test_fictif.xlsx`). Résultat : 320 dossiers, 222 exigences distinctes, en 3,5 s.
- Les 5 vues, les filtres (Rénovation + mention BBCA → 36 dossiers) et le partage de la base entre slides fonctionnent.
- Rechargement de la page : 11 slides avant, 11 après. Sauvegarde JSON puis rechargement dans un navigateur vierge : la slide Exigences revient avec sa vue et ses données.
- PNG 4K : 3840 × 2160. Export PPTX fidèle : validation OOXML réussie, rendu identique à l'écran (`exemples/comparaison_exigences_ecran_vs_pptx.jpg`). Aucune erreur JavaScript.

## Limites

- Les données ne sont pas lues en direct depuis Google Sheets : il faut réimporter l'export RAPPORT pour actualiser.
- Les codes d'exigence ne correspondent pas au même texte en Neuf et en Rénovation : les exigences sont donc identifiées par leur intitulé complet. Un même code peut apparaître deux fois si le périmètre mélange Neuf et Rénovation. Filtrer sur un seul type pour une lecture sans ambiguïté.
- Pas encore repris de l'Observatoire : la compatibilité des opérations avec chaque mention, et les fiches « i » du référentiel.
