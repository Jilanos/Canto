## item_006_tenir_le_mode_libre_dans_un_seul_ecran - Tenir le mode libre dans un seul ecran
> From version: 0.1.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 85%
> Complexity: Medium
> Theme: Mise en page
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- La page defile : l'utilisateur ne peut pas voir le piano et la note detectee en meme temps que la trace, ce qui casse la boucle d'ajustement.

# Scope
- In:
  - Mise en page a hauteur bornee : l'application occupe la hauteur du viewport sans defilement sur les tailles cibles.
  - Reduction et bornage de la zone de trace au profit du clavier et du bandeau de note.
  - Hierarchie des blocs secondaires : legende, consentement, rappels clavier et casque, pied de page, densifies ou replies quand la hauteur manque.
  - Comportement en paysage mobile, en portrait mobile et sur ordinateur.
  - Redimensionnement correct du canvas lors des changements de taille et d'orientation.
- Out:
  - Refonte graphique complete ou changement de direction visuelle.
  - Navigation multi-ecrans ou mise en page a onglets.
  - Modification de la geometrie horizontale partagee entre la trace et les touches.

# Acceptance criteria
- AC1: Sur un viewport de reference en paysage mobile, en portrait mobile et sur ordinateur, piano, note detectee et trace sont visibles ensemble sans defilement.
- AC2: La zone de trace ne depasse pas une part bornee de la hauteur disponible et conserve une hauteur minimale exploitable.
- AC3: Le clavier conserve une hauteur jouable au doigt sur mobile.
- AC4: Les contenus secondaires restent accessibles, meme replies, et ne sont jamais la seule source d'une information necessaire a la boucle.
- AC5: Un test automatise verifie la regle de repartition des hauteurs pour les viewports cibles.
- AC6: L'alignement entre la trace et les touches reste exact apres redimensionnement et changement d'orientation.

# AC Traceability
- request-AC1 -> This backlog slice. Proof: AC1: Sur un viewport de reference en paysage mobile, en portrait mobile et sur ordinateur, piano, note detectee et trace sont visibles ensemble sans defilement.
- request-AC2 -> This backlog slice. Proof: AC2: La zone de trace ne depasse pas une part bornee de la hauteur disponible et conserve une hauteur minimale exploitable.
- request-AC7 -> This backlog slice. Proof: AC3: Le clavier conserve une hauteur jouable au doigt sur mobile.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_002_canto_mode_libre_lisibilite_et_fiabilite_apres_premier_essai`
- Architecture decision(s): (none yet)
- Request: `req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre`
- Primary task(s): `task_002_traiter_les_retours_du_premier_essai_du_mode_libre`

# AI Context
- Summary: Tenir le mode libre dans un seul ecran
- Keywords: scaffolded-backlog, tenir le mode libre dans un seul ecran, implementation-ready
- Use when: Implementing the scaffolded slice for Tenir le mode libre dans un seul ecran.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
