## item_005_validation_de_la_boucle_d_entrainement_libre - Validation de la boucle d'entrainement libre
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: High
> Theme: Expérience MVP
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Les briques piano, microphone et visualisation doivent former une boucle d'entraînement simple, fiable et mesurable.

# Scope
- In:
  - Libellés anglais concis expliquant les commandes audio et la confidentialité au moment utile, sans tutoriel ni exercice guidé.
  - Commandes explicites pour activer ou couper le microphone et couper le piano.
  - Gestion de coexistence entre sortie piano et entrée micro, avec documentation du risque de repisse acoustique.
  - Utilisation possible sur haut-parleur et recommandation contextuelle d'un casque lorsque la repisse dégrade la détection.
  - Tests automatisés des conversions musicales, du moteur de hauteur et des états UI.
  - Tests manuels au minimum sur Chrome Android, Firefox desktop et Firefox Android.
  - Persistance locale des seules préférences non sensibles : instrument, volume, plage/octave, orientation visuelle et langue future.
  - Direction visuelle technique, précise et proche d'un studio professionnel.
  - Budget de performance, accessibilité de base et documentation d'utilisation.
- Out:
  - Évaluation chiffrée de l'utilisateur, gamification et sauvegarde de séances.
  - Mode chansons ou préparation de contenu musical sous licence.

# Acceptance criteria
- AC1: Un utilisateur débutant peut accomplir directement la boucle jouer une note, chanter et ajuster, sans tutoriel obligatoire.
- AC2: Le piano, la capture et la visualisation peuvent être arrêtés immédiatement et libèrent leurs ressources.
- AC3: Les tests unitaires couvrent les conversions note/fréquence/cents et les seuils de validité de la hauteur.
- AC4: Une validation de bout en bout documente installation, hors ligne, permissions, précision, latence et fluidité sur les appareils cibles.
- AC5: Aucune requête réseau ni écriture persistante ne contient de données issues du microphone.
- AC6: L'interface essentielle est utilisable au clavier, expose des libellés accessibles en anglais et ne dépend pas uniquement de la couleur.
- AC7: Chrome Android, Firefox desktop et Firefox Android passent le protocole documenté, avec le paysage recommandé sur mobile.
- AC8: Seules les préférences non sensibles autorisées sont persistées localement ; aucune donnée de voix, séance ou progression ne l'est.
- AC9: L'exercice reste utilisable sur haut-parleur et recommande clairement un casque lorsqu'une référence instrumentale peut être reprise par le microphone.

# AC Traceability
- request-AC1 -> This backlog slice. Proof: AC1: Un nouvel utilisateur peut comprendre puis accomplir la boucle jouer une note, chanter et ajuster sans documentation externe.
- request-AC2 -> This backlog slice. Proof: AC2: Le piano, la capture et la visualisation peuvent être arrêtés immédiatement et libèrent leurs ressources.
- request-AC3 -> This backlog slice. Proof: AC3: Les tests unitaires couvrent les conversions note/fréquence/cents et les seuils de validité de la hauteur.
- request-AC4 -> This backlog slice. Proof: AC4: Une validation de bout en bout documente installation, hors ligne, permissions, précision, latence et fluidité sur les appareils cibles.
- request-AC5 -> This backlog slice. Proof: AC5: Aucune requête réseau ni écriture persistante ne contient de données issues du microphone.
- request-AC6 -> This backlog slice. Proof: AC6: L'interface essentielle est utilisable au clavier et expose des libellés accessibles.
- request-AC7 -> This backlog slice. Proof: AC6: L'interface essentielle est utilisable au clavier et expose des libellés accessibles.
- request-AC8 -> This backlog slice. Proof: AC6: L'interface essentielle est utilisable au clavier et expose des libellés accessibles.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Primary task(s): `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# AI Context
- Summary: Validation de la boucle d'entrainement libre
- Keywords: scaffolded-backlog, validation de la boucle d'entrainement libre, implementation-ready
- Use when: Implementing the scaffolded slice for Validation de la boucle d'entrainement libre.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: Medium — consolide les composants après livraison des capacités cœur de priorité haute.
- Rationale: Set by scaffold input or defaulted for grooming.

# Tasks
- `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# Notes
- Task `task_001_orchestrer_la_livraison_du_mvp_mode_libre` was finished via `logics-manager flow finish task` on 2026-08-08.
