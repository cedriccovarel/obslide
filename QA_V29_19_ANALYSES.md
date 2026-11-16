# V29.19 — Slides d'analyse

Nouveau fichier `analytics-slides.js` (`window.OBSAnalytics`), branché dans `app.js` comme les autres types de slide.
Les 6 slides sont ajoutées une seule fois après « Évolution des opérations », puis restent supprimables et duplicables.

| Slide | Données | Réglages |
|---|---|---|
| Taux d'abandon | statut « annulé / abandonné », par année et par référentiel | par année / par référentiel (cases) |
| Clients et familles de MOA | MOA et « Maître d'ouvrage : Hiérarchie / Type MOA » | mesure : opérations ou logements ; nombre de clients |
| Évolution des certifications | mentions et labels, ou performances et niveaux, par année | séries cochées une à une ; nombre ou part des opérations de l'année |
| Panier moyen | fichier Salesforce importé localement (colonne « Montant … ») | colonne de montant ; par année / par référentiel |
| Taille des opérations (centiles) | bâtiments, logements, surface (colonne choisie) | une case par mesure ; colonne de surface |
| BEE Tertiaire — typologies | référentiels « Tertiaire », colonne « Type de programme (calculé) » | — |

## Confidentialité du panier moyen
- Le pont de l'Observatoire supprime les colonnes de montant : elles ne passent jamais par les données connectées.
- Le fichier importé est lu dans le navigateur ; seules les moyennes et médianes par année et par référentiel sont gardées
  dans la présentation. Aucun code d'opération ni montant individuel n'est enregistré (vérifié par le test).
- Une opération = un code interne : ses lignes sont additionnées. Les lignes de pied (« Total », « Somme »…) sont ignorées.

## Centiles
P10 à P90 par interpolation linéaire. Les valeurs vides ou nulles ne comptent pas.

## Vérifications
- Test unitaire (données fictives) : calculs des 6 slides, import CSV Salesforce brut (en-tête en ligne 3, pied « Total »),
  aucun `undefined` / `NaN` dans le rendu.
- Rendu Chrome avec les données de démonstration : 6 slides affichées, aucune erreur console.
