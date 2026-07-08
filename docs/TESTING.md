# TESTING.md — DataShare

Ce document décrit la stratégie de tests du projet DataShare, les commandes utiles, les critères de qualité attendus et la manière de consulter les rapports de couverture et de linting. Il complète le Dossier d’Architecture Technique et sert de guide pratique pour l’exécution locale ou future CI.

---

## 1. Objectif

La stratégie de test vise à sécuriser les fonctionnalités critiques du MVP :

- création de compte ;
- connexion utilisateur ;
- téléversement de fichier ;
- génération d’un lien de partage ;
- téléchargement via lien public ;
- consultation de l’historique ;
- suppression d’un fichier ;
- protection des routes et des ressources utilisateur.

L’objectif est de couvrir les règles métier au plus près de leur implémentation, puis de valider les principaux parcours utilisateur avec des tests end-to-end.

---

## 2. Niveaux de tests

DataShare utilise plusieurs niveaux de tests complémentaires.

| Niveau | Cible | Objectif | Outils |
|---|---|---|---|
| Tests unitaires backend | Services métier, services techniques, repositories, guards, helpers | Valider la logique isolée sans serveur HTTP réel | Jest |
| Tests d’intégration backend | Controllers REST, auth, upload, download, accès protégés | Valider le comportement réel de l’API NestJS | Jest + Supertest |
| Tests unitaires frontend | Composants UI purs, stores Zustand, services API, helpers | Valider le rendu, la gestion d’état et les mappings API | Vitest + React Testing Library |
| Tests d’intégration frontend | Pages + stores + services mockés | Valider une fonctionnalité complète sans backend réel | React Testing Library + MSW |
| Tests E2E | Parcours navigateur complets | Valider les principaux flux utilisateur de bout en bout | Cypress |
| Linting | Backend, frontend, Cypress | Vérifier la qualité statique du code | ESLint + Prettier |

---

## 3. Plan de tests backend

| Type de test | Cible | Scénarios principaux | Outils |
|---|---|---|---|
| Tests unitaires | Services métier | Création utilisateur, génération JWT, création `FileAsset`, création `ShareLink`, calcul du statut `active/expired/deleted`, suppression logique, vérification du mot de passe de lien | Jest |
| Tests unitaires | Services techniques | Hash de mot de passe, génération de token non prédictible, calcul de date d’expiration, validation des extensions/types interdits, génération du chemin de stockage | Jest |
| Tests d’intégration | Controllers REST | `POST /auth/register`, `POST /auth/login`, `POST /file-assets`, `GET /me/file-assets`, `DELETE /file-assets/{id}`, `GET /share-links/{token}`, `POST /share-links/{token}/download` | Jest + Supertest |
| Tests d’intégration | Authentification / autorisation | Refus sans token, refus avec token invalide, accès avec token valide, impossibilité de supprimer le fichier d’un autre utilisateur | Jest + Supertest |
| Tests d’intégration | Upload / download | Upload multipart valide, rejet fichier trop volumineux, rejet type interdit, téléchargement par token valide, refus token expiré, refus mot de passe invalide | Jest + Supertest |
| Tests base de données | Repositories / ORM | Création utilisateur, création fichier, création lien, association tags, suppression ou invalidation des liens | DB de test / Docker |
| Tests tâche planifiée | Expiration des fichiers | Fichier expiré supprimé ou marqué supprimé, fichier actif conservé, fichier physique supprimé du stockage | Jest |

---

## 4. Plan de tests frontend

| Type de test | Cible | Scénarios principaux | Outils |
|---|---|---|---|
| Smoke tests | Application React | Les routes principales s’affichent : accueil, login, register, upload, espace utilisateur | Vitest + React Testing Library |
| Tests unitaires | Composants UI purs | `Button`, `Input`, `Select`, `Callout`, `Header`, `FileItem`, `UploadCard`, états `disabled/loading/error` | Vitest + React Testing Library |
| Tests unitaires | Stores Zustand | État initial, stockage utilisateur connecté, stockage token, ajout/suppression fichier, gestion `loading/error` | Vitest |
| Tests unitaires | Services API | Ajout du header JWT, parsing `{ status, message, data }`, gestion `application/problem+json`, gestion des erreurs HTTP | Vitest + mocks HTTP |
| Tests d’intégration frontend | Pages + stores + services mockés | Login, affichage erreur validation, upload simulé, affichage lien généré, filtrage historique actif/expiré | React Testing Library + MSW |
| Tests E2E | Parcours utilisateur complets | Création de compte, login, upload, affichage lien, téléchargement, historique, suppression | Cypress |
| Tests E2E sécurité | Routes protégées | Accès à l’espace utilisateur sans token, token expiré, suppression non autorisée, lien expiré | Cypress |
| Tests accessibilité de base | Écrans principaux | Labels, navigation clavier, contrastes, messages d’erreur lisibles | Cypress axe / Testing Library |

