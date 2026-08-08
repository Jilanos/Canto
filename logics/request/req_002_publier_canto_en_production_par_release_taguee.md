## req_002_publier_canto_en_production_par_release_taguee - Publier Canto en production par release taguee
> From version: 0.1.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Complexity: Medium
> Theme: Livraison continue
> Reminder: Update status/understanding/confidence and linked backlog/task references when you edit this doc.

# Needs
- Publier Canto sur canto.paulmondou.fr par un tag GitHub, sans etape manuelle sur le VPS.
- Deployer exactement l'artefact teste, identifiable et reversible.
- Verifier automatiquement que la version deployee repond avant de valider la release.

# Context
- L'infrastructure paulmondou.fr deploie ses applications par tag GitHub : image immuable publiee dans GHCR, deploiement SSH de ce tag exact, sonde de sante, rollback sur l'image precedente. La consigne de reference est infra-paulmondou/GITHUB_TAG_RELEASE.md.
- Canto est un build 100 % statique servi a la racine du domaine : l'image n'a besoin que d'un serveur de fichiers statiques, sans runtime applicatif.
- Le depot infra-paulmondou reste la source de verite pour Caddy, Compose, volumes et reseaux ; l'ajout du service et du bloc de site s'y fait dans une demande dediee.
- Les autres applications du VPS suivent le meme motif : image versionnee via variable d'environnement, service Compose expose uniquement a Caddy, conteneur durci et en lecture seule.
- Le service worker impose une regle de cache particuliere : sw.js ne doit pas etre mis en cache longuement, sans quoi une nouvelle version ne se propage jamais.

# Acceptance criteria
- AC1: Un tag strictement au format vX.Y.Z declenche la chaine de release ; tout autre tag est refuse.
- AC2: La release refuse de deployer si le commit tague n'est pas contenu dans main.
- AC3: Les tests et le typage du projet passent avant toute construction d'image.
- AC4: L'image est publiee dans GHCR avec le tag de release et le SHA du commit ; le deploiement utilise le tag exact, jamais latest.
- AC5: Une sonde de sante valide la version deployee ; en cas d'echec, l'image precedente est retablie et la workflow echoue.
- AC6: Aucun secret n'apparait dans les journaux ; les secrets SSH et de production sont rattaches a un environnement GitHub production.
- AC7: L'image sert les fichiers statiques avec les bons types MIME, un repli sur index.html et une politique de cache qui laisse sw.js se renouveler.
- AC8: La procedure de release, les secrets requis et le principe de rollback sont documentes dans le depot.

# Definition of Ready (DoR)
- [x] Problem statement is explicit and user impact is clear.
- [x] Scope boundaries (in/out) are explicit.
- [x] Acceptance criteria are testable.
- [x] Dependencies and known risks are listed.

# Companion docs
- Product brief(s): `prod_003_canto_chaine_de_release_taguee`
- Architecture decision(s): (none yet)

# References
- infra-paulmondou/GITHUB_TAG_RELEASE.md
- infra-paulmondou/Caddyfile
- infra-paulmondou/docker-compose.yml
- Decision utilisateur du 8 aout 2026 : release via GitHub Actions, hebergement derriere Caddy

# AI Context
- Summary: Publier Canto en production par release taguee
- Keywords: request-chain-scaffold, publier canto en production par release taguee, development-ready
- Use when: You need to implement or review the scaffolded workflow for Publier Canto en production par release taguee.
- Skip when: The change is unrelated to this scaffolded request chain.

# Backlog
- `item_008_conteneuriser_le_build_statique_de_canto`
- `item_009_automatiser_la_release_taguee_vers_ghcr_et_le_vps`
