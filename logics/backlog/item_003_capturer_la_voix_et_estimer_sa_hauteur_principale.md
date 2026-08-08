## item_003_capturer_la_voix_et_estimer_sa_hauteur_principale - Capturer la voix et estimer sa hauteur principale
> From version: 1.0.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: High
> Theme: Analyse vocale locale
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Le navigateur doit isoler une fréquence fondamentale vocale fiable malgré le silence, le bruit et les harmoniques.

# Scope
- In:
  - Demande explicite d'autorisation microphone déclenchée par une action utilisateur.
  - Traitement audio local en temps réel, sans conservation ni transfert du flux.
  - Estimation de fréquence fondamentale adaptée à une voix monophonique, avec score de confiance et lissage limité.
  - Analyse couvrant C2 à C6 et conversion vers la note tempérée la plus proche sur une base A4 = 440 Hz.
  - Calcul interne de l'écart en cents pour positionner et qualifier la trace, sans imposer sa valeur numérique dans l'interface.
  - Détection des états silence, volume insuffisant, hauteur non fiable et entrée audio interrompue.
- Out:
  - Polyphonie vocale, séparation de sources et suppression musicale avancée.
  - Reconnaissance du timbre, des phonèmes ou des paroles.
  - Stockage de buffers audio ou téléversement de la voix.

# Acceptance criteria
- AC1: Le microphone n'est activé qu'après une action et un message expliquant le traitement local.
- AC2: Pour un signal monophonique stable entre C2 et C6, l'application publie fréquence, note, octave, écart interne en cents et confiance au moteur de rendu.
- AC3: Un signal insuffisant ou ambigu n'est pas présenté comme une note certaine.
- AC4: La détection s'arrête et libère les pistes média lorsque l'utilisateur coupe le microphone ou quitte la vue.
- AC5: Les refus, absences de périphérique et interruptions affichent une marche à suivre sans faire planter l'application.
- AC6: Un protocole reproductible mesure précision et latence sur des signaux synthétiques et des appareils cibles.

# AC Traceability
- request-AC3 -> This backlog slice. Proof: AC1: Le microphone n'est activé qu'après une action et un message expliquant le traitement local.
- request-AC4 -> This backlog slice. Proof: AC2: Pour un signal monophonique stable dans la plage vocale cible, l'application publie fréquence, note, octave, cents et confiance.
- request-AC6 -> This backlog slice. Proof: AC3: Un signal insuffisant ou ambigu n'est pas présenté comme une note certaine.
- request-AC7 -> This backlog slice. Proof: AC4: La détection s'arrête et libère les pistes média lorsque l'utilisateur coupe le microphone ou quitte la vue.
- request-AC5 -> This backlog slice. Evidence needed: La trace vocale conserve huit secondes d'historique en remontant au-dessus du piano ; sa position horizontale reste directement alignée sur les mêmes notes que le clavier, sans axe en hertz.
- request-AC8 -> This backlog slice. Evidence needed: Le MVP couvre uniquement le mode libre ; aucune lecture de chanson, parole synchronisée, partition ou évaluation de performance n'est incluse.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Primary task(s): `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# AI Context
- Summary: Capturer la voix et estimer sa hauteur principale
- Keywords: scaffolded-backlog, capturer la voix et estimer sa hauteur principale, implementation-ready
- Use when: Implementing the scaffolded slice for Capturer la voix et estimer sa hauteur principale.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High — cœur technique de l'apprentissage de la justesse.
- Rationale: Set by scaffold input or defaulted for grooming.

# Tasks
- `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# Notes
- Task `task_001_orchestrer_la_livraison_du_mvp_mode_libre` was finished via `logics-manager flow finish task` on 2026-08-08.
