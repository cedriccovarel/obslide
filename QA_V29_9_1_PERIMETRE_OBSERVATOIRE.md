# QA V29.9.1 — Périmètre transmis par l'Observatoire

Base : Obslide V29.9. Les slides et exports existants ne changent pas.

## Fonctionnement

- Dans l'Observatoire Prestaterre, le bouton **Générateur de rapports** enregistre la liste des codes
  d'opérations affichées (après tous les filtres globaux, filtres d'analyse et recherche) puis ouvre
  Obslide avec `?newosbScope=<jeton>`. Les deux sites sont sur le même domaine (`cedriccovarel.github.io`) :
  ils partagent le stockage du navigateur. Le périmètre est valable 24 h.
- Obslide ne garde que ces opérations dans toutes les slides connectées à la source (évolution,
  cartographie, tunnel, répartitions…) : les filtres propres à chaque slide s'appliquent en plus.
- Slides **Exigences** : seuls les dossiers des opérations transmises sont comptés (colonne
  « Évaluation: Opération: Code interne » de RAPPORT). Une base importée avant cette version ne contient
  pas ce code : le périmètre est signalé « non appliqué », il suffit de réimporter l'export RAPPORT.
- La barre de filtres affiche « Périmètre Observatoire » (résumé des filtres, nombre d'opérations) ;
  la croix × retire le périmètre et revient à toutes les opérations de la source.
- En mode anonymisé, l'Observatoire transmet les vrais codes (les pseudonymes ne sont pas connus d'Obslide).

## Vérifications

- Source de 10 opérations, périmètre de 3 codes → la barre indique 3 opérations ; après × → 10.
- Périmètre retiré : l'URL ne contient plus `newosbScope` et le stockage est effacé.
- Slides Exigences : 3 dossiers sans périmètre, 2 avec un périmètre de 2 opérations.

# V29.9.2 — Données reçues de l'Observatoire

- Ouvert depuis le bouton « Générateur de rapports » de l'Observatoire, Obslide demande à cette fenêtre
  (`window.opener`, même origine uniquement) les opérations filtrées et les lignes RAPPORT correspondantes.
  Plus besoin de connecter une source ni d'importer l'export RAPPORT.
- Les données restent en mémoire (non enregistrées dans le navigateur). En mode anonymisé de l'Observatoire,
  elles arrivent anonymisées, avec des codes d'opération cohérents entre opérations et exigences.
- Panneau Exigences : encadré « Données reçues de l'Observatoire Prestaterre » ; un import manuel reste possible
  et remplace ces données.
- Si l'Observatoire ne répond pas (fenêtre fermée), Obslide l'indique ; ouvert directement, il garde son
  fonctionnement habituel (source mémorisée ou import).
- Vérifié : 3 opérations et 4 dossiers d'exigences reçus, slide Exigences affichée sans import, aucune erreur.

# V29.9.3 — Pont corrigé

- Slides Exigences : la base reçue est exactement celle affichée par l'onglet Exigences de l'Observatoire
  (ses propres filtres) ; elle n'est plus refiltrée par la liste des opérations. Vérifié : 45 dossiers et
  144 exigences retenues des deux côtés. L'encadré et le pied de slide rappellent ces filtres.
- Autres slides : l'Observatoire transmet les lignes source des opérations affichées ; Obslide les convertit
  avec `dataRowsToOperations`, comme pour sa propre source. Vérifié : 3 opérations sur les 15 slides connectées.
- À la réception, les filtres de slide hérités d'une session précédente sont remis à zéro.
- Réception par étapes isolées (exigences, puis opérations, puis slides) : un problème est affiché au lieu
  d'interrompre silencieusement toute la réception.

# V29.9.4 — Cibles des exigences

- La base reçue de l'Observatoire contient une colonne « Cible » (1 à 4) calculée par l'Observatoire avec ses
  règles (catalogue, intitulé de référence, numéro, thème) : la répartition par cible est identique à l'onglet
  Exigences.
