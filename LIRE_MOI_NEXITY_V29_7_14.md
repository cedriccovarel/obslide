# Obslide V29.7.14 - Cartographie Nexity par direction régionale

Cette version reprend le paquet V29.7.13 fourni et ajoute la slide **Nexity - Directions régionales**. Le fond et le zoom Île-de-France sont extraits du PDF fourni : *Carte Organisation IR - DR multi-produits*, Nexity / Direction du Marketing Stratégique et Études, 02/07/2026, organisation applicable au 01/07/2026.

## Installer

Sauvegarder d'abord la présentation actuelle avec le bouton **Sauvegarder** (JSON). Décompresser le ZIP, puis remplacer les fichiers de l'application par le contenu du dossier `obslide_v29_7_14_nexity`, en conservant son arborescence. Le fichier `index.html` doit rester au même niveau que `app.js`, les nouveaux fichiers `nexity-*.js` et le dossier `assets`.

Ouvrir `index.html` ou le site habituel. La nouvelle slide s'ajoute après la cartographie départementale. Elle est aussi disponible dans **Ajouter slide**. Les feuilles, titres, mises en forme et moteurs des autres slides restent ceux de la base fournie. Les fichiers `auth.js`, `style.css` et `Code.gs` sont inchangés.

**Aucune modification du Google Apps Script n'est nécessaire pour cet ajout.** Le script fourni renvoie déjà toutes les colonnes non vides. La colonne DIRECTION RÉGIONALE doit naturellement exister dans la source pour que cette information soit exploitable.

## Charger le tableau Nexity

Dans la nouvelle slide, choisir **Tableau Nexity importé**, puis sélectionner un fichier `.xlsx`, `.csv` ou `.tsv`. Le collage direct d'un tableau Excel avec ses en-têtes est aussi disponible.

L'assistant permet de choisir la feuille, la ligne d'en-têtes et les colonnes. Il affiche un aperçu avant validation. L'ordre des colonnes est libre. Les colonnes utilisées sont :

| Colonne | Usage |
| --- | --- |
| DIRECTION RÉGIONALE | Obligatoire : rattachement au référentiel de la carte fournie |
| Code interne | Clé du projet ; conseillée pour éviter les doubles comptes |
| Nom de l'opération (interne) | Nom dans la liste détaillée |
| Maître d'ouvrage: Nom de la société | Filtre facultatif |
| Année ou Date de création | Filtre facultatif |

L'import est local au navigateur et n'écrase pas la connexion Google Sheets ni le tableau source. Les cellules fusionnées dans les colonnes sélectionnées sont prises en compte uniquement si la fusion est explicitement enregistrée dans le XLSX. Les cellules simplement vides ne sont pas propagées automatiquement.

Pour utiliser la base déjà connectée à l'application, choisir **Base connectée (bouton Données)**. Cette source et le tableau local restent indépendants.

## Règles de comptage et contrôles

Un Code interne identique est compté une seule fois, y compris si plusieurs lignes d'analyse ou de bâtiment existent. Les lignes sources sont conservées dans le détail. Sans code, chaque ligne est comptée séparément et signalée dans les contrôles : le nom seul ne suffit pas à fusionner des projets.

Le rattachement repose exclusivement sur **DIRECTION RÉGIONALE**. Il n'est pas recalculé depuis une ville, un code postal ou un département. Les accents, la casse et la ponctuation courante des noms sont normalisés pour comparer les libellés ; les valeurs sources restent conservées.

Un projet ayant plusieurs directions contradictoires n'est pas affecté arbitrairement à la première. Il est compté une fois dans **Non rattachés / à vérifier**. Les valeurs absentes et inconnues restent aussi visibles. Les libellés non reconnus peuvent être rattachés manuellement à une direction du référentiel ; cette correspondance peut être retirée.

