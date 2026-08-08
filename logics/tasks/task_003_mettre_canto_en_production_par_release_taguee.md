## task_003_mettre_canto_en_production_par_release_taguee - Mettre Canto en production par release taguee
> From version: 0.1.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: Claude Code

# Context
- Orchestrate the scaffolded request chain and keep sibling implementation slices linked.

# Plan
- [x] 1. Livrer le Dockerfile statique et verifier localement le service des fichiers, les types MIME et le repli.
- [x] 2. Livrer la workflow de release et valider ses garde-fous a vide, sans declencher de vrai deploiement.
- [x] 3. Se coordonner avec la demande d'hebergement du depot infra-paulmondou : nom de service, variable d'image, domaine et URL de sante.
- [x] 4. Documenter la procedure de release, les secrets et le rollback dans le README.
- [x] 5. Realiser la premiere release reelle seulement apres validation explicite, puis consigner les preuves.
- [x] ADR 009 checkpoint: update affected Logics docs during each meaningful wave and leave the repo commit-ready.
- [x] Keep commit creation under operator control; do not force one commit per micro-step.
- [x] GATE: do not close until lint, audit, and scaffold validation pass.

# Backlog
- `item_008_conteneuriser_le_build_statique_de_canto`
- `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`

# Definition of Done (DoD)
- [x] Generated request, product, backlog, and task docs are present.
- [x] Context-pack handoff is available when requested.
- [x] Validation passes.
- [x] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# AC Traceability
- request-AC7 -> `item_008_conteneuriser_le_build_statique_de_canto`. Proof deferred to slice closeout.
- request-AC1, request-AC2, request-AC3, request-AC4, request-AC5, request-AC6 -> `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`. Proof deferred to slice closeout.
- request-AC8 -> (unclaimed). No backlog slice declares this criterion.
- request-AC1 -> This task. Proof: le tag `v1.0.0` a declenche le run 31253847461 et la garde de format a ete validee dans son etape `validate`. Le rejet des formes invalides, `v1.2`, `1.2.3` et `v1.2.3-rc1`, a ete simule en local sur l'expression exacte de la workflow ; il n'a pas ete eprouve en poussant un tag mal forme.
- request-AC2 -> This task. Proof: l'etape `validate` du run 31253847461 a execute `git merge-base --is-ancestor` contre `origin/main` et l'a passe, le commit 6bf94ab etant sur `main`. Le cas negatif, un tag pose hors de `main`, n'a pas ete provoque volontairement.
- request-AC3 -> This task. Proof: dans le run 31253847461, le job `publish` depend de `validate`, qui execute `npm run build`, incluant le typage, puis `npm test`. La CI du commit tague, run 31253806166, a egalement passe les 111 tests avant le tag.
- request-AC4 -> This task. Proof: le job `publish` a pousse l'image etiquetee `v1.0.0` et par SHA complet, avec provenance et SBOM. Le job `deploy` a appele `deploy-image.sh` avec `ghcr.io/jilanos/canto:v1.0.0` ; ce script refuse tout ce qui n'est pas une version `vX.Y.Z`, refus verifie en local sur `:latest` et `:sha-...`, et resout l'image en empreinte immuable avant deploiement. La liste des tags dans GHCR n'a pas pu etre relue, le jeton ne portant pas la portee `read:packages`.
- request-AC5 -> This task. Proof: `https://canto.paulmondou.fr/health` renvoie `{"status":"ok","version":"v1.0.0"}`, la version etant embarquee a la construction de l'image ; la sonde a donc bien interroge le conteneur deploye et non son predecesseur. Le chemin de retour arriere est celui du script partage, non declenche puisque le deploiement a reussi.
- request-AC6 -> This task. Proof: les quatre secrets sont rattaches a l'environnement `production` du depot, presence verifiee par l'API. La workflow ne les transmet qu'aux entrees de l'action SSH et n'en imprime aucun ; le job `deploy` ne passe que `GHCR_USERNAME` et le jeton fourni par GitHub via `envs`. Les valeurs restant non relisibles par construction, la preuve porte sur le rattachement et sur l'absence d'echo dans la definition de la workflow.
- request-AC7 -> This task. Proof: verifie sur le domaine de production, reponse par reponse : manifeste en `application/manifest+json`, `sw.js` en `no-cache, no-store, must-revalidate` avec `Service-Worker-Allowed: /`, ressources hachees en `immutable` un an, coquille en `no-cache`, lien profond inconnu replie en 200, icones en `image/png`, cartes de sources refusees. Les memes verifications sont automatisees dans la CI contre un conteneur reel.
- request-AC8 -> This task. Proof: le README documente la commande de release, les quatre etapes declenchees, le retour arriere par redeploiement du tag precedent avec la commande exacte, les secrets et l'environnement GitHub requis, et le fait que sans ruleset sur `v*` tout collaborateur peut declencher une mise en production. Le ruleset est en place, identifiant 20583689.

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
- 2026-08-08 Version 1.0.0 preparee dans `package.json` et `package-lock.json`, commit 6bf94ab, CI verte sur ce commit exact, run 31253806166. La sequence preparation de version puis CI puis tag a donc ete respectee.
- 2026-08-08 Release reelle executee sur feu vert explicite de l'operateur. Tag `v1.0.0` pousse, run 31253847461 : les quatre etapes validate, publish, deploy et release ont reussi, suivies du resume de workflow. Le ruleset a laisse passer le proprietaire, ce qui confirme que le contournement administrateur fonctionne.
- 2026-08-08 Verification en production sur `https://canto.paulmondou.fr`, reponse par reponse et non depuis les journaux : `/health` renvoie `{"status":"ok","version":"v1.0.0"}`, ce qui prouve que la sonde a bien interroge le nouveau conteneur ; coquille en 200 `text/html` ; `Permissions-Policy` porte `microphone=(self)` ; `sw.js` en `no-cache, no-store, must-revalidate` avec `Service-Worker-Allowed: /` ; manifeste en `application/manifest+json` ; ressources hachees en `immutable` un an ; lien profond replie en 200 ; icones en `image/png` ; HSTS, `X-Frame-Options` et la politique de securite de contenu commune presents ; certificat TLS accepte.
- 2026-08-08 Absence de regression sur les sites voisins verifiee independamment : `claimlens`, `gnosis` et `f1` renvoient toujours `microphone=()`. La derogation est donc bien limitee au seul domaine de Canto.
- 2026-08-08 GitHub Release `v1.0.0` publiee, ni brouillon ni preversion, sur `main`.
- Non verifie : la liste des tags de l'image dans GHCR, le jeton de session ne portant pas la portee `read:packages`. La reussite du deploiement, qui resout l'image en empreinte immuable avant de la deployer, et la version renvoyee par la sonde en tiennent lieu de preuve.
- Prerequis GitHub satisfaits : environnement `production`, secrets SSH, ruleset `v*` en place et workflows pousses.
- Dependance externe, desormais levee : l'hebergement lui-meme, service Compose, bloc Caddy, DNS et derogation microphone, appartenait a la demande d'hebergement de Canto portee par le depot infra-paulmondou, livree le 8 aout 2026 sous le commit 11fe8a7.
- Release v1.0.0 executee et verifiee en production le 8 aout 2026 : run 31253847461 reussi sur les quatre etapes, /health renvoyant la version deployee, contrat d'hebergement PWA verifie reponse par reponse sur canto.paulmondou.fr, derogation microphone limitee a ce domaine et sites voisins inchanges.
- Finish workflow executed on 2026-08-08.
- Linked backlog/request close verification passed.

