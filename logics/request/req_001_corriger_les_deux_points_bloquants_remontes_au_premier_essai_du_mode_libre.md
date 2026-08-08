## req_001_corriger_les_deux_points_bloquants_remontes_au_premier_essai_du_mode_libre - Corriger les deux points bloquants remontes au premier essai du mode libre
> From version: 0.1.0
> Schema version: 1.0
> Status: Draft
> Understanding: 90%
> Confidence: 85%
> Complexity: High
> Theme: Retours d'usage MVP
> Reminder: Update status/understanding/confidence and linked backlog/task references when you edit this doc.

# Needs
- Voir en meme temps le piano, la note detectee et la trace, sans faire defiler la page.
- Garder une note tenue detectee aussi longtemps qu'elle est chantee, sans decrochage au bout de quelques secondes.
- Comprendre pourquoi la detection decroche, au lieu de contourner le symptome.

# Context
- Premier essai du 8 aout 2026 sur le build local : la boucle fonctionne, les trois timbres sont valides et le microphone est bien detecte.
- Les notes fantomes observees pendant la recherche de hauteur sont jugees normales par l'utilisateur : la voix balaie les frequences avant de se stabiliser. Elles ne font pas partie de cette demande.
- L'ecran actuel empile en-tete, panneau de hauteur, legende, trace, piano, controles et pied de page ; l'ensemble depasse la hauteur du viewport et oblige a defiler pour voir le piano et la note en meme temps.
- Sur une note tenue stable, la detection s'arrete au bout de quelques secondes alors que le son continue. Hypothese principale : un traitement voix du navigateur, suppression de bruit ou controle automatique de gain, attenue un signal stationnaire malgre les contraintes getUserMedia demandees. Hypothese secondaire : un seuil interne de niveau ou de clarte devenu trop strict quand le signal s'attenue.
- L'hypothese doit etre mesuree avant correction : les contraintes demandees a getUserMedia ne sont pas toujours celles reellement appliquees par le navigateur.
- La correction de mise en page ne doit pas casser l'alignement structurel entre la trace et les touches, qui vient d'une source de geometrie unique.

# Acceptance criteria
- AC1: Sur mobile en paysage et sur ordinateur, le piano, la note detectee et la trace sont visibles simultanement sans defilement.
- AC2: La zone de trace occupe une part bornee de la hauteur disponible ; le clavier et le bandeau de note restent visibles quelle que soit la taille du viewport cible.
- AC3: Une note tenue pendant au moins vingt secondes reste detectee en continu, sans retour aux etats silence, signal trop faible ou hauteur instable.
- AC4: La cause du decrochage est identifiee et documentee, contraintes audio reellement appliquees a l'appui, et non seulement contournee.
- AC5: Un mode diagnostic permet de relire les contraintes appliquees, le niveau et la confiance sans brancher un debogueur.
- AC6: Des tests automatises couvrent la regle de mise en page et la non-regression du decrochage sur un signal stationnaire long.
- AC7: Aucune regression sur l'alignement trace/touches, les etats existants, l'accessibilite et le fonctionnement hors ligne.

# Definition of Ready (DoR)
- [x] Problem statement is explicit and user impact is clear.
- [x] Scope boundaries (in/out) are explicit.
- [x] Acceptance criteria are testable.
- [x] Dependencies and known risks are listed.

# Companion docs
- Product brief(s): `prod_002_canto_mode_libre_lisibilite_et_fiabilite_apres_premier_essai`
- Architecture decision(s): (none yet)

# References
- Retour utilisateur du 8 aout 2026 sur le build local du MVP mode libre
- task_001_orchestrer_la_livraison_du_mvp_mode_libre
- docs/validation-protocol.md

# AI Context
- Summary: Corriger les deux points bloquants remontes au premier essai du mode libre
- Keywords: request-chain-scaffold, corriger les deux points bloquants remontes au premier essai du mode libre, development-ready
- Use when: You need to implement or review the scaffolded workflow for Corriger les deux points bloquants remontes au premier essai du mode libre.
- Skip when: The change is unrelated to this scaffolded request chain.

# Backlog
- `item_006_tenir_le_mode_libre_dans_un_seul_ecran`
- `item_007_diagnostiquer_et_corriger_le_decrochage_de_la_detection_sur_note_tenue`
