# QA V27

- `app.js` : validation syntaxique Node OK.
- `auth.js` : validation syntaxique Node OK.
- Barre d’outils contrôlée : seuls Charger, Sauvegarder, Ajouter slide, Présentation, PNG 4K, SVG et Export classeur sont visibles.
- Ajout d’une slide vide testé dans Chromium : OK.
- Modification de la taille du texte d’une slide vide testée : OK.
- Suppression d’un onglet et ré-ajout via « Ajouter slide » : OK.
- Réorganisation d’onglets par glisser-déposer testée : OK.
- Export PNG 4K d’une slide vide testé : téléchargement PNG généré avec succès.


## V27.7 - Couverture export safe
- Le fond de couverture est embarqué directement dans app.js sous forme data URL.
- L'export Canvas ne lit plus l'image de couverture depuis le DOM.
- Les logos utilisateurs sont exportés uniquement depuis leur data URL locale.
- Objectif : supprimer définitivement l'erreur Tainted canvases sur Couverture.
