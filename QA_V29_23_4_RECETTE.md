# Recette Obslide V29.23.4 — 25/11/2026

Base : V29.23.3 (copie locale testée), corrigée en V29.23.4. Essais dans Chrome sans interface, copie servie sur 127.0.0.1.
Aucune donnée réelle n'est versionnée : les classeurs, exports et sauvegardes réels sont restés sur le poste.

## Corrections V29.23.4

| Fichier | Correction |
|---|---|
| `app.js` — `dataNumber` | « 1.234,5 » (point de milliers) et « 1,234.5 » (format anglais) étaient lus comme 0 ; ils valent maintenant 1234,5. Les formats déjà lus (espace, espace insécable, virgule décimale, unité) sont inchangés. |
| `app.js` — import OPERATIONS local | Un CSV enregistré par Excel « CSV (séparateur : point-virgule) » est en Windows-1252 : il était refusé (« En-têtes introuvables »). Décodage UTF-8 strict, puis Windows-1252 en secours. |
| `bilan-slides.js` — import du bilan | Un fichier non .xlsx donné comme bilan affichait un message proposant le CSV ; message dédié : le bilan doit être un classeur .xlsx. |

## Essais

| Essai | Source | Résultat | Statut |
|---|---|---|---|
| Import du bilan Excel | Classeur réel du bilan consolidé (local) | 28 feuilles lues, 7 slides bilan créées | OK — données réelles |
| Taille des opérations · deux vues illustrées | Idem | Moyennes, médianes, effectifs et unités identiques à la feuille « Taille par référentiel » ; illustrations chargées | OK — données réelles |
| Courbe de centiles, tableau des moyennes, chiffre clé | Idem | Courbes P1–P99 par référentiel ; valeurs identiques au classeur | OK — données réelles |
| Édition directe sur la slide | Idem | Titre modifié sur la slide et dans l'état | OK |
| Sauvegarde puis réouverture (navigateur vidé) | Idem | Vue illustrée, titre modifié, source du bilan conservés | OK |
| Bilan synthétique / classeur d'opérations / CSV | Fichiers synthétiques | Synthétique importé ; classeur d'opérations refusé (« Feuille manquante ») ; CSV refusé avec le nouveau message | OK |
| OPERATIONS CSV UTF-8, TSV, XLSX | Fichiers synthétiques (accents, guillemets avec « ; », doublon, valeurs manquantes, dates FR et ISO) | 5 lignes → 4 opérations, doublon regroupé, accents et guillemets conservés | OK |
| OPERATIONS CSV Windows-1252 | Fichier synthétique | Refusé en V29.23.3 ; accepté en V29.23.4 | Corrigé |
| Nombres français | Valeurs de test | Espace, insécable, virgule, unité OK ; point de milliers et format anglais corrigés | Corrigé |
| Fichiers mal formés (vide, sans en-têtes, en-têtes seuls, faux .xlsx) | Fichiers synthétiques | Messages explicites ; la source précédente est conservée | OK |
| Recalcul après filtrage | CSV synthétique | Filtre Référentiel : slide et compteur recalculés (4 → 1 opération) | OK |
| Collage carbone | Tableau synthétique | Bâtiments, projets dédupliqués, logements et moyennes justes ; valeur manquante exclue | OK |
| Collage exigences RAPPORT | Tableau synthétique | Dossiers et parts justes ; doublon non compté deux fois | OK |
| Collage Nexity | Tableau synthétique | Projets uniques, rattachement par département, départements non mappés « à vérifier » | OK |
| Pont Observatoire → Obslide | **Simulation** locale (même origine), fenêtre « Observatoire » de test reproduisant `openGenerator` et la remise des données (V6.66) | Opérations, lignes RAPPORT et « Type de programme (calculé) » reçus ; slide tertiaire alimentée ; mode anonymisé sans nom | OK — simulation |
| Pont : origine étrangère, autre fenêtre, mauvais jeton | Simulation | Messages ignorés ; seul le message conforme est accepté | OK — simulation |
| Pont : fenêtre de l'Observatoire fermée | Simulation | Message « L'Observatoire n'a pas transmis ses données (fenêtre fermée ?) » | OK — simulation |
| Pont : transfert illisible | Simulation | « 0 opération. Problème : aucune opération reçue » | OK — simulation |
| Pont depuis le bouton réel | — | Non réalisé : l'Observatoire ouvre l'Obslide publié (branche main) et demande mot de passe et clé d'accès | Bloqué |
| Ancienne sauvegarde | Sauvegarde réelle V3 de septembre (local) | Ordre des 15 slides, nom d'onglet personnalisé et titres de slide conservés | OK — données réelles |
| Exports PNG 4K, SVG, PDF, PowerPoint | Idem + bilan | PNG 3840 × 2160 ; SVG avec illustration intégrée ; PDF classeur 22 pages ; PPTX 22 slides avec textes modifiables | OK |

## Points à décider (non modifiés)

- Vue illustrée « Logements et bâtiments » : la carte Bâtiments utilise la ligne « Global » (tous référentiels) et non « Logement ». Le libellé l'indique, mais la vue est résidentielle.
- Les données reçues de l'Observatoire ne sont pas stockées brutes, mais le contenu agrégé des slides (dont des noms de maîtres d'ouvrage) est gardé dans l'état local d'Obslide, comme pour toute slide ; le commentaire « rien n'est enregistré » est trop absolu.
- Export SVG de la vue illustrée nommé « taille-operations-centiles-slide.svg ».
- Le classeur « synthetic-bilan.xlsx » du dossier de travail n'a pas de `[Content_Types].xml` : Excel peut le refuser (Obslide le lit).
