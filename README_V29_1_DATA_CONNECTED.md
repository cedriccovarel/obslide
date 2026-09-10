# Prestaterre Slide Generator V29.1 — Data Connected étendu

Cette version étend la V29 à l'ensemble des slides pouvant être calculées depuis l'onglet `OPERATIONS`.

## Filtres par slide
Quand une source est connectée, chaque slide compatible affiche en tête de ses paramètres un bloc **Données de cette slide**. On peut choisir :
- Référentiel
- Nature
- Année min
- Année max

Les filtres sont indépendants pour chaque slide. Il est donc possible de dupliquer une slide puis de conserver :
- une vue tous référentiels ;
- une vue BEE Logement Neuf ;
- une vue BEE Logement Rénovation.

## Source Google Sheets
Le `Code.gs` fourni lit :
- ligne 2 : en-têtes ;
- ligne 4 et suivantes : données.

## En-têtes métier
La V29.1 reconnaît notamment les noms réels d'export Prestaterre : `Code interne`, `Maître d'ouvrage: Nom de la société`, `Référentiel: Nom du référentiel`, `Avancement`, `Mentions`, `Performance`, les champs enveloppe, équipements, énergie, carbone et DPE communiqués pour ce projet.

## Comptage
Les lignes sont regroupées par `Code interne` pour éviter de compter plusieurs fois une opération si plusieurs bâtiments sont présents dans la source. Les lignes source restent conservées pour les calculs techniques et les moyennes.

## V29.2
Le tunnel suit désormais directement `Évaluation: Statut` avec une bulle par étape. Les cellules multi-valeurs `Mentions` et `Performance` sont éclatées en occurrences, avec déduplication par opération.