Les pourcentages utilisent le total des projets sélectionnés, y compris les non-rattachés. Ils ne sont pas calculés sur le nombre de lignes techniques. Les filtres Direction régionale / Année / Maître d'ouvrage sont placés dans la barre horizontale et restent propres à chaque copie de slide.

## Lire la carte

Le fond conserve le découpage et les couleurs de la source Nexity. Plusieurs directions peuvent donc partager une couleur : les couleurs de la source ne représentent pas vingt DR distinctes. Des repères 01 à 20 ont été ajoutés pour relier la carte à sa liste. Ces numéros sont des aides de lecture, pas des codes officiels Nexity.

**Chaque bulle affiche un total par DR, pas la position géographique précise des projets.** Cliquer sur une bulle ou un nom ouvre la liste des projets, avec recherche et export CSV. Le fond national et son encart IDF sont des images extraites du PDF ; aucun contour administratif nouveau n'a été inféré.

Le document cite « Océan » dans un regroupement, mais ne le présente pas comme une DR autonome sur la carte. Ce libellé n'est donc pas converti automatiquement en Atlantique ou dans une autre DR. De même, la mention 91/77/60 de l'Est Grande Couronne est conservée sans tenter de réconcilier automatiquement les couleurs du fond national avec cet encart. La valeur du tableau fait foi pour chaque projet.

### Référentiel repris de la source

| Repère de lecture | DIRECTION RÉGIONALE |
| --- | --- |
| 01 | NORD |
| 02 | EST |
| 03 | NORMANDIE |
| 04 | BRETAGNE |
| 05 | ATLANTIQUE |
| 06 | CENTRE |
| 07 | VAL-DE-LOIRE |
| 08 | RHONE-BOURGOGNE-AUVERGNE |
| 09 | ALPES |
| 10 | AQUITAINE |
| 11 | PAYS BASQUE |
| 12 | MIDI-PYRENEES |
| 13 | LANGUEDOC |
| 14 | GRAND MARSEILLE |
| 15 | VAR |
| 16 | ALPES-MARITIMES |
| 17 | OUEST GRANDE COURONNE 78/95 |
| 18 | EST GRANDE COURONNE 91/77/60 |
| 19 | PETITE COURONNE 92/93 |
| 20 | AGENCE 94 |

## Sauvegarde, export et limites

La nouvelle slide utilise les boutons habituels : PNG 4K (3840 x 2160), SVG et Export classeur. Le SVG est autonome : le fond est une image embarquée et les compteurs/textes ajoutés sont vectoriels. Les tailles de texte respectent les curseurs globaux et de slide, avec ajustement pour rester dans les espaces disponibles.

La sauvegarde JSON conserve les lignes importées, les correspondances manuelles, les filtres et les copies. La sauvegarde automatique du navigateur reste soumise à son quota de stockage ; conserver un JSON pour les jeux de données importants.

Le lecteur XLSX n'évalue aucune formule : il utilise la valeur enregistrée dans le fichier. En cas de formule sans résultat mémorisé, l'assistant avertit de recalculer et enregistrer le classeur dans Excel. Le lecteur n'accepte pas les anciens `.xls`, les fichiers chiffrés, les archives ZIP64 ou plus de 50 000 lignes / 30 Mo. Le navigateur doit prendre en charge `DecompressionStream('deflate-raw')` pour le XLSX ; sinon utiliser CSV ou collage.

La nouvelle cartographie et ses exports n'ont pas besoin d'un service cartographique externe. Les anciennes cartographies de l'application conservent leurs propres dépendances réseau.

Le pack contient la carte d'organisation Nexity et son PDF source dans `assets`. Ils sont donc des ressources du site lors du déploiement. Le tableau importé localement, lui, n'est pas automatiquement publié dans le dépôt.

**Le tableau réel des projets Nexity n'a pas été fourni avec les ZIP ni avec le PDF. La nouvelle slide est livrée sans effectifs préchargés, prête à l'import. Aucun jeu de test n'est chargé par défaut.**
