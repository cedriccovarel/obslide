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