# Report
- Conteneurisation : `Dockerfile` en deux etages. Le premier construit le bundle avec Node 20 et echoue sur une erreur de typage ; le second est un nginx non privilegie qui ne sert que des fichiers. Les entrees de construction sont nommees une par une plutot que copiees en bloc, pour qu'un fichier sans rapport ne change pas silencieusement l'artefact publie.
- La charge utile de sante est produite dans l'etage de construction : la racine documentaire du conteneur non privilegie n'est pas inscriptible, ce qui a d'ailleurs fait echouer la premiere version de l'image.
- `nginx.conf` porte le contrat d'hebergement qui compte pour une PWA : `sw.js` jamais mis en cache, coquille d'application revalidee, ressources hachees immuables, type MIME du manifeste declare explicitement car absent de `mime.types`, repli sur la coquille pour les liens profonds, cartes de sources refusees.
- `/health` renvoie la version embarquee a la construction. Combine au script partage du VPS, cela ferme un trou reel : une sonde de sante qui repond alors que l'ancien conteneur tourne encore ferait passer un deploiement rate pour un succes.
- Release : `.github/workflows/release.yml` suit la consigne `GITHUB_TAG_RELEASE.md`. Tag strictement `vX.Y.Z`, commit obligatoirement ancetre de `main`, tests et typage avant toute construction, image publiee dans GHCR avec tag et SHA, provenance et SBOM, deploiement du tag exact via `scripts/deploy-image.sh`, rollback automatique sur echec de sante, GitHub Release apres succes, puis un resume de workflow.
- CI : `.github/workflows/ci.yml` verifie sur `main` et chaque pull request le typage, les tests, puis construit l'image et verifie le contrat d'hebergement contre un conteneur reel. Une regression de `nginx.conf` echoue donc en CI et non pendant une release.
- Documentation : le README decrit la commande de release, la chaine declenchee etape par etape, le rollback par redeploiement du tag precedent, les secrets et l'environnement GitHub a creer, et le fait que sans ruleset sur `v*` tout collaborateur peut declencher une mise en production.
- Signale a l'equipe infrastructure : la politique commune du Caddyfile interdit le microphone sur tous les sites ; sans derogation ciblee, Canto se chargera parfaitement et n'entendra rien.
- Livre et en production : `https://canto.paulmondou.fr` sert la version 1.0.0. La chaine complete tag, image, deploiement, sonde et Release est desormais eprouvee de bout en bout.
- Reste hors de cette tache : la validation sur la matrice d'appareils, portee par `item_005` et `task_002`, et non par la chaine de release.
- Finished on 2026-08-08.
- Linked backlog item(s): `item_008_conteneuriser_le_build_statique_de_canto`, `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`
- Related request(s): `req_002_publier_canto_en_production_par_release_taguee`

# AI Context
- Summary: Mettre Canto en production par release taguee
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_002_publier_canto_en_production_par_release_taguee`
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)
