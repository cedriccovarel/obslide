# Générateur de slides — Observatoire

Site statique prêt pour GitHub Pages. Aucun build, aucune base de données et aucun serveur applicatif ne sont nécessaires.

## Fonctions

- 5 onglets correspondant aux 5 slides :
  1. Labels & performances
  2. Production de chaleur / ECS / refroidissement / ventilation
  3. Mode constructif / isolations
  4. Indicateurs carbone
  5. Cartographie par département
- Listes déroulantes enrichies pour les principaux systèmes de chauffage, ECS, refroidissement et ventilation, avec option personnalisée.
- Saisie manuelle des occurrences, pourcentages et indicateurs.
- Mise à jour instantanée des barres, donuts et curseurs.
- Repères des labels et performances entièrement éditables.
- Données conservées localement dans le navigateur via `localStorage`.
- Export de la slide active en PNG 4K 16:9 : **3840 × 2160 px**.
- Bouton de réinitialisation indépendant pour chaque onglet.
- Cartographie France par département sur fond blanc, contours vert forêt, bulles proportionnelles aux projets et zoom Île-de-France.
- Saisie cartographique par copier-coller ou directement dans la liste des départements. Les données sont mémorisées dans le navigateur.

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