---

## 5. Scénarios E2E prioritaires

| Priorité | Scénario | Description |
|---|---|---|
| P1 | Création de compte + connexion | L’utilisateur crée un compte, se connecte et accède à son espace. |
| P1 | Upload fichier connecté | L’utilisateur téléverse un fichier et obtient un lien de partage. |
| P1 | Téléchargement via lien | Un utilisateur anonyme ouvre le lien et télécharge le fichier. |
| P1 | Historique utilisateur | L’utilisateur connecté retrouve ses fichiers dans son historique. |
| P1 | Suppression fichier | L’utilisateur supprime un fichier ; le lien associé devient inutilisable. |
| P2 | Fichier protégé par mot de passe | Le téléchargement demande un mot de passe et refuse une valeur invalide. |
| P2 | Fichier expiré | Un lien expiré retourne une erreur claire. |
| P2 | Filtrage historique | L’utilisateur filtre ses fichiers par statut `active`, `expired` ou `all`. |

---

## 6. Commandes utiles

### 6.1 Vérifications qualité globales

```bash
npm run quality
```

Cette commande doit idéalement exécuter :

- lint backend/frontend ;
- tests backend/frontend ;
- build backend/frontend.

### 6.2 Génération des rapports

```bash
npm run reports
```

Cette commande génère les rapports de lint et de couverture.

### 6.3 Couverture uniquement

```bash
npm run test:coverage
```

### 6.4 Lint uniquement

```bash
npm run lint:report
```

### 6.5 Cypress E2E

Les tests Cypress nécessitent que l’application frontend soit disponible.

```bash
npm run dev -w apps/web
npm run test:e2e:report -w apps/web
```

Selon l’organisation locale du projet, les mêmes commandes peuvent être adaptées avec `pnpm`.

---

## 7. Rapports de couverture

Les rapports de couverture sont générés dans le dossier `reports/`.

### Backend

Chemins attendus :

```text
reports/api/coverage/index.html
reports/api/coverage/coverage-summary.json
reports/api/coverage/lcov.info
```

Dernier résultat connu :

| Métrique | Couvert | Total | Couverture |
|---|---:|---:|---:|
| Statements | 482 | 578 | 83.39% |
| Lines | 428 | 508 | 84.25% |
| Functions | 86 | 88 | 97.72% |
| Branches | 87 | 110 | 79.09% |

Résultat backend :

```text
Test Suites: 15 passed, 15 total
Tests: 81 passed, 81 total
Snapshots: 0 total
```

La couverture backend porte notamment sur :

- configuration et variables d’environnement ;
- services métier ;
- repositories Prisma ;
- stockage local ;
- utilisateurs, tags, fichiers et liens de partage ;
- DTOs de réponse ;
- lifecycle Prisma ;
- stratégie JWT ;
- guard JWT optionnel ;
- placeholder S3.

### Frontend

Chemins attendus :

```text
reports/web/coverage/index.html
reports/web/coverage/coverage-summary.json
reports/web/coverage/lcov.info
```

Dernier résultat connu :

| Métrique | Couvert | Total | Couverture |
|---|---:|---:|---:|
| Statements | 319 | 423 | 75.41% |
| Lines | 300 | 401 | 74.81% |
| Functions | 106 | 154 | 68.83% |
| Branches | 185 | 269 | 68.77% |

Résultat frontend :

```text
Test Files: 13 passed, 13 total
Tests: 39 passed, 39 total
```

La couverture frontend porte notamment sur :

