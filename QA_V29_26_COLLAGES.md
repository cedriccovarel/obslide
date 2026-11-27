# Obslide V29.26.0 — coller ses tableaux partout

Demande : certaines slides (bilans, Certifications…) n'acceptaient pas le collage direct d'un tableau.

## Ajouts
1. **Source de données « Tableau collé depuis Excel »** (menu Données) : le tableau d'opérations (mêmes colonnes que l'onglet OPERATIONS, ligne d'en-têtes comprise) est lu dans la page (tabulations, cellules entre guillemets). Il alimente toutes les slides calculées depuis les opérations (DATA_CONNECTED_TYPES : slides d'analyse, focalisées, tunnel, cartes, communes, MOA, performances, mentions, labels, évolution, équipements, carbone, DPE…). Le tableau n'est **pas** enregistré dans le navigateur (quota localStorage partagé) : seul le mode est mémorisé ; à la réouverture, un message demande de recoller.
2. **Slides du bilan** (Bilan général, Qualité, Annulations, Portefeuille, Certifications, Labels et niveaux, Taille) : section « Coller un tableau Excel » — choix de l'onglet (ceux lus par la slide en premier), collage lu dès la saisie ; remplace cet onglet du bilan affiché sans réimporter le classeur ; active « Utiliser le bilan Excel » sur la slide. Nombres français convertis (« 1 234,5 » → 1234,5 ; « 12,3 % » → 0,123, comme le classeur). En-têtes : reconnus s'ils sont collés ; sinon ajoutés quand l'onglet a des colonnes fixes ; obligatoires pour les onglets Centiles.
3. **Listes saisies à la main** (listEditor : labels, performances, équipements, construction) : « Coller une liste depuis Excel » (libellé ⇥ valeur), remplace la liste.

## Non-régression
- Import du classeur réel « Bilan consolidé de l'Observatoire.xlsx » : 28 feuilles, mêmes valeurs qu'en V29.25.3 (contrôle des en-têtes puis des formules non calculées, dans le même ordre).
- Banc : scratchpad ob/paste26.mjs, paste26b.mjs, imp26.mjs (données fictives pour les collages).

## V29.26.1 — collage sans effet sur « Évolution des certifications »
Cause : sans choix explicite, le collage partait dans le 1er onglet de la liste (« Synthèse certifications »), que le graphique ne lit pas, alors que le menu en affichait un autre. Et un collage de « Créations annuelles » restait invisible si l'axe était sur la décision.
Correctifs : le collage va dans l'onglet affiché ; l'onglet proposé par défaut est celui lu par le graphique avec les réglages actuels (OBSBilan.readSheets : Créations / Décisions annuelles selon l'axe, Parts annuelles, onglet de famille en détail ; annulations selon la vue ; taille + centiles) ; après collage, les réglages s'alignent sur l'onglet collé (OBSBilan.alignToSheet : axe, valeur « part », séries « détail par famille ») ; un onglet non lu par le graphique est signalé. Banc : ob/paste26c.mjs.

## V29.26.2 — tableau annuel collé dans « Synthèse certifications »
Constat utilisateur : « Onglet « Synthèse certifications » collé : 13 ligne(s) lue(s)… le graphique lit « Décisions annuelles » » — 13 lignes = l'onglet Décisions annuelles du bilan réel (Synthèse en a 21). Causes : menu resté sur Synthèse (choix mémorisé par la V29.26.0) et en-têtes non conformes remplacés en silence par « Indicateur ⇥ Valeur ».
Correctifs : l'onglet de destination est reconnu d'après la ligne d'en-têtes collée (OBSBilan.targetSheet ; onglets de même en-tête Créations / Décisions / Parts → celui lu par le graphique) et le menu suit ; une 1re ligne sans nombre qui ne correspond pas aux en-têtes est refusée avec le nom de l'onglet reconnu, jamais remplacée. Banc : ob/paste26d.mjs (reproduction exacte : bilan actif, axe décision, menu Synthèse, 13 lignes).
