# QA V29.7.27 — Dropzone tableau carbone

## Ajouts
- Zone glisser-déposer sur la slide Distribution carbone, bouton fichier et collage Excel conservé.
- Import .xlsx (sélection automatique de l'onglet contenant les colonnes carbone), .csv, .tsv et texte collé.
- Reconnaissance souple des en-têtes : Code interne, logements, Stock C, IC composants bâtiment + chantier, IC carbone direct en secours, IC énergie, EGES total, IC lots 1 à 13.
- Accepte tableaux copiés avec tabulations, CSV séparateur point-virgule ou virgule, décimales françaises, Markdown.
- Affichage des champs détectés et du nombre de bâtiments valides par indicateur ; diagnostic IC carbone partiel et présence des lots 1 à 13.
- Bouton modèle de colonnes au format CSV.
- Conservation des données normalisées dans l'état de la slide et les sauvegardes de projets.
- Aucun changement à la logique des déciles par bâtiment (V29.7.26), ni au système d'export.

## Tests automatisés (Node)
- Valeurs manquantes vs zéro ; déciles calculés sur les bâtiments ; logements dédupliqués par code interne : OK.
- Reconnaissance des intitulés et de lots 1, 2 et 13 : OK.
- Collage TSV Excel, CSV français point-virgule, CSV virgule, tableau Markdown : OK.
- En-tête décalé (ligne 2) : OK.
- IC carbone composant + chantier et IC carbone directement importé (secours) : OK.
- Import multi-feuilles XLSX **avec lecteur XLSX simulé** : sélection de la bonne feuille et normalisation des données OK.
- Import CSV réel via API File simulée : OK.
- JavaScript vérifié avec `node --check`.

## Limites
- Formats `.xls` anciens non pris en charge : réenregistrer en `.xlsx` ou `.csv`.
- Lecteur XLSX natif conservé de Nexity, non modifié. L'ouverture de fichiers XLSX réels en navigateur reste à vérifier avec les documents de production.
- Les colonnes sans valeurs restent absentes ; pour l'IC carbone composants + chantier, les deux valeurs sont nécessaires sur une ligne. L'IC carbone direct est un secours explicite.
- Aucun recodage des émissions EGES depuis ses sous-composants : EGES total reste la donnée utilisée.
- Nécessite l'essai visuel dans le navigateur cible, la prévisualisation Chromium headless n'étant pas disponible dans cet environnement.