- Import manuel : cible lue dans une colonne « Cible », sinon le code 1.x.x, sinon le premier chiffre de
  l'intitulé (« 1 - … », « 2. … ») ou de l'intitulé de référence (« Exigence associée: Exigence de référence:
  Intitulé »).
- Vérifié : « Gestion de chantier » (Cible 1) → 1 ; « 2 - Biodiversité » → 2 ; « 3. Énergie » → 3 ;
  référence « 1.3.2 Chantier… » → 1.

# V29.9.5 — Slide Indicateurs carbone : seuils IC Énergie

- IC Énergie : cases « Afficher le seuil 2028 / 2031 » et valeurs, comme pour l'IC Construction (aperçu et
  export). Aucune valeur par défaut : un seuil vide n'est pas affiché.
- Les deux jauges vont de 0 à l'IC max moyen saisi (repli sur 1 000 s'il est vide) ; un seuil au-delà est
  placé en bout de jauge avec sa valeur réelle.

# V29.10 — Mise en page des exports (Google Slides)

- Toutes les slides sauf la couverture : marge de 2 cm en haut (le contenu est réduit d'un bloc à 89,5 %,
  centré ; l'export mesure les positions réelles, les textes restent modifiables).
- Couverture : nouveau bandeau Prestaterre Certifications ; date / période sous le logo client ; plus de logo
  Prestaterre ni de « Confidentiel » en bas de page, plus de barre verticale verte.
- Évolution des opérations : encarts « Année pic », « Dernière année » et « Tendance » retirés.
- Cartographie : encarts de droite élargis (marges intérieures), zoom Île-de-France plus haut.
- Exigences · Mentions & exigences associées : plus de trait « part du panel » ; à droite, « n / N dossiers »
  de la mention ayant retenu l'exigence.
- Exigences · Vue d'ensemble : un seul encart Neuf / Rénovation ; nouvel encart « Mentions · dossiers »
  (5 mentions les plus présentes et leurs dossiers).
- Exigences les plus récurrentes : pastilles M1, M2… / P1, P2… = mention ou profil du périmètre qui rend
  l'exigence obligatoire ; légende des pastilles à la place de la légende des cibles. La table « exigence →
  mentions / profils » est un fichier .json importé dans le panneau Exigences et gardé dans le navigateur
  (rien n'est publié). Colonne « Profil spécifique » lue dans l'export RAPPORT.
- « <br> » des cellules Salesforce : retour à la ligne (mentions séparées), jamais affiché.
- Interlignes : un texte sur plusieurs lignes garde au moins 1,25.
- Non modifié : le rendu « PNG secours » (canvas) garde l'ancienne mise en page.

# V29.11 — Marge 1 cm, pastilles « obligatoire » sur les vraies données, Labels & performances

- Marge du haut ramenée à 1 cm (contenu réduit à 94,75 %).
- Pastilles « obligatoire » : une mention de dossier est reconnue si son nom commence par celui de la mention du
  référentiel (« BEE+ Niveau RT2012 -10% », « BEE+ option TFPB » → BEE+ ; le « + » compte), une pastille par
  mention. Les exports RAPPORT réels portent d'anciennes numérotations (« 1.1 », « 4.A.2 », « 0401-0200 ») :
  l'exigence est rapprochée par son intitulé de référence (« Exigence associée: Exigence de référence:
  Intitulé ») — mêmes nombres et au moins 60 % de mots en commun — ou par le code 1.x.x avec le même intitulé.
  Vérifié sur un export réel (3 389 dossiers) : BEE+, Habitat Qualité, Économie circulaire, Taxinomie, labels
  Effinergie, profil CDC Habitat. Légende sur 3 lignes au plus.
- Table locale à réimporter : cases à chiffre (critères, référentiels Rénovation) prises comme obligatoires
  (BEE+ Rénovation), intitulés stockés avec les codes.
- Labels & performances : encarts « Repères » / « Lecture des mentions » retirés ; noms à 18 px, nombres à 20 px,
  barres plus courtes, rangées espacées.

# V29.12 — Pastilles parlantes

- Les pastilles « obligatoire » portent le sigle ou un pictogramme de la mention au lieu de M1 / P1 : BEE+, TFPB,
  HQ, BBCA, BBCA+, Taxo A / Taxo Ad, Eff+, BEPOS 13 / 17 / RE, BBC 17 / Réno / PE / Tert, E+C-, HZC, BPE / BPEC ;
  👂 acoustique, 💨 qualité de l'air, ♻️ économie circulaire, 🦋 biodiversité, € évaluation des charges,
  🧓 habitat sénior, 🌿 biosourcé. Profil : nom court dans une pastille à contour.
- Couleur fixe par mention (identique d'une slide à l'autre). Au plus 4 pastilles par ligne, puis « +n » ; la légende
  les détaille toutes. Vérifié sur un export réel (3 389 dossiers).

# V29.12.1 — Exigences par cible
- Légende du bas : carrés de couleur Neuf / Rénovation retirés ; seule la phrase explicative reste, alignée à gauche.

# V29.13 — Labels & performances
- Performances : seules les 7 plus observées (aperçu et export PNG) ; les % restent calculés sur toutes les performances.
- Intitulés sur une seule ligne : police réduite (mesurée, 17 → 11 px) au lieu d'un retour à la ligne ; export canvas idem (12,5 → 8 px).
- Jauges raccourcies (150 px dans l'aperçu, 200 px max à l'export) ; plus de texte coupé par le centrage vertical de la zone.
- Vérifié avec des intitulés fictifs longs (60 caractères) : aucun débordement (scrollWidth = clientWidth).

# V29.13.1 — Labels & performances
- Rangées des deux cadres alignées : départ en haut, même pas (22 px) ; export PNG déjà aligné (même y et même hauteur de rangée).

# V29.14 — Tailles de police sur toutes les slides
- Curseurs « Textes globaux » / « Textes slide » (70–160 %) actifs sur toutes les slides, y compris Exigences et
  Distribution carbone (SVG). Cartes Nexity : leur propre ajustement, inchangé.
- Agrandissement contrôlé : un texte qui déborde de son cadre, en chevauche un autre (ou une barre / pastille SVG) ou
  sort de la slide est réduit pas à pas, jamais sous sa taille d'origine ; seuls les défauts apparus avec
  l'agrandissement sont corrigés (rien ne change à 100 %). Puis les éléments de même rôle prennent la même taille.
- Corrigé : un enfant qui hérite de la police n'est plus agrandi deux fois.
- Export PNG (traceur Canvas, une ligne par texte) : taille de l'aperçu, bornée par la largeur du texte dans l'aperçu ;
  Exigences / Distribution carbone : le PNG reprend le SVG ajusté. Google Slides lit déjà l'aperçu.
- Vérifié à 70, 100, 140 et 150 % (aperçu et PNG) : DPE, Équipements, Construction, Labels, Carbone, Maîtres
  d'ouvrage, Exigences (5 vues), Carte. Défauts déjà présents à 100 % laissés tels quels (sous-titre « moy… » de
  Construction, tuiles du bas du DPE).
