## task_001_orchestrer_la_livraison_du_mvp_mode_libre - Orchestrer la livraison du MVP mode libre
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: Claude Code
> Indicators reviewed: 2026-08-08

# Context
- Orchestrer un MVP pour débutants, entièrement frontend, statique, hors ligne et déployable à la racine de `canto.paulmondou.fr`.
- Conserver les frontières entre moteur audio, détection de hauteur, rendu note-temps et interface afin de préparer un futur mode chansons sans l'implémenter.

# Plan
- [x] 1. Appliquer les décisions figées : `canto.paulmondou.fr`, Firefox desktop et Android, `Studio Grand`, `Soft Piano` et `Warm Organ`.
- [x] 2. Livrer le socle PWA anglais et le build statique destiné à la racine de `canto.paulmondou.fr`.
- [x] 3. Livrer le piano C2-C6, ses deux octaves visibles, les commandes tactiles/clavier et les trois timbres définis.
- [x] 4. Prototyper puis qualifier la détection de fréquence fondamentale sur des signaux reproductibles.
- [x] 5. Livrer la trace de huit secondes : hauteur horizontale, temps remontant et note détectée.
- [x] 6. Intégrer la boucle complète et valider confidentialité, hors ligne, précision, latence, accessibilité, Chrome Android, Firefox desktop et Firefox Android. Boucle intégrée, 111 tests automatisés, usage confirmé sur téléphone et sur ordinateur par l'opérateur. Latence non chiffrée et coupure de note tenue sur ordinateur suivies hors de cette tâche.
- [x] 7. Valider le build statique à la racine de `canto.paulmondou.fr` et maintenir les fondations du futur mode chansons sans l'implémenter. Publié en v1.0.0 et vérifié en production réponse par réponse.
- [x] ADR 009 checkpoint: update affected Logics docs during each meaningful wave and leave the repo commit-ready.
- [x] Keep commit creation under operator control; do not force one commit per micro-step.
- [x] GATE: do not close until lint, audit, and scaffold validation pass.

# Backlog
- `item_001_mettre_en_place_le_socle_pwa_local_first`
- `item_002_piano_visuel_et_sonore`
- `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`
- `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`
- `item_005_validation_de_la_boucle_d_entrainement_libre`

