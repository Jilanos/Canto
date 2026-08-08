## task_001_orchestrer_la_livraison_du_mvp_mode_libre - Orchestrer la livraison du MVP mode libre
> From version: 1.0.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 85%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: Claude Code

# Context
- Orchestrer un MVP pour débutants, entièrement frontend, statique, hors ligne et déployable à la racine de `canto.paulmondou.fr`.
- Conserver les frontières entre moteur audio, détection de hauteur, rendu note-temps et interface afin de préparer un futur mode chansons sans l'implémenter.

# Plan
- [x] 1. Appliquer les décisions figées : `canto.paulmondou.fr`, Firefox desktop et Android, `Studio Grand`, `Soft Piano` et `Warm Organ`.
- [x] 2. Livrer le socle PWA anglais et le build statique destiné à la racine de `canto.paulmondou.fr`.
- [x] 3. Livrer le piano C2-C6, ses deux octaves visibles, les commandes tactiles/clavier et les trois timbres définis.
- [x] 4. Prototyper puis qualifier la détection de fréquence fondamentale sur des signaux reproductibles.
- [x] 5. Livrer la trace de huit secondes : hauteur horizontale, temps remontant et note détectée.
- [~] 6. Intégrer la boucle complète et valider confidentialité, hors ligne, précision, latence, accessibilité, Chrome Android, Firefox desktop et Firefox Android. Boucle intégrée et couverte par 91 tests automatisés ; la validation sur appareils cibles reste à exécuter (`docs/validation-protocol.md`).
- [~] 7. Valider le build statique à la racine de `canto.paulmondou.fr` et maintenir les fondations du futur mode chansons sans l'implémenter. Build statique vérifié localement (`npm run build`, `npm run preview`) ; publication réelle sur le sous-domaine non encore effectuée.
- [x] ADR 009 checkpoint: update affected Logics docs during each meaningful wave and leave the repo commit-ready.
- [x] Keep commit creation under operator control; do not force one commit per micro-step.
- [ ] GATE: do not close until lint, audit, and scaffold validation pass.

# Backlog
- `item_001_mettre_en_place_le_socle_pwa_local_first`
- `item_002_piano_visuel_et_sonore`
- `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`
- `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`
- `item_005_validation_de_la_boucle_d_entrainement_libre`

# Definition of Done (DoD)
- [x] Generated request, product, backlog, and task docs are present.
- [x] Context-pack handoff is available when requested.
- [ ] Validation passes. Automatisée : oui. Appareils cibles : en attente.
- [x] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# AC Traceability
- request-AC1, request-AC8 -> `item_001_mettre_en_place_le_socle_pwa_local_first`. Proof deferred to slice closeout.
- request-AC2 -> `item_002_piano_visuel_et_sonore`. Proof deferred to slice closeout.
- request-AC3, request-AC4, request-AC6, request-AC7 -> `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`. Proof deferred to slice closeout.
- request-AC4, request-AC5, request-AC6, request-AC7 -> `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`. Proof deferred to slice closeout.
- request-AC1, request-AC2, request-AC3, request-AC4, request-AC5, request-AC6, request-AC7, request-AC8 -> `item_005_validation_de_la_boucle_d_entrainement_libre`. Proof deferred to slice closeout.

# Validation
- 2026-08-08 `npm test` : 91 tests, 9 fichiers, tous passants. Couvre conversions note/fréquence/cents, géométrie d'alignement piano-trace, précision YIN sur C2-C6 (< 5 cents, moyenne < 1,5 cent), tenue sur signaux harmoniques et bruités, rejet du silence et du bruit, seuils de validité, fenêtre de huit secondes, allow-list de persistance, catalogue anglais, états UI et absence de notes bloquées.
- 2026-08-08 `npx tsc --noEmit` : aucune erreur.
- 2026-08-08 `npm run build` : build statique de 196 Ko dans `dist/` (JS 34 Ko, gzip 11 Ko), service worker généré avec précache complet du mode libre, icônes PWA produites.
- 2026-08-08 `npm run preview` : `/`, `/manifest.webmanifest` et `/sw.js` servis correctement depuis la racine.
- 2026-08-08 `logics-manager lint --require-status` : OK. `logics-manager audit --group-by-doc` : 0 blocage, 8 avertissements, tous des preuves de traçabilité différées au closeout. `logics-manager flow validate` : 0 finding. `logics-manager health` : 0 signal.
- 2026-08-08 `logics-manager i18n validate` : valide. Catalogue anglais unique en `src/i18n/en.json`, clés sémantiques imbriquées, absence de clé manquante ou inutilisée vérifiée par test.
- Non exécuté : validation sur appareils cibles (installation, hors ligne réel, permissions, précision micro, latence mesurée, fluidité) sur Chrome Android, Firefox desktop et Firefox Android. Protocole prêt dans `docs/validation-protocol.md`, section 2.
- Non exécuté : publication et vérification à la racine de `canto.paulmondou.fr`.

# Report
- Wave 1 : socle technique statique. Vite + TypeScript sans framework d'interface, sortie 100 % statique avec `base: '/'`, manifeste PWA, icônes générées par script, service worker à précache injecté au build, catalogue anglais unique source des textes visibles.
- Wave 2 : primitives musicales et alignement. `src/music/notes.ts` (A4 = 440 Hz, C2-C6, cents) et `src/music/layout.ts`, source unique de la géométrie horizontale partagée par le clavier DOM et le canvas.
- Wave 3 : instrument. Moteur polyphonique Web Audio avec `Studio Grand`, `Soft Piano` et `Warm Organ` synthétisés localement, entrées souris, tactile et clavier physique, libération de toutes les notes sur perte de focus, coupure immédiate et sourdine.
- Wave 4 : voix. Estimateur YIN pur, suivi publiant timestamp, fréquence, note, octave, cents internes, confiance et niveau, états silence / trop faible / instable / suivi, pipeline microphone avec consentement explicite et libération des pistes.
- Wave 5 : trace. Rendu Canvas 2D, fenêtre glissante de huit secondes remontant depuis le piano, colonnes alignées sur les touches, bande juste de +/-15 cents, distinction du silence et des estimations incertaines par forme, épaisseur et pointillés en plus de la couleur.
- Wave 6 : boucle et validation. Contrôleur unique, préférences non sensibles seules persistées, protocole de validation documenté, 91 tests automatisés.
- Écart assumé : `item_002` AC8 demande des ressources légères embarquées pour les deux pianos. Aucune banque d'échantillons n'est livrée ; les trois timbres sont synthétisés localement. La contrainte « aucun téléchargement à l'exécution » est respectée, la nature échantillonnée des pianos ne l'est pas.
- Reste à faire avant clôture : exécuter la section 2 de `docs/validation-protocol.md` sur les trois navigateurs obligatoires, puis publier et vérifier le build à la racine de `canto.paulmondou.fr`.

# AI Context
- Summary: Orchestrer la livraison du MVP mode libre
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