- pages d’authentification ;
- flux de création de compte ;
- page de téléchargement public ;
- gestion du téléchargement binaire ;
- page d’upload ;
- page d’historique ;
- composants UI ;
- stores Zustand ;
- services API ;
- gestion des erreurs HTTP.

---

## 8. Rapport Cypress E2E

Chemin attendu :

```text
reports/web/cypress/cypress.json
```

Dernière exécution connue :

| Champ | Valeur |
|---|---|
| Statut | passed |
| Browser | Electron 118.0.5993.159 |
| Cypress | 13.17.0 |
| OS | win32 10.0.19045 |
| Duration | 8613 ms |
| Suites | 4 |
| Tests | 7 |
| Passed | 7 |
| Failed | 0 |
| Pending | 0 |
| Skipped | 0 |

Scénarios couverts :

| Spec | Tests | Résultat |
|---|---:|---|
| `cypress/e2e/history-delete.cy.ts` | 2 | passed |
| `cypress/e2e/register-login.cy.ts` | 2 | passed |
| `cypress/e2e/share-link-download.cy.ts` | 2 | passed |
| `cypress/e2e/upload-file.cy.ts` | 1 | passed |

Parcours validés :

- upload d’un fichier en utilisateur connecté ;
- affichage de l’historique et suppression d’un fichier ;
- connexion et ouverture de `Mon espace` ;
- création d’un compte et ouverture de `Mon espace` ;
- téléchargement public sans authentification ;
- téléchargement public en étant authentifié ;
- upload anonyme et affichage du lien public.

---

## 9. Rapports de linting

Les rapports ESLint sont générés au format JSON.

```text
reports/api/lint/eslint.json
reports/web/lint/eslint.json
```

Commandes :

```bash
npm run lint:report -w apps/api
npm run lint:report -w apps/web
npm run lint:report
```

Le backend vérifie notamment :

```text
apps/api/src/**/*.ts
apps/api/test/**/*.ts
```

Le frontend vérifie notamment :

```text
apps/web/src/**/*.{ts,tsx}
apps/web/cypress/**/*.ts
apps/web/cypress.config.ts
```

La stratégie de linting reste volontairement légère :

- ESLint détecte les problèmes TypeScript, React Hooks et JavaScript/TypeScript courants ;
- Prettier est intégré via `eslint-config-prettier` pour éviter les conflits de règles de formatage ;
- les specs Cypress sont incluses car elles constituent du code exécutable ;
- les dossiers générés (`dist/`, `coverage/`, `reports/`, screenshots, vidéos, downloads Cypress) sont ignorés.

---

## 10. Quality gates

Les règles suivantes sont proposées avant livraison ou merge :

| Contrôle | Attendu |
|---|---|
| `npm run lint` | Doit passer sans erreur bloquante |
| `npm run test` | Doit passer sur backend et frontend |
| `npm run build` | Doit produire les builds backend/frontend |
| `npm run test:coverage` | Doit générer les rapports de couverture |
| Cypress | À exécuter pour toute modification touchant auth, upload, download, historique ou routing |

Objectifs de couverture :

| Élément | Objectif |
|---|---|
| Backend | Minimum indicatif : 70 % sur les services métier principaux |
| Frontend | Priorité aux composants critiques, stores, services API et parcours utilisateur |
| E2E | Minimum 3 scénarios critiques automatisés : login, upload, download |

---

## 11. Isolation et nettoyage

Les tests doivent éviter les effets de bord entre exécutions.

Règles attendues :

- utiliser une base de données de test ou une base Docker dédiée ;
- utiliser un répertoire temporaire pour les fichiers générés pendant les tests ;
- supprimer les fichiers de test après exécution ;
- ne pas dépendre de données créées manuellement ;
- ne pas commiter les rapports générés.

Le dossier `reports/` est ignoré par Git. Les rapports doivent être régénérés localement ou par la CI.

---

## 12. Synthèse

La stratégie de test DataShare combine :

- tests unitaires pour sécuriser la logique métier ;
- tests d’intégration pour valider l’API NestJS ;
- tests frontend pour vérifier composants, stores et services ;
- tests E2E pour valider les parcours utilisateur critiques ;
- rapports de couverture et de lint pour suivre la qualité dans le temps.

Cette approche est adaptée au MVP tout en restant compatible avec une future automatisation CI/CD.