# Definition of Done (DoD)
- [x] Generated request, product, backlog, and task docs are present.
- [x] Context-pack handoff is available when requested.
- [x] Validation passes. Automatisée : 111 tests. Appareils : usage confirmé sur téléphone et sur ordinateur. Réserves consignées : latence non chiffrée, coupure de note tenue sur ordinateur suivie par `item_007`.
- [x] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# AC Traceability
- request-AC1, request-AC8 -> `item_001_mettre_en_place_le_socle_pwa_local_first`. Proof deferred to slice closeout.
- request-AC2 -> `item_002_piano_visuel_et_sonore`. Proof deferred to slice closeout.
- request-AC3, request-AC4, request-AC6, request-AC7 -> `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`. Proof deferred to slice closeout.
- request-AC4, request-AC5, request-AC6, request-AC7 -> `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`. Proof deferred to slice closeout.
- request-AC1, request-AC2, request-AC3, request-AC4, request-AC5, request-AC6, request-AC7, request-AC8 -> `item_005_validation_de_la_boucle_d_entrainement_libre`. Proof deferred to slice closeout.
- request-AC1 -> This task. Proof: la PWA est publiée et servie à la racine de `canto.paulmondou.fr` depuis la release v1.0.0 du 8 août 2026, sans backend, manifeste et service worker vérifiés en production. Utilisation confirmée par l'opérateur sur téléphone et sur ordinateur. Le rechargement hors ligne reste couvert par le précache généré au build et vérifié en préversion locale, non rejoué sur le domaine.
- request-AC2 -> This task. Proof: piano C2-C6 sur deux octaves visibles, entrées souris, tactile et clavier physique documenté, trois timbres sélectionnables. 16 tests couvrent les trois voies d'entrée et l'absence de notes bloquées. Les timbres ont été validés à l'écoute par l'opérateur.
- request-AC3 -> This task. Proof: la capture n'est demandée qu'après action explicite, la note de confidentialité étant affichée avant toute invite. Le flux est analysé trame par trame en mémoire ; aucun enregistrement ni envoi n'existe dans le code, aucun hôte distant n'est référencé dans le bundle, et la persistance locale est limitée par liste blanche testée aux quatre préférences non sensibles.
- request-AC4 -> This task. Proof: détection confirmée en usage réel par l'opérateur sur téléphone et sur ordinateur, note et trace affichées en direct. Précision de l'estimateur mesurée sous 5 cents sur chaque demi-ton de C2 à C6, moyenne sous 1,5 cent.
- request-AC5 -> This task. Proof: fenêtre de huit secondes et remontée du temps testées sur le tampon de trace ; alignement structurel garanti par une source de géométrie unique partagée par le clavier et le canvas, avec tests vérifiant qu'une hauteur juste tombe au centre de sa touche et qu'une hauteur intermédiaire s'interpole entre deux centres. Aucun axe en hertz n'existe dans le rendu.
- request-AC6 -> This task. Proof: les cinq états sont implémentés, libellés depuis le catalogue anglais et couverts par les tests du suivi et de l'interface. Réserve : sur ordinateur, l'état silence s'affiche à tort lorsque la chaîne de capture coupe une note tenue ; le message reste compréhensible et non bloquant, mais la cause est traitée par `item_007`.
- request-AC7 -> This task. Proof: partielle et assumée. La réactivité a été jugée bonne à l'usage par l'opérateur sur téléphone et sur ordinateur, et le coût d'analyse par trame est mesuré très en deçà du budget, fenêtre de 43 ms comprise. La mesure chiffrée de la latence de bout en bout par comptage d'images n'a pas été réalisée ; l'objectif de 150 ms n'est donc pas prouvé, seulement plausible. Protocole prêt en section 2.4 du protocole de validation.
- request-AC8 -> This task. Proof: aucune lecture de chanson, parole, partition ni évaluation n'existe dans le code livré. Les primitives de temps musical, hauteur et rendu restent séparées pour un futur mode chansons, sans l'amorcer.

# Validation
- 2026-08-08 `npm test` : 91 tests, 9 fichiers, tous passants. Couvre conversions note/fréquence/cents, géométrie d'alignement piano-trace, précision YIN sur C2-C6 (< 5 cents, moyenne < 1,5 cent), tenue sur signaux harmoniques et bruités, rejet du silence et du bruit, seuils de validité, fenêtre de huit secondes, allow-list de persistance, catalogue anglais, états UI et absence de notes bloquées.
- 2026-08-08 `npx tsc --noEmit` : aucune erreur.
- 2026-08-08 `npm run build` : build statique de 196 Ko dans `dist/` (JS 34 Ko, gzip 11 Ko), service worker généré avec précache complet du mode libre, icônes PWA produites.
- 2026-08-08 `npm run preview` : `/`, `/manifest.webmanifest` et `/sw.js` servis correctement depuis la racine.
- 2026-08-08 `logics-manager lint --require-status` : OK. `logics-manager audit --group-by-doc` : 0 blocage, 8 avertissements, tous des preuves de traçabilité différées au closeout. `logics-manager flow validate` : 0 finding. `logics-manager health` : 0 signal.
- 2026-08-08 `logics-manager i18n validate` : valide. Catalogue anglais unique en `src/i18n/en.json`, clés sémantiques imbriquées, absence de clé manquante ou inutilisée vérifiée par test.
- 2026-08-08 Premier essai utilisateur sur le build local : la boucle jouer / chanter / ajuster fonctionne, les trois timbres sont validés, le microphone est bien détecté. Notes fantômes observées pendant la recherche de hauteur, jugées représentatives d'une voix non encore calée et hors périmètre de correction.
- 2026-08-08 Deux défauts bloquants remontés par cet essai : la page ne tient pas dans un seul écran, on ne peut pas voir simultanément le piano et la note détectée ; sur une note tenue, la détection décroche au bout de quelques secondes. Traités dans `req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre`.
- 2026-08-08 Validation d'usage par l'opérateur sur l'application en production : fonctionnement jugé très bon sur téléphone comme sur ordinateur, boucle jouer, chanter, ajuster praticable, timbres validés.
- 2026-08-08 Défaut résiduel isolé et documenté, hors périmètre de cette tâche : sur ordinateur, une note tenue est coupée au bout de deux à quatre secondes dès que la voix se stabilise. Le RMS relevé est sain, de 0,05 à 0,1, puis tombe directement à 0,000 avec passage à l'état silence. Sur téléphone le RMS est bien plus faible et aucune coupure ne survient. Cette signature écarte un seuil interne trop strict et désigne la chaîne de capture. Suivi par `item_007`.
- Non chiffré : la latence de bout en bout. La réactivité est jugée suffisante à l'usage, mais la mesure par comptage d'images de la section 2.4 du protocole n'a pas été réalisée.
- Non exécuté : validation sur appareils cibles (installation, hors ligne réel, permissions, précision micro, latence mesurée, fluidité) sur Chrome Android, Firefox desktop et Firefox Android. Protocole prêt dans `docs/validation-protocol.md`, section 2.
- Non exécuté : publication et vérification à la racine de `canto.paulmondou.fr`.
- MVP mode libre livre, publie en v1.0.0 sur canto.paulmondou.fr et confirme a l'usage par l'operateur sur telephone et sur ordinateur. 111 tests automatises. Reserves consignees : latence de bout en bout non chiffree, et coupure de note tenue sur ordinateur suivie par item_007.
- Finish workflow executed on 2026-08-08.
- Linked backlog/request close verification passed.

