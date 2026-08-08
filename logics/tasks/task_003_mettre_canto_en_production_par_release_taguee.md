## task_003_mettre_canto_en_production_par_release_taguee - Mettre Canto en production par release taguee
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
- [ ] 1. 1. Livrer le Dockerfile statique et verifier localement le service des fichiers, les types MIME et le repli.
- [ ] 2. 2. Livrer la workflow de release et valider ses garde-fous a vide, sans declencher de vrai deploiement.
- [ ] 3. 3. Se coordonner avec la demande d'hebergement du depot infra-paulmondou : nom de service, variable d'image, domaine et URL de sante.
- [ ] 4. 4. Documenter la procedure de release, les secrets et le rollback dans le README.
- [ ] 5. 5. Realiser la premiere release reelle seulement apres validation explicite, puis consigner les preuves.
- [ ] ADR 009 checkpoint: update affected Logics docs during each meaningful wave and leave the repo commit-ready.
- [ ] Keep commit creation under operator control; do not force one commit per micro-step.
- [ ] GATE: do not close until lint, audit, and scaffold validation pass.

# Backlog
- `item_008_conteneuriser_le_build_statique_de_canto`
- `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`

# Definition of Done (DoD)
- [ ] Generated request, product, backlog, and task docs are present.
- [ ] Context-pack handoff is available when requested.
- [ ] Validation passes.
- [ ] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# AC Traceability
- request-AC7 -> `item_008_conteneuriser_le_build_statique_de_canto`. Proof deferred to slice closeout.
- request-AC1, request-AC2, request-AC3, request-AC4, request-AC5, request-AC6 -> `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`. Proof deferred to slice closeout.
- request-AC8 -> (unclaimed). No backlog slice declares this criterion.

# Validation
- (no validation recorded yet)

# Report
- Not started.

# AI Context
- Summary: Mettre Canto en production par release taguee
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_002_publier_canto_en_production_par_release_taguee`
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)
