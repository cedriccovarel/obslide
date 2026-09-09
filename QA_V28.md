# QA V28

Contrôles statiques effectués sur la base V27.8 :

- `node --check app.js` : OK.
- Deux nouvelles typologies présentes dans les defaults, le catalogue, le rendu écran, les contrôles et le moteur Canvas d’export : OK.
- `Répartition bailleurs / promoteurs` autorisée dans le moteur PNG 4K sécurisé : OK.
- `Maîtres d’ouvrage` autorisée dans le moteur PNG 4K sécurisé : OK.
- Export classeur : les nouvelles typologies passent par le même traceur Canvas local que les autres slides de contenu.
- Aucun `drawImage()` DOM n’est nécessaire pour ces deux nouvelles slides : graphiques et tableau sont tracés en CSS/Canvas natif.
- Aucune mention « Référentiel principal » ni « Typologie dominante » dans les deux nouvelles slides.
- Renommage des onglets : champ `tabNames` persistant dans la sauvegarde locale / JSON.
- Données indépendantes entre copies : mécanisme `instanceData` conservé.
- Format slide : 1600 × 900, ratio 16:9.

Limite de l’environnement de test : Chromium headless ne parvient pas à charger les pages `file://` dans ce conteneur (blocage environnemental). Les contrôles ci-dessus sont donc des validations de structure, de syntaxe et de chemin d’export, pas un test visuel end-to-end dans Chrome.
