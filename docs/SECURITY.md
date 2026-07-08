# SECURITY.md — DataShare

Ce document présente les décisions de sécurité prises pour le MVP, les risques
connus et acceptés, ainsi que le plan de mitigation associé. Il complète
l'authentification et la gestion des accès déjà décrites dans le Dossier
d'Architecture Technique.

---

## 1. Scan de sécurité basique

### 1.1 Outils

| Outil | Cible | Fréquence proposée |
|---|---|---|
| `npm audit` | Dépendances backend (NestJS) | À chaque `npm install` + CI (future) |
| `npm audit` | Dépendances frontend (React) | Idem |
| GitHub Dependabot (si repo GitHub) | Alertes automatiques sur CVE | Continu |

### 1.2 Procédure

```bash
# Backend
cd backend && npm audit --production

# Frontend
cd frontend && npm audit --production
```

Les vulnérabilités de sévérité **critical** ou **high** doivent être corrigées
avant toute mise en production réelle. Les vulnérabilités **low/moderate**
sans correctif disponible sont documentées ici avec justification du risque
accepté.

### 1.3 Résultat du scan (à date du DAT)

> À compléter avec une capture d'écran du rapport `npm audit` une fois les
> dépendances figées. Format attendu : nombre de vulnérabilités par
> sévérité, package concerné, action (corrigé / accepté / en attente).

---

## 2. Risques identifiés et décisions

### 2.1 Stockage du JWT côté client (localStorage)

**Risque** : le `localStorage` est accessible par n'importe quel script
JavaScript exécuté dans la page. En cas de faille XSS (par exemple via une
librairie tierce compromise, ou un champ mal échappé), un attaquant peut
exfiltrer le token et usurper la session de l'utilisateur.

**Décision pour le MVP** : le token reste en `localStorage`, pour des raisons
de simplicité d'implémentation (pas de gestion de cookie cross-origin entre
le frontend Vite/localhost:5173 et le backend NestJS/localhost:3000).

**Mitigations mises en place** :
- Aucune librairie frontend tierce non auditée n'insère de contenu HTML brut
  (pas de `dangerouslySetInnerHTML` sans sanitization).
- Toute donnée affichée provenant du backend (nom de fichier, tags) est
  échappée par défaut par React (protection XSS native du DOM virtuel).
- `expiresIn` court (token JWT valable quelques heures), limitant la fenêtre
  d'exploitation en cas de vol.

**Évolution recommandée (hors MVP)** : migrer vers un cookie `httpOnly`,
`Secure`, `SameSite=Strict`, ce qui rend le token totalement inaccessible au
JavaScript côté client. Nécessite de configurer le CORS avec
`credentials: true` et un domaine partagé ou un reverse proxy en production.

### 2.2 Absence de rate-limiting sur les endpoints sensibles

**Risque** : `POST /share-links/{token}/download` accepte un mot de passe en
body. Sans limitation, un attaquant peut tenter un nombre illimité de mots de
passe par seconde (brute force). Le même risque existe sur `POST
/auth/login` (credential stuffing) et `POST /auth/register` (spam de
comptes).

**Décision** : mise en place de `@nestjs/throttler` sur ces trois endpoints.

| Endpoint | Limite proposée |
|---|---|
| `POST /auth/login` | 5 tentatives / IP / minute |
| `POST /auth/register` | 10 tentatives / IP / heure |
| `POST /share-links/{token}/download` | 10 tentatives / IP / token / minute |

Au-delà du seuil, réponse `429 Too Many Requests` au format
`application/problem+json`, cohérent avec le reste de l'API.

### 2.3 Validation du type de fichier par extension uniquement

**Risque** : se fier à l'extension du fichier (`.pdf`, `.jpg`) ou au
`Content-Type` déclaré par le client HTTP est trivialement contournable — il
suffit de renommer un fichier exécutable pour passer le contrôle.

**Décision** : la validation du type MIME réel se fait par lecture des
premiers octets du fichier (magic bytes), via une librairie type
`file-type`, **côté serveur**, indépendamment de ce que déclare le client.
La liste blanche/noire d'extensions autorisées reste à définir, mais la vérification ne doit jamais reposer sur la
seule extension ou le header `Content-Type`.

### 2.4 Mot de passe des liens de partage

**Risque** : un mot de passe de protection de fichier stocké en clair serait
lisible en cas de fuite de la base de données.

