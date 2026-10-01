# Contrôles effectués - V29.7.14 Nexity

## Fonctionnel

- 20 repères distincts, catalogue issu de la carte fournie, fond et encart IDF extraits du PDF.
- 23 assertions unitaires : reconnaissance des noms, regroupement par code, absence de code, conflits, libellés inconnus, filtrage, CSV cité et protection contre les formules CSV.
- Import XLSX testé avec plusieurs feuilles, en-têtes décalées, cellules fusionnées, identifiants formatés avec zéros initiaux, dates et formule sans cache.
- Jeu fictif : 56 lignes -> 53 projets uniques, 50 rattachés et 3 non rattachés. Ces données ne sont pas préchargées dans le paquet.
- Détail par direction, filtres, correspondance manuelle puis retrait, duplication et isolation des filtres, conservation des lignes sources : validés.
- Sauvegarde JSON puis rechargement : validés. Réouverture avec l'état sauvegardé du navigateur : validée.
- Connexion Apps Script testée avec une réponse contrôlée : colonne DR conservée, lignes multiples regroupées, bascule vers la source locale sans perte.

## Rendu et export

- PNG Nexity en 3840 x 2160, SVG autonome et PDF de classeur 3 pages incluant Nexity : générés.
- PNG inspectés visuellement : état vide, jeu fictif et textes agrandis.
- Textes SVG contrôlés aux deux curseurs à 160 % : aucun débordement de la page et aucun chevauchement des textes SVG détecté.
- Exports PNG de 14 types existants contrôlés : couverture, évolution, répartition bailleurs/promoteurs, MOA, performances, mentions, labels, tunnel, enveloppe, équipements, transitions chauffage/ECS, carbone et DPE. Dimensions 3840 x 2160 confirmées.
- Aucun appel réseau externe requis pendant les tests de la nouvelle slide. Aucun message d'erreur JavaScript constaté.

## Préservation et périmètre de validation

`auth.js`, `Code.gs` et `style.css` sont identiques octet pour octet à la base fournie. Les styles ajoutés sont dans `nexity-map.css`. L'entrée auxiliaire `_qa.html` est alignée sur le nouvel index et conserve l'authentification.

Tests réalisés dans Chromium sans interface, avec un banc d'essai local qui injecte les fichiers inchangés de l'application et simule le stockage. La navigation HTTP/file directe était bloquée par la configuration de cet environnement. Les boutons, imports, filtres et exports de production ont été exercés dans ce banc. Aucun déploiement sur le GitHub Pages réel de l'utilisateur n'a été effectué. Les anciens services cartographiques externes et le serveur Apps Script réel n'ont pas été testés en réseau.

Les valeurs réelles de la colonne DIRECTION RÉGIONALE du tableau Nexity restent à vérifier lorsque ce tableau sera importé.
