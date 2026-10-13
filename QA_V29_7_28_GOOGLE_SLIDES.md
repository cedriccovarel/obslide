# QA V29.7.28 — Export Google Slides / PowerPoint éditable

## Fonctionnalité
- Bouton **Google Slides** dans la barre d'outils générale.
- Portée **Toutes les slides** (dans l'ordre de la présentation enregistrée) ou **Slide active**.
- Téléchargement d'un fichier `.pptx` 16:9 à ouvrir dans Google Slides via Google Drive.
- **Textes** : objets PowerPoint texte natifs (`p:sp` avec `a:t`), modifiables dans Google Slides après conversion du PPTX.
- **Graphiques SVG** : les tracés SVG présents dans l'aperçu sont intégrés comme objets SVG distincts, avec les labels reconstruits en vrais textes modifiables.
- **Logos** Prestaterre et Action Logement livrés en SVG *réellement vectorisé* (chemins `<path>`, sans `<image>` bitmap). Pour un logo ajouté par l'utilisateur, vectorisation approximative par aplats au moment de l'export lorsque le navigateur autorise la lecture de l'image.
- **Photos et fonds photographiques** restent des images ; ce ne sont pas des contenus vectoriels.
- Les SVG source des trois logos connus sont livrés dans `assets/*_traced.svg`.
- Le lecteur PptxGenJS est embarqué dans le ZIP : aucune connexion tierce nécessaire pour produire le PPTX.
- L'export n'altère pas la slide active, son état ou les défilements.

## Tests effectués
- `node --check` sur `app.js` et `google-slides-export.js` : OK.
- Génération réelle d'un PPTX 16:9 de contrôle avec PptxGenJS : OK.
- Inspection OpenXML (`ppt/slides/slide1.xml`) : 4 objets texte natifs modifiables, incluant le titre, le sous-titre, une clé de lecture chiffrée et une valeur de décile : OK.
- Présence de **deux SVG** dans `ppt/media/` : un graphe et un logo Prestaterre retracé : OK.
- Rendu de la slide de contrôle par LibreOffice : OK, image contrôlée visuellement.
- Parsing XML SVG des logos : OK, aucun élément bitmap `<image>`.
- Moteur navigateur chargé depuis le fichier `assets/pptxgen.bundle.js`, qui fournit `window.PptxGenJS` : OK lors du contrôle de la distribution.

## Limites explicites
- Google Slides n'accepte pas de SVG directement via son API. L'application exporte donc un PPTX **à importer dans Google Slides** : elle ne crée pas directement une présentation dans le compte Google de l'utilisateur.
- L'import PPTX par Google peut **rasteriser certains objets SVG**. Les textes sont des objets séparés et restent éditables ; un logo ou un graphique SVG peut rester une image (non modifiable point par point).
- Certains rendus CSS complexes (ombres, filtres, dégradés, styles en pseudo-éléments) peuvent différer du rendu navigateur. Les zones de texte, géométries simples et SVG sont privilégiés plutôt qu'une capture globale.
- Essai fonctionnel dans un navigateur authentifié avec le vrai jeu de slides et import réel dans Google Slides **non réalisé** (environnement navigateur local bloqué). L'export doit être vérifié sur les cas réels avant diffusion large.
