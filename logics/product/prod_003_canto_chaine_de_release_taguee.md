## prod_003_canto_chaine_de_release_taguee - Canto : chaine de release taguee
> Date: 2026-08-08
> Status: Proposed
> Related request: `req_002_publier_canto_en_production_par_release_taguee`
> Related backlog: `item_008_conteneuriser_le_build_statique_de_canto`, `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`
> Related task: `task_003_mettre_canto_en_production_par_release_taguee`
> Related architecture: (none yet)
> Reminder: Update status, linked refs, scope, decisions, success signals, and open questions when you edit this doc.

# Overview
Passer d'un build local a une publication de production reproductible, verifiee et reversible, alignee sur le motif deja en place pour les autres applications du VPS.

# Goals
- Rendre chaque mise en production tracable a un tag et a un commit.
- Empecher la publication d'un artefact non teste ou hors de main.
- Permettre un retour arriere immediat sur la version precedente.

# Non-goals
- Deployer en continu depuis main sans tag.
- Modifier la chaine de release des autres applications.
- Introduire un runtime serveur ou une base de donnees pour Canto.

# Scope and guardrails
- In: scaffolded request, product, backlog, orchestration task, validation, and handoff context.
- Out: unrelated workflow docs and implementation of generated tasks.

# Key product decisions
- Use structured input as the source of truth for generated docs.
- Keep generated write paths local and repo-bounded.

# Success signals
- Generated docs pass lint and audit without broad manual rewrites.
- Context-pack output can be handed to an implementation agent directly.

# References
- Product back-reference: `req_002_publier_canto_en_production_par_release_taguee`
- Task back-reference: `task_003_mettre_canto_en_production_par_release_taguee`
