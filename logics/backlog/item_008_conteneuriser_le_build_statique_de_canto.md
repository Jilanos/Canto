## item_008_conteneuriser_le_build_statique_de_canto - Conteneuriser le build statique de Canto
> From version: 0.1.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 90%
> Complexity: Low
> Theme: Conteneurisation
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Canto n'a pas d'image de production : rien ne permet de deployer l'artefact statique sur le VPS.

# Scope
- In:
  - Dockerfile multi-etapes : construction du bundle puis service des fichiers statiques par un serveur minimal.
  - Fichier d'exclusion pour garder l'image reduite au strict necessaire.
  - Types MIME corrects pour le manifeste, le service worker et les icones.
  - Repli sur index.html pour les chemins inconnus.
  - En-tetes de cache : ressources versionnees mises en cache longuement, index.html et sw.js revalides.
  - Point de sante interrogeable par le healthcheck Compose.
  - Conteneur compatible avec une execution en lecture seule et sans privileges.
- Out:
  - Ajout d'un runtime applicatif ou d'une API.
  - Configuration du reverse proxy, qui appartient au depot d'infrastructure.

# Acceptance criteria
- AC1: L'image se construit depuis un checkout propre et ne contient ni sources ni dependances de developpement.
- AC2: Le conteneur sert l'application a la racine, avec repli sur index.html.
- AC3: Le manifeste, le service worker et les icones sont servis avec leurs types MIME attendus.
- AC4: sw.js et index.html ne sont pas mis en cache de facon a bloquer une mise a jour.
- AC5: Un point de sante repond et sert de healthcheck.
- AC6: Le conteneur demarre en lecture seule, sans privileges supplementaires.

# AC Traceability
- request-AC7 -> This backlog slice. Proof: AC1: L'image se construit depuis un checkout propre et ne contient ni sources ni dependances de developpement.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)
- Request: `req_002_publier_canto_en_production_par_release_taguee`
- Primary task(s): `task_003_mettre_canto_en_production_par_release_taguee`

# AI Context
- Summary: Conteneuriser le build statique de Canto
- Keywords: scaffolded-backlog, conteneuriser le build statique de canto, implementation-ready
- Use when: Implementing the scaffolded slice for Conteneuriser le build statique de Canto.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