**Décision** : le mot de passe du `ShareLink` est hashé (bcrypt ou argon2)
avant persistance, au même titre que le mot de passe utilisateur — jamais en
clair, jamais loggé, jamais transmis dans l'URL (déjà respecté dans la
spec OpenAPI : transmission via body JSON en `POST`).

### 2.5 Absence de vérification du propriétaire côté client

**Risque** : si le backend faisait confiance à un `userId` transmis par le
client (body, query param) pour déterminer les droits, un attaquant pourrait
modifier cette valeur pour accéder aux fichiers d'un autre utilisateur.

**Décision** : déjà correctement anticipé dans le DAT — l'identité de
l'utilisateur est **exclusivement** extraite du JWT signé côté serveur, et
`DELETE /file-assets/{fileAssetId}` vérifie que `fileAsset.ownerId ===
jwt.sub` avant toute suppression. Ce point est à couvrir explicitement par
un test d'intégration (déjà prévu dans TESTING.md).

### 2.6 Taille de fichier et déni de service applicatif

**Risque** : sans limite stricte appliquée en amont du traitement, un upload
de fichier volumineux peut saturer la mémoire ou le disque du serveur, même
avec un traitement en streaming.

**Décision** :
- Limite de 1 Go appliquée **avant** le début du traitement, via
  configuration du middleware multipart (pas de vérification a posteriori
  sur un fichier déjà entièrement reçu).
- Le traitement en streaming (déjà spécifié dans l'OpenAPI) évite de charger
  le fichier en mémoire, réduisant le risque de saturation RAM même en cas
  d'upload proche de la limite.
- Surveillance de l'espace disque disponible à prévoir en production
  (hors périmètre du MVP local).

### 2.7 Fuite d'information via les messages d'erreur

**Risque** : des messages d'erreur trop détaillés (stack trace, chemin de
fichier serveur, requête SQL) peuvent révéler des informations exploitables
par un attaquant.

**Décision** : toutes les erreurs suivent le format standardisé
`application/problem+json` (RFC 9457) déjà défini dans l'OpenAPI, avec des
messages génériques côté client. Les détails techniques (stack trace) sont
uniquement loggés côté serveur, jamais renvoyés dans la réponse HTTP,
y compris en cas d'erreur 500 non gérée explicitement.

### 2.8 CORS

**Risque** : une configuration CORS trop permissive (`*`) exposerait l'API à
des appels depuis n'importe quel domaine.

**Décision** : le backend NestJS restreint `Access-Control-Allow-Origin` à
l'origine exacte du frontend (`http://localhost:5173` en développement, à
adapter en production), et non un wildcard.

### 2.9 Gestion des secrets

**Risque** : un secret JWT ou des identifiants de base de données commités
dans le repository Git exposeraient l'application en cas de dépôt public ou
de fuite.

**Décision** : toutes les valeurs sensibles (`JWT_SECRET`,
`DATABASE_URL`, futurs identifiants S3) transitent par variables
d'environnement via un fichier `.env` non commité (présent dans
`.gitignore`), avec un `.env.example` documentant les clés attendues sans
valeurs réelles.

---

## 3. Synthèse des décisions

| # | Risque | Statut | Mitigation |
|---|---|---|---|
| 2.1 | JWT en localStorage (XSS) | Accepté pour le MVP | Token court, pas d'injection HTML brute |
| 2.2 | Absence de rate-limiting | À implémenter | `@nestjs/throttler` sur login/register/download |
| 2.3 | Validation par extension seule | À implémenter | Vérification magic bytes côté serveur |
| 2.4 | Mot de passe lien en clair | Résolu par design | Hash bcrypt/argon2 |
| 2.5 | Confiance dans le userId client | Résolu par design | Identité extraite du JWT uniquement |
| 2.6 | DoS via upload volumineux | Résolu par design | Limite 1 Go + streaming |
| 2.7 | Fuite d'info dans les erreurs | Résolu par design | Format problem+json générique |
| 2.8 | CORS permissif | À configurer | Origine explicite, pas de wildcard |
| 2.9 | Secrets commités | À vérifier | `.env` + `.gitignore` |

---

## 4. Hors périmètre du MVP (évolutions futures)

- Migration JWT vers cookie `httpOnly` + `SameSite`.
- 2FA / MFA pour les comptes utilisateurs.
- Scan antivirus des fichiers téléversés (type ClamAV) avant stockage.
- Chiffrement au repos des fichiers stockés (au-delà du chiffrement natif S3).
- Journalisation d'audit des accès aux liens de partage (IP, timestamp).
