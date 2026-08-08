## task_002_traiter_les_retours_du_premier_essai_du_mode_libre - Traiter les retours du premier essai du mode libre
> From version: 0.1.0
> Schema version: 1.0
> Status: Ready
> Understanding: 90%
> Confidence: 85%
> Progress: 0%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.

# Context
- Orchestrate the scaffolded request chain and keep sibling implementation slices linked.

# Plan
- [ ] 1. 1. Reproduire les deux symptomes et figer les viewports et la duree de note tenue servant de reference.
- [ ] 2. 2. Instrumenter le pipeline audio et relever les contraintes reellement appliquees avant toute correction.
- [ ] 3. 3. Livrer la mise en page a ecran unique et son test de repartition des hauteurs.
- [ ] 4. 4. Livrer la correction du decrochage, son mode diagnostic et son test de non-regression.
- [ ] 5. 5. Rejouer le protocole de validation sur les navigateurs obligatoires et consigner les mesures.
- [ ] 6. 6. Mettre a jour docs/validation-protocol.md et le README avec les regles de mise en page et le mode diagnostic.
- [ ] ADR 009 checkpoint: update affected Logics docs during each meaningful wave and leave the repo commit-ready.
- [ ] Keep commit creation under operator control; do not force one commit per micro-step.
- [ ] GATE: do not close until lint, audit, and scaffold validation pass.

# Backlog
- `item_006_tenir_le_mode_libre_dans_un_seul_ecran`
- `item_007_diagnostiquer_et_corriger_le_decrochage_de_la_detection_sur_note_tenue`

# Definition of Done (DoD)
- [ ] Generated request, product, backlog, and task docs are present.
- [ ] Context-pack handoff is available when requested.
- [ ] Validation passes.
- [ ] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# AC Traceability
- request-AC1, request-AC2, request-AC7 -> `item_006_tenir_le_mode_libre_dans_un_seul_ecran`. Proof deferred to slice closeout.
- request-AC3, request-AC4, request-AC5, request-AC6, request-AC7 -> `item_007_diagnostiquer_et_corriger_le_decrochage_de_la_detection_sur_note_tenue`. Proof deferred to slice closeout.

# Validation
- (no validation recorded yet)

# Report
- Not started.

# AI Context
- Summary: Traiter les retours du premier essai du mode libre
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre`
- Product brief(s): `prod_002_canto_mode_libre_lisibilite_et_fiabilite_apres_premier_essai`
- Architecture decision(s): (none yet)
