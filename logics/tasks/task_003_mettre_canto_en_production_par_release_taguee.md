## task_003_mettre_canto_en_production_par_release_taguee - Mettre Canto en production par release taguee
> From version: 0.1.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 95%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: Claude Code

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
- 2026-08-08 `docker build` : image construite depuis un checkout propre. Etage de construction Node 20 puis nginx non privilegie ; aucune source ni dependance de developpement dans l'image finale.
- 2026-08-08 Conteneur execute exactement comme en production, `--read-only --cap-drop ALL --security-opt no-new-privileges` avec tmpfs : demarre, sert, et `docker inspect` le rapporte `healthy` apres la periode de demarrage.
- 2026-08-08 Contrat d'hebergement verifie sur le conteneur : `/` en 200 `text/html` avec `Cache-Control: no-cache` ; `/manifest.webmanifest` en `application/manifest+json` ; `/sw.js` en `no-cache, no-store, must-revalidate` avec `Service-Worker-Allowed: /` ; `/assets/*` en `immutable` un an ; lien profond inconnu replie sur l'app en 200 ; icones en `image/png` ; cartes de sources en 404.
- 2026-08-08 `/health` renvoie `{"status":"ok","version":"v0.0.0-test"}` : la version passee en argument de construction est bien embarquee, ce qui rend la sonde de deploiement incapable d'etre satisfaite par le conteneur remplace.
- 2026-08-08 Les verifications exactes de la workflow CI ont ete rejouees en local contre le conteneur : toutes passent.
- 2026-08-08 YAML des deux workflows analyse sans erreur. Garde-fous simules : `v1.2.3` et `v10.0.11` acceptes, `v1.2`, `1.2.3` et `v1.2.3-rc1` refuses ; le motif d'image de `deploy-image.sh` accepte `:v1.2.3` et refuse `:latest` comme `:sha-...`.
- 2026-08-08 `npm test` : 111 tests passants. `npm run build` : bundle statique inchange.
- 2026-08-08 Environnement GitHub `production` verifie present sur `Jilanos/Canto` avec les quatre secrets attendus : `VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, `VPS_SSH_KEY`. GitHub ne permet pas de relire une valeur de secret ; la preuve porte sur la presence et l'horodatage.
- 2026-08-08 Ruleset `Release tags` cree sur le depot, identifiant 20583689 : cible `refs/tags/v*`, application active, regles creation, mise a jour et suppression restreintes, contournement reserve au role administrateur du depot. Seul le proprietaire peut donc declencher une mise en production.
- 2026-08-08 Compatibilite avec la politique de securite de contenu commune verifiee sur le build reel : aucune balise script ou style en ligne dans la coquille, aucun hote distant reference dans le bundle, unique appel reseau du bundle destine a une ressource de meme origine. `default-src 'self'` avec `img-src 'self' data:`, `worker-src 'self'` et `manifest-src 'self'` suffit donc sans exception supplementaire.
- 2026-08-08 Workflows pousses sur `main` et CI executee sur GitHub, run 31250610779, commit 2c9df46 : succes complet. Tous les steps passent, dont `npm run build`, `npm test`, la construction de l'image, le demarrage du conteneur en lecture seule, la sonde de sante et la verification du contrat d'hebergement. La chaine n'est donc plus seulement validee en local.
- Non execute : aucune release reelle, aucun deploiement reel. La chaine n'a jamais ete declenchee, conformement a la consigne de ne pas publier sans instruction explicite.
- Prerequis GitHub satisfaits : environnement `production`, secrets SSH, ruleset `v*` en place et workflows pousses.
- Dependance : l'hebergement lui-meme, service Compose, bloc Caddy, DNS et derogation microphone, appartient a `req_004_heberger_canto_sur_canto_paulmondou_fr` dans `infra-paulmondou`.

# Report
- Conteneurisation : `Dockerfile` en deux etages. Le premier construit le bundle avec Node 20 et echoue sur une erreur de typage ; le second est un nginx non privilegie qui ne sert que des fichiers. Les entrees de construction sont nommees une par une plutot que copiees en bloc, pour qu'un fichier sans rapport ne change pas silencieusement l'artefact publie.
- La charge utile de sante est produite dans l'etage de construction : la racine documentaire du conteneur non privilegie n'est pas inscriptible, ce qui a d'ailleurs fait echouer la premiere version de l'image.
- `nginx.conf` porte le contrat d'hebergement qui compte pour une PWA : `sw.js` jamais mis en cache, coquille d'application revalidee, ressources hachees immuables, type MIME du manifeste declare explicitement car absent de `mime.types`, repli sur la coquille pour les liens profonds, cartes de sources refusees.
- `/health` renvoie la version embarquee a la construction. Combine au script partage du VPS, cela ferme un trou reel : une sonde de sante qui repond alors que l'ancien conteneur tourne encore ferait passer un deploiement rate pour un succes.
- Release : `.github/workflows/release.yml` suit la consigne `GITHUB_TAG_RELEASE.md`. Tag strictement `vX.Y.Z`, commit obligatoirement ancetre de `main`, tests et typage avant toute construction, image publiee dans GHCR avec tag et SHA, provenance et SBOM, deploiement du tag exact via `scripts/deploy-image.sh`, rollback automatique sur echec de sante, GitHub Release apres succes, puis un resume de workflow.
- CI : `.github/workflows/ci.yml` verifie sur `main` et chaque pull request le typage, les tests, puis construit l'image et verifie le contrat d'hebergement contre un conteneur reel. Une regression de `nginx.conf` echoue donc en CI et non pendant une release.
- Documentation : le README decrit la commande de release, la chaine declenchee etape par etape, le rollback par redeploiement du tag precedent, les secrets et l'environnement GitHub a creer, et le fait que sans ruleset sur `v*` tout collaborateur peut declencher une mise en production.
- Signale a l'equipe infrastructure : la politique commune du Caddyfile interdit le microphone sur tous les sites ; sans derogation ciblee, Canto se chargera parfaitement et n'entendra rien.
- Reste a faire : attendre la livraison de `req_004` cote infrastructure, service Compose, bloc Caddy, DNS et derogation microphone, puis realiser la premiere release reelle sur instruction explicite. Le travail de ce depot est termine ; seul le maillon d'hebergement manque pour qu'un tag aille jusqu'au bout.

# AI Context
- Summary: Mettre Canto en production par release taguee
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_002_publier_canto_en_production_par_release_taguee`
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)
