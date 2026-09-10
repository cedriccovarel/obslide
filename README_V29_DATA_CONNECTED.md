# Prestaterre Slide Generator V29 — Data Connected

Cette version fusionne le générateur V28.9 et le moteur Data Connected.

## Ce qui est connecté dans cette première intégration

- Tunnel de certification : les effectifs sont calculés à partir des opérations filtrées. Un clic sur une étape ouvre la liste des opérations correspondantes.
- Cartographie : les effectifs par département sont calculés automatiquement. Un clic sur une bulle départementale ouvre la liste des opérations concernées. La bulle Île-de-France ouvre les opérations des 8 départements IDF.
- Maîtres d’ouvrage : opérations, logements et bâtiments sont agrégés automatiquement par MOA. Un clic sur une ligne ouvre les opérations du MOA.
- Filtres globaux : année min/max, référentiel, nature. Les trois vues se recalculent ensemble.
- Explorateur : recherche, fiche opération, copie de la sélection et export CSV.
- Mode manuel conservé : le bouton « Revenir au mode manuel » restaure les valeurs présentes avant la connexion.

## Test immédiat

Ouvrir le site, cliquer sur **Données**, choisir **Démonstration intégrée**, puis **Connecter / actualiser**.

## Connexion Google Sheets recommandée

1. Créer un onglet `OPERATIONS` avec une ligne par opération.
2. Ouvrir `Extensions > Apps Script` dans Google Sheets.
3. Coller le contenu de `Code.gs` fourni dans ce dossier.
4. Déployer comme **Application Web**.
5. Copier l’URL terminant par `/exec`.
6. Dans le générateur : **Données > Google Apps Script (JSON)** puis coller l’URL.

## En-têtes conseillés

`Code opération | Nom opération | Département | Référentiel | MOA | Statut tunnel | Total logements | Total bâtiments | Année | Nature | Chauffage avant | Chauffage après | ECS avant | ECS après`

Le moteur accepte aussi plusieurs variantes d’intitulés déjà utilisées dans les exports Prestaterre.

## Statuts tunnel reconnus

Les libellés sont normalisés automatiquement vers :

- Non démarré / incomplet
- Dossier complet / planifié
- Analyse réalisée
- Analyse + visite
- Conforme
- Annulé / abandonné

## Étape suivante prévue

Brancher le même jeu d’opérations sur : Évolution, Performances, Mentions, matrices Chauffage/ECS, DPE et Carbone.
