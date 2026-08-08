## item_007_diagnostiquer_et_corriger_le_decrochage_de_la_detection_sur_note_tenue - Diagnostiquer et corriger le decrochage de la detection sur note tenue
> From version: 0.1.0
> Schema version: 1.0
> Status: Ready
> Understanding: 90%
> Confidence: 85%
> Progress: 0%
> Complexity: High
> Theme: Fiabilite de la detection
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem
- Sur une note tenue stable, la detection s'arrete au bout de quelques secondes alors que le son continue : la boucle d'ajustement devient inutilisable exactement au moment ou l'utilisateur a stabilise sa voix.

# Scope
- In:
  - Mesure des contraintes audio reellement appliquees par le navigateur, comparees a celles demandees.
  - Instrumentation du pipeline : evolution du niveau, de la clarte et de l'etat publie pendant une note tenue longue.
  - Correction de la cause identifiee, cote contraintes de capture ou cote seuils de validite.
  - Mode diagnostic activable, sans donnee audio persistee ni transmise.
  - Regle de detection robuste a une attenuation lente du signal.
  - Test de non-regression sur un signal stationnaire long.
- Out:
  - Changement d'algorithme d'estimation de hauteur.
  - Traitement du signal cote reduction de bruit maison.
  - Suppression des notes fantomes pendant la recherche de hauteur.

# Acceptance criteria
- AC1: Les contraintes audio reellement appliquees sont relevees et consignees pour chaque navigateur de la matrice.
- AC2: La cause du decrochage est etablie par mesure, distinguant attenuation du signal capte et seuil interne trop strict.
- AC3: Une note tenue pendant au moins vingt secondes reste publiee comme suivie, sans retour aux etats silence, trop faible ou instable.
- AC4: Le correctif n'introduit pas de fausse detection prolongee apres l'arret reel du chant.
- AC5: Un mode diagnostic affiche contraintes appliquees, niveau, clarte et etat courant, sans enregistrer ni transmettre d'audio.
- AC6: Un test automatise sur un signal stationnaire long echoue si le decrochage reapparait.
- AC7: Le comportement est reverifie sur Chrome Android, Firefox desktop et Firefox Android et consigne dans le protocole de validation.

# AC Traceability
- request-AC3 -> This backlog slice. Proof: AC1: Les contraintes audio reellement appliquees sont relevees et consignees pour chaque navigateur de la matrice.
- request-AC4 -> This backlog slice. Proof: AC2: La cause du decrochage est etablie par mesure, distinguant attenuation du signal capte et seuil interne trop strict.
- request-AC5 -> This backlog slice. Proof: AC3: Une note tenue pendant au moins vingt secondes reste publiee comme suivie, sans retour aux etats silence, trop faible ou instable.
- request-AC6 -> This backlog slice. Proof: AC4: Le correctif n'introduit pas de fausse detection prolongee apres l'arret reel du chant.
- request-AC7 -> This backlog slice. Proof: AC5: Un mode diagnostic affiche contraintes appliquees, niveau, clarte et etat courant, sans enregistrer ni transmettre d'audio.

# Decision framing
- Product framing: Not needed
- Architecture framing: Not needed

# Links
- Product brief(s): `prod_002_canto_mode_libre_lisibilite_et_fiabilite_apres_premier_essai`
- Architecture decision(s): (none yet)
- Request: `req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre`
- Primary task(s): `task_002_traiter_les_retours_du_premier_essai_du_mode_libre`

# AI Context
- Summary: Diagnostiquer et corriger le decrochage de la detection sur note tenue
- Keywords: scaffolded-backlog, diagnostiquer et corriger le decrochage de la detection sur note tenue, implementation-ready
- Use when: Implementing the scaffolded slice for Diagnostiquer et corriger le decrochage de la detection sur note tenue.
- Skip when: The change belongs to another backlog slice.

# Priority
- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
