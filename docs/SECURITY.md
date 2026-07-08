# SECURITY.md - DataShare

Ce document presente les decisions de securite prises pour le MVP, les risques connus et acceptes, ainsi que les mitigations associees.

## 1. Scan De Securite

### Outils

| Outil | Cible | Frequence proposee |
|---|---|---|
| `npm audit` | Dependances backend et frontend | A chaque `npm install` et en CI |
| `npm audit --omit=dev` | Dependances runtime/production | Avant livraison |
| GitHub Dependabot | Alertes automatiques sur CVE | Continu |

### Commandes

Depuis la racine du monorepo :

```bash
npm audit
npm audit --omit=dev
```

Les vulnerabilites `critical` ou `high` doivent etre corrigees avant une mise en production. Les vulnerabilites `low` ou `moderate` sans correctif disponible doivent etre documentees avec justification du risque accepte.

### Resultat Du Scan Apres Correction

Date de verification : 2026-07-08.

```bash
npm audit --json
```

Resultat :

```text
0 vulnerabilities
```

Synthese :

| Severite | Nombre |
|---|---:|
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| Total | 0 |

Verification production/runtime :

```bash
npm audit --omit=dev --json
```

Resultat :

```text
0 vulnerabilities
```

### Corrections Appliquees

| Package / chaine | Probleme initial | Action |
|---|---|---|
| NestJS runtime (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | Vulnerabilites transitives `file-type`, `express`, `body-parser`, `multer`, injection Nest core | Mise a jour vers NestJS 11 (`@nestjs/common/core/platform-express@11.1.28`) |
| `@nestjs/swagger` | `js-yaml`, `lodash`, compatibilite Nest | Mise a jour vers `@nestjs/swagger@11.4.5` |
| `@nestjs/config` | `lodash` vulnerable | Mise a jour vers `@nestjs/config@4.0.4` |
| `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/testing` | Compatibilite Nest 11 | Mise a jour vers les versions compatibles Nest 11 |
| `multer` | Denial of Service via multipart parsing / cleanup | Mise a jour vers `multer@2.2.0` |
| Cypress toolchain | `@cypress/request`, `qs`, `uuid`, `lodash` | Mise a jour vers `cypress@15.18.1` |
| Transitives (`file-type`, `lodash`, `qs`, `uuid`, `rxjs`) | Versions vulnerables ou doublons incompatibles | Ajout d'`overrides` npm et `npm dedupe` |

### Verification De Non-Regression

Commandes executees apres correction :

```bash
npm run build -w apps/api
npm run test -w apps/api
npm run build -w apps/web
npm run test -w apps/web
```

Resultat :

```text
API build: passed
API tests: 15 suites passed, 81 tests passed
Web build: passed
Web tests: 13 files passed, 39 tests passed
```

## 2. Risques Identifies Et Decisions

### 2.1 JWT En LocalStorage

Risque : le `localStorage` est accessible par tout script execute dans la page. En cas de faille XSS, un attaquant pourrait exfiltrer le token et usurper la session.

Decision MVP : le token reste en `localStorage` pour garder une implementation simple entre le frontend Vite et le backend NestJS.

Mitigations :

- Pas d'injection HTML brute non controlee.
- Les donnees backend affichees par React sont echappees par defaut.
- La duree de vie du token reste limitee.

Evolution recommandee : migrer vers un cookie `httpOnly`, `Secure`, `SameSite=Strict` avec CORS `credentials: true` et un domaine partage ou un reverse proxy.

### 2.2 Rate Limiting Sur Les Endpoints Sensibles

Risque : sans limitation, `POST /auth/login`, `POST /auth/register` et `POST /share-links/{token}/download` peuvent etre attaques par brute force ou credential stuffing.

Decision : ajouter `@nestjs/throttler` sur ces endpoints.

| Endpoint | Limite proposee |
|---|---|
| `POST /auth/login` | 5 tentatives / IP / minute |
| `POST /auth/register` | 10 tentatives / IP / heure |
| `POST /share-links/{token}/download` | 10 tentatives / IP / token / minute |

Les depassements doivent retourner `429 Too Many Requests` au format `application/problem+json`.

### 2.3 Validation Du Type De Fichier

Risque : l'extension ou le `Content-Type` declare par le client peut etre falsifie.

Decision : la validation doit reposer sur les premiers octets du fichier, cote serveur, avec une verification de type MIME reel. La liste blanche/noire d'extensions reste un controle complementaire, jamais le controle principal.

### 2.4 Mot De Passe Des Liens De Partage

Risque : un mot de passe de lien stocke en clair serait lisible en cas de fuite de base de donnees.

Decision : le mot de passe du `ShareLink` est hashe avant persistance. Il n'est jamais stocke en clair, jamais logge, et jamais transmis dans l'URL.

### 2.5 Controle Du Proprietaire

Risque : si le backend faisait confiance a un `userId` transmis par le client, un attaquant pourrait acceder aux fichiers d'un autre utilisateur.

Decision : l'identite utilisateur est exclusivement extraite du JWT signe cote serveur. La suppression d'un fichier verifie que `fileAsset.ownerId === jwt.sub`.

### 2.6 Taille De Fichier Et DoS Applicatif

Risque : un upload volumineux peut saturer la memoire ou le disque serveur.

Decision :

- Limite de 1 Go appliquee avant traitement.
- Traitement en streaming pour eviter de charger le fichier entier en memoire.
- Surveillance disque a prevoir en production.

### 2.7 Fuite D'information Dans Les Erreurs

Risque : des messages d'erreur trop detailles peuvent exposer stack traces, chemins serveur ou details SQL.

Decision : les erreurs publiques suivent `application/problem+json` avec messages generiques. Les details techniques restent dans les logs serveur.

### 2.8 CORS

Risque : une configuration CORS permissive (`*`) expose l'API a des appels depuis n'importe quel domaine.

Decision : le backend restreint `Access-Control-Allow-Origin` a l'origine exacte du frontend, par exemple `http://localhost:5173` en developpement.

### 2.9 Gestion Des Secrets

Risque : un secret JWT ou une URL de base de donnees committe exposerait l'application.

Decision : les secrets transitent par variables d'environnement via `.env`, non committe. `.env.example` documente les cles attendues sans valeurs sensibles.

## 3. Synthese

| # | Risque | Statut | Mitigation |
|---|---|---|---|
| 2.1 | JWT en localStorage | Accepte MVP | Token court, pas d'injection HTML brute |
| 2.2 | Absence de rate limiting | A implementer | `@nestjs/throttler` |
| 2.3 | Validation par extension seule | A implementer | Magic bytes cote serveur |
| 2.4 | Mot de passe lien en clair | Resolu | Hash avant persistance |
| 2.5 | Confiance dans le userId client | Resolu | Identite extraite du JWT |
| 2.6 | DoS via upload volumineux | Resolu | Limite 1 Go + streaming |
| 2.7 | Fuite d'information dans les erreurs | Resolu | `problem+json` generique |
| 2.8 | CORS permissif | Configure | Origine explicite |
| 2.9 | Secrets committes | Configure | `.env` ignore + `.env.example` |

## 4. Hors Perimetre Du MVP

- Migration JWT vers cookie `httpOnly` + `SameSite`.
- 2FA / MFA pour les comptes utilisateurs.
- Scan antivirus des fichiers televerses.
- Chiffrement au repos des fichiers stockes.
- Journalisation d'audit des acces aux liens de partage.
