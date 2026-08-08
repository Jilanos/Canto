## req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre - MVP local-first pour apprendre la justesse vocale en mode libre
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Complexity: High
> Theme: MVP mode libre
> Reminder: Update status/understanding/confidence and linked backlog/task references when you edit this doc.

# Needs
- Entendre une note de référence en jouant sur un piano visuel.
- Voir en temps réel la hauteur principale de sa voix par rapport aux notes du piano.
- Choisir entre `Studio Grand`, `Soft Piano` et `Warm Organ` pour disposer de références sonores variées.
- S'exercer sans compte, sans serveur et sans envoyer l'audio hors de l'appareil.
- Installer l'application comme une PWA et pouvoir l'utiliser hors ligne après son premier chargement.

# Context
- Le produit vise à terme un mode chansons de type karaoké, explicitement exclu du MVP.
- La visualisation demandée est organisée par notes de musique et non par une échelle fréquentielle brute.
- Le MVP vise les personnes débutantes et montre uniquement la fréquence fondamentale ; des modes d'intensité ou d'harmoniques pourront être ajoutés plus tard.
- La hauteur se lit horizontalement au-dessus des touches et huit secondes d'historique remontent verticalement depuis le piano.
- Le traitement du microphone, les instruments et le rendu sont entièrement réalisés dans le navigateur, sans backend.
- L'interface initiale est uniquement en anglais ; les navigateurs obligatoires sont Chrome sur Android, Firefox desktop et Firefox Android.

# Acceptance criteria
- AC1: L'utilisateur peut ouvrir une PWA responsive entièrement statique, l'installer, retrouver le mode libre hors ligne et la déployer à la racine de `canto.paulmondou.fr` sans backend.
- AC2: L'utilisateur peut jouer des notes distinctes depuis un piano visuel avec la souris, le tactile et un clavier physique documenté, puis choisir `Studio Grand`, `Soft Piano` ou `Warm Organ`.
- AC3: Après consentement explicite au microphone, l'application analyse le signal localement et n'enregistre ni ne transmet aucun audio.
- AC4: Pendant que l'utilisateur chante, la fréquence fondamentale détectée est affichée en temps réel sous forme de trace et de note musicale la plus proche.
- AC5: La trace vocale conserve huit secondes d'historique en remontant au-dessus du piano ; sa position horizontale reste directement alignée sur les mêmes notes que le clavier, sans axe en hertz.
- AC6: Les états silence, signal trop faible, hauteur instable, microphone refusé et microphone indisponible sont compréhensibles et non bloquants.
- AC7: Sur un appareil cible compatible, le retour visuel de hauteur reste suffisamment réactif pour l'entraînement, avec un objectif mesuré de 150 ms maximum hors latence matérielle non contrôlable.
- AC8: Le MVP couvre uniquement le mode libre ; aucune lecture de chanson, parole synchronisée, partition ou évaluation de performance n'est incluse.

# Definition of Ready (DoR)
- [x] Problem statement is explicit and user impact is clear.
- [x] Scope boundaries (in/out) are explicit.
- [x] Acceptance criteria are testable.
- [x] Dependencies and known risks are listed.

# Companion docs
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)

# References
- Demande produit initiale du 7 août 2026

# AI Context
- Summary: MVP local-first pour apprendre la justesse vocale en mode libre
- Keywords: request-chain-scaffold, mvp local-first pour apprendre la justesse vocale en mode libre, development-ready
- Use when: You need to implement or review the scaffolded workflow for MVP local-first pour apprendre la justesse vocale en mode libre.
- Skip when: The change is unrelated to this scaffolded request chain.

# Backlog
- `item_001_mettre_en_place_le_socle_pwa_local_first`
- `item_002_piano_visuel_et_sonore`
- `item_003_capturer_la_voix_et_estimer_sa_hauteur_principale`
- `item_004_visualisation_de_la_voix_sur_la_grille_de_notes_du_piano`
- `item_005_validation_de_la_boucle_d_entrainement_libre`
