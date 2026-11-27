# Obslide V29.26.0 — coller ses tableaux partout

Demande : certaines slides (bilans, Certifications…) n'acceptaient pas le collage direct d'un tableau.

## Ajouts
1. **Source de données « Tableau collé depuis Excel »** (menu Données) : le tableau d'opérations (mêmes colonnes que l'onglet OPERATIONS, ligne d'en-têtes comprise) est lu dans la page (tabulations, cellules entre guillemets). Il alimente toutes les slides calculées depuis les opérations (DATA_CONNECTED_TYPES : slides d'analyse, focalisées, tunnel, cartes, communes, MOA, performances, mentions, labels, évolution, équipements, carbone, DPE…). Le tableau n'est **pas** enregistré dans le navigateur (quota localStorage partagé) : seul le mode est mémorisé ; à la réouverture, un message demande de recoller.
2. **Slides du bilan** (Bilan général, Qualité, Annulations, Portefeuille, Certifications, Labels et niveaux, Taille) : section « Coller un tableau Excel » — choix de l'onglet (ceux lus par la slide en premier), collage lu dès la saisie ; remplace cet onglet du bilan affiché sans réimporter le classeur ; active « Utiliser le bilan Excel » sur la slide. Nombres français convertis (« 1 234,5 » → 1234,5 ; « 12,3 % » → 0,123, comme le classeur). En-têtes : reconnus s'ils sont collés ; sinon ajoutés quand l'onglet a des colonnes fixes ; obligatoires pour les onglets Centiles.
3. **Listes saisies à la main** (listEditor : labels, performances, équipements, construction) : « Coller une liste depuis Excel » (libellé ⇥ valeur), remplace la liste.

## Non-régression
- Import du classeur réel « Bilan consolidé de l'Observatoire.xlsx » : 28 feuilles, mêmes valeurs qu'en V29.25.3 (contrôle des en-têtes puis des formules non calculées, dans le même ordre).
- Banc : scratchpad ob/paste26.mjs, paste26b.mjs, imp26.mjs (données fictives pour les collages).
