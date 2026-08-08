## item_001_mettre_en_place_le_socle_pwa_local_first - Mettre en place le socle PWA local-first
> From version: 1.0.0
> Schema version: 1.0
> Status: In progress
> Understanding: 90%
> Confidence: 85%
> Progress: 85%
> Complexity: Medium
> Theme: Plateforme PWA
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Le projet ne possède encore ni application web, ni contrat d'installation, ni stratégie hors ligne.

# Scope
- In:
  - Application web responsive mono-écran centrée sur le mode libre.
  - Manifest PWA, icônes temporaires, service worker et cache des ressources nécessaires.
  - État d'installation et comportement hors ligne après premier chargement.
  - Interface initiale uniquement en anglais, alimentée par des clés de traduction sémantiques.
  - Build frontend entièrement statique destiné à la racine HTTPS de `canto.paulmondou.fr`.
  - Orientation paysage recommandée et optimisée sur mobile, avec portrait restant utilisable.
  - HTTPS en production et localhost en développement pour l'accès au microphone.
- Out:
  - Backend, compte utilisateur et synchronisation distante.
  - Mode chansons et navigation multi-mode finalisée.

# Acceptance criteria
- AC1: Canto peut être installée depuis un navigateur compatible avec son nom, son icône et un mode standalone.
- AC2: Après une première visite réussie, le mode libre se recharge sans réseau et indique clairement que les fonctions restent locales.
- AC3: La mise en page privilégie le paysage sur mobile, reste utilisable en portrait et fonctionne sur ordinateur.
- AC4: L'application ne dépend d'aucun service distant pendant l'exercice.
- AC5: Le build ne contient que des fichiers statiques et peut être publié à la racine de `canto.paulmondou.fr`.
- AC6: Tous les textes visibles du MVP proviennent du catalogue source anglais.

# AC Traceability
- request-AC1 -> This backlog slice. Proof: AC1: L'application peut être installée depuis un navigateur compatible avec un nom, une icône et un mode standalone.
- request-AC8 -> This backlog slice. Proof: AC2: Après une première visite réussie, le mode libre se recharge sans réseau et indique clairement que les fonctions restent locales.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_001_canto_mvp_mode_libre`
- Architecture decision(s): (none yet)
- Request: `req_000_mvp_local_first_pour_apprendre_la_justesse_vocale_en_mode_libre`
- Primary task(s): `task_001_orchestrer_la_livraison_du_mvp_mode_libre`

# AI Context
- Summary: Mettre en place le socle PWA local-first
- Keywords: scaffolded-backlog, mettre en place le socle pwa local-first, implementation-ready
- Use when: Implementing the scaffolded slice for Mettre en place le socle PWA local-first.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High — prérequis à toutes les fonctionnalités du MVP et à la promesse hors ligne.
- Rationale: Set by scaffold input or defaulted for grooming.
