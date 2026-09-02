# Générateur de slides — Observatoire

Site statique prêt pour GitHub Pages. Aucun build, aucune base de données et aucun serveur applicatif ne sont nécessaires.

## Fonctions

- 11 onglets, de la couverture au DPE avant/après.
- Onglet **0. Couverture** conforme au modèle fourni : logo client remplaçable et date/période modifiable.
- Mode **Présentation** plein écran : seules les slides et les onglets restent visibles.
- **Export classeur** : génération d’un PDF 16:9 multi-pages contenant tous les onglets.
- Export de la slide active en PNG 4K 16:9 : **3840 × 2160 px**, avec moteur de secours Canvas.
- Sauvegarde/chargement JSON et mémorisation locale via `localStorage`.
- Import Google Sheets pour l’onglet Évolution des projets.
- Cartographie France par département, matrices de transition chauffage/ECS, tunnel de certification, équipements, enveloppe, carbone et DPE.

## Mise en ligne sur GitHub Pages

1. Créer un nouveau dépôt GitHub.
2. Déposer à la racine du dépôt : `index.html`, `style.css`, `app.js` et `.nojekyll`.
3. Dans GitHub : **Settings > Pages**.
4. Dans **Build and deployment**, choisir **Deploy from a branch**.
5. Sélectionner la branche `main` et le dossier `/ (root)` puis enregistrer.
6. GitHub fournit ensuite l’adresse publique du site.


## Sauvegarde des données

- Le bouton **Sauvegarder** enregistre toutes les informations saisies dans les 5 onglets dans un fichier `.json`.
- Sous Chrome / Edge sur GitHub Pages, une fenêtre **Enregistrer sous** permet de choisir le dossier et de renommer le fichier avant l'enregistrement.
- Le bouton **Charger une sauvegarde** permet de rouvrir ensuite ce fichier et de restaurer toutes les données.
- La sauvegarde automatique dans le navigateur (`localStorage`) reste active en complément.

## Export PNG

Le bouton **Exporter PNG 4K** génère un fichier de 3840 × 2160 px, adapté aux présentations PowerPoint et Google Slides en 16:9.

L’export utilise `html2canvas` chargé depuis cdnjs. Le site doit donc avoir accès à Internet au moment de l’export.

## Remarque sur les résistances thermiques R

Les appréciations visuelles associées aux valeurs R sont volontairement présentées comme des repères qualitatifs indicatifs. Elles ne doivent pas être interprétées comme des seuils RE2020 génériques applicables à tous les bâtiments.


## Cartographie

Le fond départemental utilise le GeoJSON public des contours administratifs Etalab. Une connexion Internet est nécessaire lors du premier chargement de la carte.

## Cartographie - chargement du fond

Le fond départemental utilise désormais plusieurs sources de secours successives (GitHub Raw, jsDelivr puis Etalab). Cela évite que la carte soit bloquée si un hébergeur refuse temporairement une requête CORS depuis GitHub Pages.

## Nouveautés V9 — performance énergétique et export

- Dans **Équipements > Performance énergétique moyenne**, l'indicateur d'enveloppe peut être choisi entre **BBio** et **Ubat**.
  - BBio : saisie Bbio initial, Bbio max et gain Bbio.
  - Ubat : saisie Ubat moyen et Ubat de référence ; l'écart est calculé automatiquement.
- Le confort d'été peut être choisi entre **DH** (DH / DH max) et **Tic** (Tic / Tic ref).
- Les clés de lecture affichées dans la slide changent automatiquement selon les indicateurs sélectionnés.
- Le **gain financier moyen** n'utilise plus de curseur.
- Les résistances thermiques R utilisent des échelles adaptées à chaque paroi :
  - toiture : 0 à 10 m²·K/W ;
  - façade : 0 à 6 m²·K/W ;
  - plancher bas : 0 à 7 m²·K/W.
  Des repères qualitatifs sont affichés directement sous chaque jauge ; ils restent indicatifs et ne constituent pas des seuils RE2020 universels.
- L'export PNG principal utilise désormais `toBlob()` afin d'éviter les erreurs mémoire liées aux grandes URL d'image, attend le chargement des images, puis charge `html2canvas` à la demande depuis plusieurs CDN possibles.
- Le bouton **PNG secours** utilise une méthode de rendu distincte. Si aucune bibliothèque secondaire n'est disponible, il bascule sur une conversion native SVG/Canvas du navigateur ; il peut donc fonctionner même si `html2canvas` ne se charge pas.

## Export hors connexion