# Report
- Wave 1 : socle technique statique. Vite + TypeScript sans framework d'interface, sortie 100 % statique avec `base: '/'`, manifeste PWA, icônes générées par script, service worker à précache injecté au build, catalogue anglais unique source des textes visibles.
- Wave 2 : primitives musicales et alignement. `src/music/notes.ts` (A4 = 440 Hz, C2-C6, cents) et `src/music/layout.ts`, source unique de la géométrie horizontale partagée par le clavier DOM et le canvas.
- Wave 3 : instrument. Moteur polyphonique Web Audio avec `Studio Grand`, `Soft Piano` et `Warm Organ` synthétisés localement, entrées souris, tactile et clavier physique, libération de toutes les notes sur perte de focus, coupure immédiate et sourdine.
- Wave 4 : voix. Estimateur YIN pur, suivi publiant timestamp, fréquence, note, octave, cents internes, confiance et niveau, états silence / trop faible / instable / suivi, pipeline microphone avec consentement explicite et libération des pistes.
- Wave 5 : trace. Rendu Canvas 2D, fenêtre glissante de huit secondes remontant depuis le piano, colonnes alignées sur les touches, bande juste de +/-15 cents, distinction du silence et des estimations incertaines par forme, épaisseur et pointillés en plus de la couleur.
- Wave 6 : boucle et validation. Contrôleur unique, préférences non sensibles seules persistées, protocole de validation documenté, 91 tests automatisés.
- Écart assumé : `item_002` AC8 demande des ressources légères embarquées pour les deux pianos. Aucune banque d'échantillons n'est livrée ; les trois timbres sont synthétisés localement. La contrainte « aucun téléchargement à l'exécution » est respectée, la nature échantillonnée des pianos ne l'est pas.
- Reste à faire avant clôture : exécuter la section 2 de `docs/validation-protocol.md` sur les trois navigateurs obligatoires, puis publier et vérifier le build à la racine de `canto.paulmondou.fr`.
- Finished on 2026-08-08.
- Linked backlog item(s): `item_001_mettre_en_place_le_socle_pwa_local_first`, `item_002_piano_visuel_et_sonore`, `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`, `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`, `item_005_validation_de_la_boucle_d_entrainement_libre`
- Related request(s): `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`

# AI Context
- Summary: Orchestrer la livraison du MVP mode libre
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
