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
