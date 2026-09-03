# QA exports — V26

Base de travail : V22.

## PNG 4K
Test automatisé dans Chromium sur les 11 onglets. Chaque export a été généré puis relu comme image PNG.

- 0. Couverture — OK — 3840 × 2160
- 1. Évolution des projets — OK — 3840 × 2160
- 2. Cartographie départements — OK — 3840 × 2160
- 3. Labels & performances — OK — 3840 × 2160
- 4. Tunnel de certification — OK — 3840 × 2160
- 5. Construction & isolation — OK — 3840 × 2160
- 6. Équipements — OK — 3840 × 2160
- 7. Transition chauffage — OK — 3840 × 2160
- 8. Transition ECS — OK — 3840 × 2160
- 9. Indicateurs carbone — OK — 3840 × 2160
- 10. DPE avant / après — OK — 3840 × 2160

## Points spécifiques contrôlés
- Couverture : fond, logo client et date présents dans le PNG.
- Équipements : bâtiment dessiné sans étirement horizontal ; ratio de l'image conservé.
- Construction & isolation : même géométrie de bâtiment que l'onglet Équipements.
- Tunnel : export autonome via traceur Canvas ; frise et valeurs rendues.
- Cartographie : le titre et le bandeau d'aide sont maintenant intégrés à l'export, avec la carte positionnée dans la même zone que l'écran.

## Classeur PDF
- Génération testée : OK.
- Nombre de pages : 11.
- Format : 16:9, 960 × 540 pt par page.
- La couverture et la page Équipements ont été re-rendues depuis le PDF pour contrôle visuel.

## Authentification
Le mot de passe n'est pas stocké en clair dans les fichiers ; seule son empreinte SHA-256 est présente dans `auth.js`.


## V27.8 — contrôle anti-tainted canvas
- Couverture : fond et logo exportés uniquement depuis data URL.
- Tunnel : les 4 pictogrammes de phase sont embarqués en data URL ; aucun <img> DOM n'est dessiné dans le canvas.
- Construction & isolation / Équipements : bâtiment exporté uniquement depuis BUILDING_DATA_URL embarquée.
- Labels, Evolution, Matrices, Carbone, DPE, Slide vide : aucun média externe n'est dessiné dans le canvas.
- Cartographie : export SVG administratif dédié, sans image externe.
- Le chemin PNG 4K / Export classeur n'utilise plus de drawImage provenant d'un élément image du DOM.