Le moteur PNG principal peut nécessiter une connexion Internet lorsqu’il doit charger `html2canvas` depuis un CDN. Le bouton **Imprimer / PDF hors-ligne** ne dépend d’aucune bibliothèque externe : il ouvre la slide seule au format 16:9 dans la fenêtre d’impression du navigateur. Choisir **Enregistrer au format PDF** pour obtenir un fichier vectoriel / haute définition.

Le bouton **PNG secours** utilise une méthode native du navigateur quand le moteur principal n’est pas disponible. Selon le navigateur (notamment certaines versions de Safari), la conversion DOM → PNG peut rester limitée ; l’export PDF est alors la solution la plus robuste hors connexion.

## Ubat

En mode Ubat, trois valeurs peuvent être saisies : **Ubat initial**, **Ubat moyen** et **Ubat de référence**. La slide calcule également dans sa clé de lecture l’évolution de l’Ubat moyen par rapport à l’Ubat initial.


## Export

- **PNG 4K** : méthode principale, peut demander Internet si le moteur n'est pas déjà en cache.
- **PNG secours** : méthode alternative automatique.
- **Exporter SVG** : alternative **hors ligne**, fidèle au format 16:9 et importable dans PowerPoint ou Google Slides.


## Nouvelles options d’export

- **PNG hors-ligne** : export direct sans dépendance Internet, à partir d’une version autonome de la slide.
- **Capture** : ouvre la slide seule, en grand format 16:9, prête pour une capture d’écran propre si le PNG échoue encore.
- Les boutons d’action ont été compactés pour tenir sur une seule ligne.


## V13 — export robuste

Les slides 1 à 4 sont maintenant redessinées directement dans un canvas 4K natif au moment de l’export. Le PNG ne dépend donc plus de `html2canvas`, du réseau ou de la conversion du DOM en image. Le bouton **Capture 16:9** ouvre exactement la même image générée dans une zone fixe de **1600 × 900 px**, donc au ratio 16:9.

## V19
- Nouvel onglet « Tunnel de certification » avec volumes modifiables, pourcentages automatiques, période, dossiers annulés/abandonnés et nombre de dossiers soldés.
- Pictogrammes de la frise repris de la slide de référence.
- Équipements : affichage/masquage de chaque thématique par case à cocher.
- Construction & isolation : affichage/masquage de chaque encart et ajout « Menuiseries extérieures ».
- Jauges TIC et DH : borne confortable à gauche, valeur mesurée sur le curseur, référence/max à droite.

### Correctif export PNG V19

L’export PNG 4K tente désormais systématiquement, pour **tous les onglets** :
1. un **rendu SVG → PNG** (méthode prioritaire, la plus fiable),
2. un **rendu canvas natif** en secours,
3. puis `html2canvas` en dernier recours si nécessaire.

Cette logique renforce la compatibilité des onglets 1 à 4, du tunnel, du DPE et de la cartographie.

## Nouveaux onglets — matrices de transition énergétique

Deux onglets permettent de visualiser les changements de vecteur énergétique avant / après travaux :
- **Transition chauffage**
- **Transition ECS**

Les valeurs numériques sont éditables directement dans les cellules de la matrice. Les pourcentages sont recalculés automatiquement **par ligne** (part du vecteur initial), les couleurs s'intensifient avec le volume du flux, et les totaux / indicateurs latéraux se mettent à jour automatiquement. Les cinq vecteurs sont renommables dans le panneau de paramètres.


### Réorganisation des onglets
Ordre retenu : Évolution des projets, Cartographie, Labels & performances, Tunnel de certification, Construction & isolation, Équipements, Transition chauffage, Transition ECS, Indicateurs carbone, DPE avant/après.

Les matrices Chauffage et ECS ont également été recadrées en partie haute et les pourcentages de cellule ont été agrandis.

### Ajustements de mise en page
- Évolution des projets : suppression de l'encart vert supérieur, légende replacée sous le graphique en grille 2 × 2 et agrandie.
- Transition chauffage / ECS : suppression du bandeau vert supérieur de la matrice, recentrage de la partie haute et agrandissement de la légende d'intensité.


## V21
- Ajout d’un écran d’accueil protégé par mot de passe avant l’accès au générateur.
- Session d’accès conservée uniquement pour l’onglet de navigateur courant.
- Tunnel de certification : suppression de la bulle « Phase exécution » (64) et de ses éléments associés ; la frise des phases reste inchangée.


## V26 — base V22 consolidée
- reprise intégrale de la V22 comme base ;
- export PNG 4K sécurisé onglet par onglet ;
- Équipements et Construction & isolation utilisent le même dessin bâtiment avec proportions conservées ;
- Couverture, Tunnel, Évolution, matrices, DPE, carbone et labels disposent d'un rendu Canvas autonome ;
- classeur PDF s'appuie sur le même moteur PNG validé page par page.
