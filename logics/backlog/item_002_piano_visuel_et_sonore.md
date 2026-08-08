## item_002_piano_visuel_et_sonore - Piano visuel et sonore
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: Medium
> Theme: Instrument de référence
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- L'utilisateur a besoin d'une note de référence immédiate et identifiable avant de chanter.

# Scope
- In:
  - Clavier de piano visuel avec touches blanches et noires, libellés de notes et état de touche active.
  - Lecture polyphonique de notes accordées à A4 = 440 Hz dans le MVP.
  - Sélecteur proposant `Studio Grand`, `Soft Piano` et `Warm Organ`, tous disponibles hors ligne.
  - Ressources légères embarquées pour les deux pianos et synthèse locale pour l'orgue.
  - Interactions souris, tactiles et clavier physique avec prévention des notes bloquées.
  - Son maintenu tant que la touche est pressée, puis léger fondu au relâchement, sans téléchargement réseau requis.
- Out:
  - Pédale de sustain, vélocité MIDI, périphériques MIDI et simulation acoustique avancée.
  - Séquenceur, métronome et enregistrement du jeu.

# Acceptance criteria
- AC1: Chaque touche visible déclenche la note attendue et montre son état actif pendant l'interaction.
- AC2: Plusieurs notes peuvent sonner simultanément sans coupure d'une note déjà tenue.
- AC3: Les interactions pointer, tactiles et clavier se terminent proprement même si le pointeur quitte une touche ou si la fenêtre perd le focus.
- AC4: Le clavier expose les noms de notes aux technologies d'assistance et dispose d'une commande de coupure immédiate du son.
- AC5: Le son fonctionne hors ligne après le chargement initial de la PWA.
- AC6: L'utilisateur peut choisir `Studio Grand`, `Soft Piano` ou `Warm Organ` sans interrompre l'exercice.
- AC7: Une note reste active pendant le maintien de la touche et s'éteint avec un fondu court au relâchement.
- AC8: Les deux pianos utilisent uniquement des ressources légères embarquées et l'orgue est synthétisé localement, sans téléchargement à l'exécution.

# AC Traceability
- request-AC2 -> This backlog slice. Proof: AC1: Chaque touche visible déclenche la note attendue et montre son état actif pendant l'interaction.
- request-AC3 -> This backlog slice. Evidence needed: Après consentement explicite au microphone, l'application analyse le signal localement et n'enregistre ni ne transmet aucun audio.
- request-AC4 -> This backlog slice. Evidence needed: Pendant que l'utilisateur chante, la fréquence fondamentale détectée est affichée en temps réel sous forme de trace et de note musicale la plus proche.
- request-AC5 -> This backlog slice. Evidence needed: La trace vocale conserve huit secondes d'historique en remontant au-dessus du piano ; sa position horizontale reste directement alignée sur les mêmes notes que le clavier, sans axe en hertz.
- request-AC6 -> This backlog slice. Evidence needed: Les états silence, signal trop faible, hauteur instable, microphone refusé et microphone indisponible sont compréhensibles et non bloquants.
- request-AC7 -> This backlog slice. Evidence needed: Sur un appareil cible compatible, le retour visuel de hauteur reste suffisamment réactif pour l'entraînement, avec un objectif mesuré de 150 ms maximum hors latence matérielle non contrôlable.
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
- Summary: Piano visuel et sonore
- Keywords: scaffolded-backlog, piano visuel et sonore, implementation-ready
- Use when: Implementing the scaffolded slice for Piano visuel et sonore.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High — fournit la référence sonore et le repère musical commun à la voix.
- Rationale: Set by scaffold input or defaulted for grooming.

# Tasks
- `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# Notes
- Task `task_001_orchestrer_la_livraison_du_mvp_mode_libre` was finished via `logics-manager flow finish task` on 2026-08-08.
