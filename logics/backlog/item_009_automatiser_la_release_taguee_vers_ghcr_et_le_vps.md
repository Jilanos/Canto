## item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps - Automatiser la release taguee vers GHCR et le VPS
> From version: 0.1.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 80%
> Complexity: Medium
> Theme: Integration continue
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Aucune chaine automatisee ne relie un tag a une version deployee et verifiee en production.

# Scope
- In:
  - Workflow declenchee sur les tags v*, avec verification stricte du format.
  - Verification que le commit tague est un ancetre de main.
  - Execution des tests et du typage avant construction.
  - Construction et publication de l'image dans GHCR avec le tag de release et le SHA.
  - Deploiement SSH du tag exact sur le VPS via le Compose partage.
  - Sonde de sante post-deploiement, rollback sur l'image precedente en cas d'echec.
  - Creation de la GitHub Release apres succes et resume de workflow.
  - Permissions GitHub minimales et secrets rattaches a l'environnement production.
- Out:
  - Deploiement automatique depuis main.
  - Modification des workflows des autres depots.
  - Gestion des enregistrements DNS.

# Acceptance criteria
- AC1: Un tag vX.Y.Z declenche la chaine ; un tag mal forme l'interrompt avec un message explicite.
- AC2: Un tag pose sur un commit absent de main echoue avant toute publication d'image.
- AC3: Tests et typage s'executent avant la construction et bloquent la release en cas d'echec.
- AC4: L'image publiee porte le tag de release et le SHA ; le deploiement reference le tag exact.
- AC5: L'echec de la sonde de sante declenche le retablissement de l'image precedente et fait echouer la workflow.
- AC6: Aucun secret n'est imprime dans les journaux.
- AC7: Le resume de workflow indique tag, SHA, image, service deploye, URL de sante et resultat.
- AC8: La documentation decrit la commande de release, les secrets a creer et le principe de rollback.

# AC Traceability
- request-AC1 -> This backlog slice. Proof: AC1: Un tag vX.Y.Z declenche la chaine ; un tag mal forme l'interrompt avec un message explicite.
- request-AC2 -> This backlog slice. Proof: AC2: Un tag pose sur un commit absent de main echoue avant toute publication d'image.
- request-AC3 -> This backlog slice. Proof: AC3: Tests et typage s'executent avant la construction et bloquent la release en cas d'echec.
- request-AC4 -> This backlog slice. Proof: AC4: L'image publiee porte le tag de release et le SHA ; le deploiement reference le tag exact.
- request-AC5 -> This backlog slice. Proof: AC5: L'echec de la sonde de sante declenche le retablissement de l'image precedente et fait echouer la workflow.
- request-AC6 -> This backlog slice. Proof: AC6: Aucun secret n'est imprime dans les journaux.
- request-AC8 -> This backlog slice. Proof: AC8: La documentation decrit la commande de release, les secrets a creer et le principe de rollback.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)
- Request: `req_002_publier_canto_en_production_par_release_taguee`
- Primary task(s): `task_003_mettre_canto_en_production_par_release_taguee`

# AI Context
- Summary: Automatiser la release taguee vers GHCR et le VPS
- Keywords: scaffolded-backlog, automatiser la release taguee vers ghcr et le vps, implementation-ready
- Use when: Implementing the scaffolded slice for Automatiser la release taguee vers GHCR et le VPS.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
