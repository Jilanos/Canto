## task_002_traiter_les_retours_du_premier_essai_du_mode_libre - Traiter les retours du premier essai du mode libre
> From version: 0.1.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 85%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: Claude Code
> Indicators reviewed: 2026-08-08

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
- request-AC1 -> This task. Proof: verifie a l'usage par l'operateur sur l'application en production, telephone et ordinateur : la boucle est utilisable, le defaut d'ecran fractionne du premier essai n'est plus signale.
- request-AC2 -> This task. Proof: budget de hauteur applique depuis une mesure du bandeau fixe, avec passe de correction ; 10 tests couvrent six viewports cibles et le budget de bandeau compact que la feuille de style doit respecter. Confirme a l'usage sur telephone et ordinateur.
- request-AC3 -> This task. Evidence needed: Une note tenue pendant au moins vingt secondes reste detectee en continu, sans retour aux etats silence, signal trop faible ou hauteur instable.
- request-AC4 -> This task. Evidence needed: La cause du decrochage est identifiee et documentee, contraintes audio reellement appliquees a l'appui, et non seulement contournee.
- request-AC5 -> This task. Proof: le panneau Diagnostics a effectivement servi a relever le RMS et le comportement de coupure sur ordinateur et sur telephone, sans debogueur. C'est ce releve qui a permis d'ecarter l'hypothese d'un seuil interne trop strict.
- request-AC6 -> This task. Proof: 10 tests de budget de hauteur et 6 tests de tenue de note, dont une note de vingt secondes a niveau decroissant sans aucune coupure. Reserve : ces tests couvrent l'attenuation progressive, pas la coupure nette observee sur ordinateur, qui vient de la chaine de capture et reste a couvrir.
- request-AC7 -> This task. Proof: 111 tests passants, dont l'alignement trace/touches, les etats du suivi, les libelles accessibles et l'absence de notes bloquees. Aucune regression signalee a l'usage.

# Validation
- 2026-08-08 `npm test` : 111 tests, 10 fichiers, tous passants (91 avant cette vague). Nouveaux : 10 tests de budget de hauteur sur six viewports cibles, 6 tests de tenue de note sur 20 secondes avec niveau décroissant, 4 tests de structure d'écran unique et de panneaux.
- 2026-08-08 `npx tsc --noEmit` : aucune erreur. `npm run build` : bundle de 41 Ko (13 Ko gzip), service worker et précache regénérés.
- 2026-08-08 `logics-manager lint --require-status`, `audit --group-by-doc`, `i18n validate` : propres.
- Non exécuté : validation navigateur des deux correctifs. Aucun navigateur ni microphone n'est disponible dans l'environnement d'exécution ; la mise en page réelle et la disparition effective du décrochage doivent être confirmées sur appareil, section 2.4bis et 2.5 de `docs/validation-protocol.md`.
- 2026-08-08 Mesure obtenue sur l'application en production. Telephone : aucune coupure sur note tenue, RMS nettement plus faible mais continu. Ordinateur : coupure au bout de deux a quatre secondes des que la voix se stabilise, RMS sain de 0,05 a 0,1 puis chute directe a 0,000 avec passage a l'etat silence.
- Lecture de cette mesure : un RMS de 0,000 est un silence numerique, impossible a produire par un microphone reel dans une piece reelle, ou le bruit de fond laisse toujours un residu. La cause est donc dans la chaine de capture et non dans les seuils du suivi, dont l'hysteresis a bien fonctionne puisque le suivi n'a pas lache avant la coupure du signal lui-meme.
- Consequence : le correctif d'hysteresis reste pertinent mais ne peut rien contre une coupure a zero. La correction restante porte sur la capture. Deux informations manquent pour trancher : le navigateur de bureau utilise, et la ligne Voice processing du panneau Diagnostics sur ce poste.
- Mesure attendue de l'utilisateur : la ligne `Voice processing` du panneau Diagnostics, et la valeur de RMS au moment où la note tenue décrochait. Ces deux valeurs départagent une atténuation par le navigateur d'un seuil interne trop strict.

# Report
- Mise en page à écran unique : le budget vertical devient une fonction pure, `src/ui/height-budget.ts`. Le contrôleur mesure la hauteur réelle du bandeau fixe, une seconde fois en mode compact, puis attribue les hauteurs restantes à la trace et au clavier via des propriétés CSS. Une passe de vérification corrige le résultat si la mesure était optimiste, plutôt que de rogner les contrôles.
- La trace ne prend plus toute la hauteur disponible : le clavier est servi en premier jusqu'à 168 px, la trace prend le reste avec un minimum de 120 px, et le clavier ne descend jamais sous 76 px.
- Les contenus secondaires quittent le flux : consentement, aide clavier, casque, confidentialité et légende détaillée passent dans un panneau `Help and privacy` en surimpression, avec un panneau `Diagnostics` symétrique. Ouvrir un panneau ne peut donc plus repousser le clavier.
- Décrochage sur note tenue : les seuils du suivi deviennent asymétriques. Entrer en suivi exige un signal franc, y rester exige beaucoup moins, et une grâce de 120 ms absorbe les trames isolées mauvaises. Le silence réel reste immédiat, donc aucune note fantôme ne survit à l'arrêt du chant.
- Diagnostic avant contournement : le pipeline relit les contraintes réellement appliquées par le navigateur, réapplique une fois si la suppression de bruit ou le contrôle de gain est resté actif, et publie le tout dans le panneau Diagnostics avec RMS, clarté, trame tenue et cadence d'analyse. La cause exacte reste donc mesurable sur appareil au lieu d'être supposée.
- Défense complémentaire : la branche d'analyse se termine désormais dans un gain nul relié à la sortie, pour que tous les moteurs tirent bien l'audio à travers l'analyseur. Le gain nul garantit qu'aucun retour micro n'est audible.
- Hors périmètre confirmé : les notes fantômes pendant la recherche de hauteur n'ont pas été touchées, conformément au retour utilisateur.
- Reste à faire : confirmer les deux correctifs sur Chrome Android, Firefox desktop et Firefox Android, puis clore la tâche.

# AI Context
- Summary: Traiter les retours du premier essai du mode libre
- Keywords: scaffolded-task, request-chain-scaffold, orchestration
- Use when: Coordinating implementation of a scaffolded request chain.
- Skip when: Working on one isolated sibling slice.

# Links
- Request: `req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre`
- Product brief(s): `prod_002_canto_mode_libre_lisibilite_et_fiabilite_apres_premier_essai`
- Architecture decision(s): (none yet)