- Exigences : « Compteur général d’eau par bâtiment et par type d’usage » (Rénovation) et « Compteurs d’eau par bâtiment
  et par type d’usage » (Neuf) = une seule exigence (comme l'Observatoire V6.39). Une base déjà importée doit être
  réimportée pour en profiter.

## V29.15 — Slide Mentions : chiffres clés en haut, tableau élargi

- Les 3 encarts (Total, Mentions distinctes, Top 5) passent en bandeau compact au-dessus du tableau (104 px de haut).
- Le tableau occupe toute la largeur de la slide (1490 px) : la colonne Mention gagne ~780 px ; l'intitulé n'est plus tronqué par « … » et passe sur 2 lignes si besoin.
- Même disposition dans l'export PNG (canvas `cMentionListSlide`). Les slides Maîtres d'ouvrage et Performances ne changent pas.
- Vérifié : aperçu et PNG avec 12 mentions, dont un intitulé de 130 caractères (2 lignes, rien de coupé), ligne « + 2 mention(s) non affichée(s) » visible.

## V29.16 — Labels & performances : performances en double

- Cause : chaque niveau RE2020 était compté deux fois, sous « Niveau IC Énergie 2025 » (cellule « Opération: Performance ») et
  « IC Énergie IC Énergie 2025 » (colonne « Niveau IC Énergie » dont la valeur reprend déjà l'intitulé).
- Correction : un seul libellé sans « Niveau » (`dataPerfName`, `dataLevelLabel`), une seule clé par niveau (`dataTagKey`), aussi pour
  le clic qui liste les opérations. « Voir Mentions » (renvoi vers la colonne Mentions) n'est plus compté comme une performance.
- Vérifié sur l'export réel du 30/09 : IC Construction 2025 = 812, IC Énergie 2025 = 645, Cep RE 2020 - 5 % = 313… une ligne chacun.

## V29.17 — Slide « Communes des opérations »

- Nouvelle slide (catalogue + ajoutée une fois après le zonage) : liste complète des communes avec le nombre de projets, en
  colonnes (2 à 6 selon le nombre), classement par nombre de projets ou alphabétique, KPI (communes, projets localisés, 1re commune).
- Données : colonne Ville des lignes reçues de l'Observatoire (complétée par TotalRecoll dans l'Observatoire), même regroupement que
  l'Observatoire V6.62 (graphies, Cedex, St/Ste fusionnés ; homonymes de départements différents séparés). Projets sans commune et,
  en données anonymisées, communes de moins de 5 projets : comptés en note, non nommés.
- Plus de « Lignes par slide » (120 par défaut) : pagination (dupliquer la slide, choisir la page). Collage manuel « Ville ⇥ Nombre ⇥ Département ».
- Vérifié : 130 communes fictives → page 1 = 120 lignes en 6 colonnes, page 2 = 10 ; aucune erreur JS ; export PNG par html2canvas,
  PPTX / Google Slides par la lecture du DOM (générique).

## V29.18 — Carte des communes (échelle du département)
- Nouvelle slide « Carte des communes (département) » (type `communeMap`), ajoutée une fois après « Communes des opérations ».
- Fond : contours officiels des communes du département (geo.api.gouv.fr, Etalab / IGN), chargés à l'ouverture, gardés en mémoire
  pour la session (aucun stockage) ; seul le code du département est envoyé.
- Couleur par nombre de projets (1 / 2–4 / 5–9 / 10–19 / 20+), communes les plus représentées nommées sans chevauchement
  (nombre réglable 0–40), classement des 14 premières, légende, notes (communes non reconnues, autres départements,
  communes anonymisées < 5 projets, projets sans commune).
- Département : automatique (le plus représenté) ou choisi ; dupliquer la slide pour un autre département.
- Données : opérations connectées (`dataAggregateCommunes` : regroupement des Communes des opérations + code INSEE / code postal
  majoritaires ; département déduit du code postal ou de l'INSEE s'il manque), sinon liste collée de la slide Communes des opérations.
- Rapprochement : INSEE (arrondissements Paris / Lyon / Marseille → commune), nom (+ code postal si homonymes), code postal unique.
- Export PNG 4K / classeur : capture de la slide (attend la fin du chargement des contours). Classeur PDF : Zonage et Communes
  des opérations passent aussi par la capture (aucun traceur Canvas pour ces slides).
- Vérifié (Chrome, communes réelles du Nord et du Pas-de-Calais, nombres fictifs) : 647 contours du Nord, 11 communes colorées,
  « Commune inconnue » signalée, bascule 59 → 62, export PNG 3840×2160, aucune erreur.
