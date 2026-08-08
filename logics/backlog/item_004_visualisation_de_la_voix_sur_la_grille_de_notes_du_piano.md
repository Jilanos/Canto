## item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano - Visualisation de la voix sur la grille de notes du piano
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: High
> Theme: Visualisation pédagogique
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Une valeur fréquentielle seule ne permet pas de relier intuitivement la voix aux touches et aux notes musicales.

# Scope
- In:
  - Zone temporelle placée au-dessus du clavier : hauteur sur l'axe horizontal, présent près du piano et historique remontant verticalement.
  - Huit secondes d'historique visible et alignement horizontal entre la hauteur affichée et les touches du piano.
  - Plage analysée C2 à C6, avec deux octaves visibles et commandes de changement d'octave.
  - Trace dominante de la fréquence fondamentale, avec indication de stabilité ou de confiance.
  - Affichage instantané de la note estimée et retour coloré autour d'une zone juste de ±15 cents.
  - Traitement visuel distinct du silence et des estimations incertaines.
- Out:
  - Axe logarithmique ou linéaire libellé en hertz.
  - Partition, portée musicale, paroles et notes cibles de chanson.
  - Analyse exhaustive du spectre, affichage des harmoniques ou mode d'intensité spectrale, réservés à une évolution ultérieure.
  - Indication textuelle trop haut ou trop bas et score de performance.

# Acceptance criteria
- AC1: Une hauteur exactement accordée apparaît horizontalement au centre de la colonne correspondant à sa touche de piano.
- AC2: Une hauteur entre deux demi-tons apparaît entre leurs centres, avec continuité visuelle et une zone juste de ±15 cents.
- AC3: Le présent se dessine près du piano et la trace remonte pendant une fenêtre de huit secondes, sans axe en hertz.
- AC4: Le silence crée une interruption visible et une hauteur incertaine est distinguée d'une hauteur fiable.
- AC5: Le rendu reste fluide sur les appareils cibles sans perturber le pipeline audio.
- AC6: Le sens de lecture, les couleurs et les états essentiels restent compréhensibles sans dépendre uniquement de la couleur.
- AC7: Deux octaves restent visibles simultanément et l'utilisateur peut parcourir la plage C2 à C6 sans rompre l'alignement avec le piano.

# AC Traceability
- request-AC4 -> This backlog slice. Proof: AC1: Une hauteur exactement accordée apparaît au centre de la ligne correspondant à sa touche de piano.
- request-AC5 -> This backlog slice. Proof: AC2: Une hauteur entre deux demi-tons apparaît entre leurs centres, avec continuité visuelle de l'écart en cents.
- request-AC6 -> This backlog slice. Proof: AC3: La trace progresse dans le temps sans axe en hertz et conserve une fenêtre récente suffisante pour observer un ajustement vocal.
- request-AC7 -> This backlog slice. Proof: AC4: Le silence crée une interruption visible et une hauteur incertaine est distinguée d'une hauteur fiable.
- request-AC8 -> This backlog slice. Evidence needed: Le MVP couvre uniquement le mode libre ; aucune lecture de chanson, parole synchronisée, partition ou évaluation de performance n'est incluse.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Primary task(s): `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# AI Context
- Summary: Visualisation de la voix sur la grille de notes du piano
- Keywords: scaffolded-backlog, visualisation de la voix sur la grille de notes du piano, implementation-ready
- Use when: Implementing the scaffolded slice for Visualisation de la voix sur la grille de notes du piano.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High — transforme l'analyse audio en retour pédagogique immédiatement lisible.
- Rationale: Set by scaffold input or defaulted for grooming.

# Tasks
- `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# Notes
- Task `task_001_orchestrer_la_livraison_du_mvp_mode_libre` was finished via `logics-manager flow finish task` on 2026-08-08.
