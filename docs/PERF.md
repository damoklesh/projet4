# PERF.md — DataShare

Ce document présente le suivi de performance réalisé pour le MVP DataShare. Il couvre les objectifs de performance retenus, les mesures effectuées depuis le navigateur, leur interprétation, ainsi que les limites connues du test.

Les mesures ci-dessous ont été réalisées en environnement local, à partir des Chrome DevTools, sur une application lancée en développement.

---

## 1. Objectifs de performance du MVP

L’objectif du MVP n’est pas de valider une montée en charge réelle, mais de vérifier que les parcours critiques restent réactifs et que les choix d’architecture ne bloquent pas les performances de base.

| Élément mesuré | Objectif MVP |
|---|---:|
| Affichage initial d’un écran principal | < 2 s |
| Navigation entre pages | < 500 ms |
| Réponse d’un endpoint courant | < 500 ms en local |
| Consultation de l’historique paginé | < 500 ms en local |
| Upload d’un petit fichier de test | < 500 ms en local, hors fichier volumineux |
| Download d’un petit fichier de test | < 500 ms en local, hors fichier volumineux |
| Stabilité visuelle frontend | CLS proche de 0 |

Ces seuils sont indicatifs et adaptés au contexte local du MVP. Ils devront être revus avant une mise en production réelle, notamment avec des tests de charge.

---

## 2. Points critiques identifiés

Les opérations les plus sensibles pour DataShare sont :

- le téléversement de fichiers ;
- le téléchargement via lien public ;
- la consultation paginée de l’historique utilisateur ;
- le chargement initial des écrans frontend ;
- la stabilité visuelle de l’interface.

Les fichiers binaires ne sont pas stockés en base de données. PostgreSQL conserve uniquement les métadonnées. Les opérations d’upload et de download doivent être traitées en streaming afin d’éviter le chargement complet du fichier en mémoire.

---

## 3. Méthodologie de test

Les mesures ont été effectuées avec Chrome DevTools :

- onglet **Network** pour les temps de réponse API ;
- détail **Timing** pour distinguer l’attente serveur et le téléchargement de contenu ;
- onglet **Performance / Local metrics** pour les métriques frontend visibles localement.

Contexte du test :

| Élément | Valeur |
|---|---|
| Environnement | Local development |
| Frontend | React / Vite |
| Backend | NestJS |
| Base de données | PostgreSQL local |
| Navigateur | Chrome / DevTools |
| Cache | Mesure réalisée depuis les outils navigateur |
| Données | Fichiers de test légers, historique de quelques fichiers |

---

## 4. Résultats observés

### 4.1 Téléchargement d’un fichier

Endpoint / action testée :

```http
POST /share-links/{token}/download
```

Résultat observé dans Chrome DevTools :

| Mesure | Valeur |
|---|---:|
| Temps total | 62.99 ms |
| Waiting for server response | 50.94 ms |
| Content download | 0.84 ms |
| Request sent | 78 µs |
| Stalled | 1.43 ms |
| Statut fonctionnel | Téléchargement réussi |

Interprétation :

Le téléchargement d’un fichier léger est rapide en environnement local. La majorité du temps est passée en attente de la réponse serveur, ce qui est normal pour une requête impliquant une vérification du lien, un éventuel contrôle de mot de passe et l’ouverture du flux fichier. Le temps de téléchargement du contenu est très faible sur ce fichier de test.

Capture associée :

![Timing téléchargement](./perf-download.PNG)

---

### 4.2 Consultation de l’historique utilisateur

Endpoint / action testée :

```http
GET /me/file-assets?page=1&pageSize=10&status=active
```

Résultat observé dans Chrome DevTools :

| Mesure | Valeur |
|---|---:|
| Temps total | 175.54 ms |
| Waiting for server response | 157.98 ms |
| Content download | 0.66 ms |
| Request sent | 97 µs |
| Stalled | 1.45 ms |
| Queueing | 15.35 ms |
| Statut fonctionnel | Historique affiché |

Interprétation :

Le temps de réponse reste inférieur au seuil MVP de 500 ms. L’endpoint utilise une pagination, ce qui limite le volume de données retourné et évite de charger tout l’historique utilisateur. La taille du téléchargement de contenu est très faible, car seules les métadonnées des fichiers sont transférées.

Capture associée :

![Timing historique](./perf-listendpoint.PNG)

---

### 4.3 Upload d’un fichier

Endpoint / action testée :

```http
POST /file-assets
```

Résultat observé dans Chrome DevTools :

| Mesure | Valeur |
|---|---:|
| Temps total | 179.58 ms |
| Waiting for server response | 164.59 ms |
| Content download | 1.10 ms |
| Request sent | 0.32 ms |
| Stalled | 0.68 ms |
| Queueing | 12.89 ms |
| Statut fonctionnel | Upload réussi |

Interprétation :

L’upload d’un fichier léger reste inférieur au seuil MVP de 500 ms. Le temps principal correspond au traitement serveur : réception du fichier, validation, écriture dans le stockage local, création des métadonnées et génération du lien de partage. Ce résultat est satisfaisant pour le MVP local.

Capture associée :

![Timing upload](./perf-upload.PNG)

---

### 4.4 Métriques frontend locales

Écran testé :

```text
Mon espace / Mes fichiers
```

Résultat observé dans Chrome DevTools :

| Métrique | Valeur | Interprétation |
|---|---:|---|
| Largest Contentful Paint (LCP) | 0.74 s | Bon résultat local, inférieur à l’objectif de 2 s |
| Cumulative Layout Shift (CLS) | 0.03 | Bonne stabilité visuelle |
| Interaction to Next Paint (INP) | Non mesuré | Nécessite une interaction utilisateur pendant l’enregistrement |

Interprétation :

L’écran d’historique se charge rapidement en local. Le LCP observé est largement inférieur au budget de 2 secondes. Le CLS est proche de zéro, ce qui indique que la mise en page est stable et ne provoque pas de déplacements visuels importants pendant le chargement.

Capture associée :

![Métriques frontend locales](./perf-list.PNG)

---

## 5. Résultats k6

Une campagne k6 a été exécutée localement le 16/07/2026 avec le script :

```text
perf/k6/datashare-load.js
```

Commande utilisée :

```bash
npm run perf:k6
```

### 5.1 Couverture du test

| Scénario | Charge | Endpoint principal | Résultat fonctionnel |
|---|---:|---|---|
| Login | 100 utilisateurs virtuels | `POST /auth/login` | 100% des checks réussis |
| Upload | 20 utilisateurs virtuels | `POST /file-assets` | 0 échec |
| Download | 50 utilisateurs virtuels | `POST /share-links/{token}/download` | 0 échec |
| Historique | 200 utilisateurs virtuels | `GET /me/file-assets` | 0 échec |

Le test complet a exécuté 370 itérations, 571 requêtes HTTP et 700 checks. Aucun check n'a échoué et le taux d'échec HTTP est resté à 0%.

La phase `setup` du script crée des utilisateurs de test uniques, les authentifie, puis téléverse un fichier initial utilisé par le scénario de téléchargement.

### 5.2 Seuils k6

| Seuil | Résultat observé | Objectif | Statut |
|---|---:|---:|---|
| Taux d'erreur HTTP | 0.00% | < 5% | Conforme |
| Échecs login | 0.00% | < 1% | Conforme |
| Échecs upload | 0.00% | < 5% | Conforme |
| Échecs download | 0.00% | < 5% | Conforme |
| Échecs historique | 0.00% | < 5% | Conforme |
| Login p95 | 26.82 s | < 1 s | Non conforme |
| Upload p95 | 8.07 s | < 3 s | Non conforme |
| Download first byte p95 | 128.84 ms | < 1 s | Conforme |
| Historique p95 | 682.56 ms | < 1 s | Conforme |

### 5.3 Métriques principales

| Scénario | Moyenne | Médiane | p90 | p95 | Maximum |
|---|---:|---:|---:|---:|---:|
| Login | 15.82 s | 14.37 s | 25.36 s | 26.82 s | 27.87 s |
| Upload | 8.04 s | 8.05 s | 8.07 s | 8.07 s | 8.07 s |
| Download first byte | 77.57 ms | 77.64 ms | 125.66 ms | 128.84 ms | 130.89 ms |
| Historique | 407.72 ms | 439.02 ms | 657.07 ms | 682.57 ms | 715.33 ms |

### 5.4 Exécution et réseau

| Métrique | Valeur |
|---|---:|
| Requêtes HTTP totales | 571 |
| Débit moyen | 4.42 req/s |
| Itérations terminées | 370 |
| Durée totale du run | 2 min 09.1 s |
| Données reçues | 409 kB |
| Données envoyées | 175 kB |

### 5.5 Interprétation

La campagne k6 montre que les parcours critiques restent fonctionnellement stables sous la charge configurée : aucun téléchargement, upload, login ou appel d'historique n'a échoué. Les endpoints de téléchargement et d'historique restent sous les seuils de latence.

En revanche, les seuils de performance ne sont pas entièrement validés. Le login présente une latence p95 très élevée, à 26.82 secondes pour 100 utilisateurs virtuels. L'upload dépasse aussi son objectif, avec une latence p95 de 8.07 secondes pour 20 utilisateurs virtuels.

Ces résultats indiquent que le MVP est fonctionnel sous cette charge locale, mais que les performances de login et d'upload doivent être analysées avant une mise en production réelle. Les pistes principales sont la mesure CPU/mémoire pendant le test, l'observation PostgreSQL, le coût du hash de mot de passe sur les logins concurrents et le traitement serveur de l'upload.

---

## 6. Budget de performance frontend

Le budget de performance côté frontend est volontairement simple pour le MVP.

| Indicateur | Objectif |
|---|---:|
| Affichage initial d’un écran principal | < 2 s |
| Navigation entre pages | < 500 ms |
| LCP local | < 2 s |
| CLS | < 0.1 |
| Chargement de l’historique | Pagination obligatoire |
| Librairies UI | Éviter les dépendances lourdes non nécessaires |
| Images et assets | Limiter et optimiser les ressources |


---

## 7. Synthèse des résultats

| Test | Résultat observé | Objectif MVP | Statut |
|---|---:|---:|---|
| Download fichier | 62.99 ms | < 500 ms | Conforme |
| Historique utilisateur | 175.54 ms | < 500 ms | Conforme |
| Upload fichier léger | 179.58 ms | < 500 ms | Conforme |
| LCP écran historique | 0.74 s | < 2 s | Conforme |
| CLS écran historique | 0.03 | < 0.1 | Conforme |
| k6 download first byte p95 | 128.84 ms | < 1 s | Conforme |
| k6 historique p95 | 682.56 ms | < 1 s | Conforme |
| k6 login p95 | 26.82 s | < 1 s | Non conforme |
| k6 upload p95 | 8.07 s | < 3 s | Non conforme |

Les résultats observés avec Chrome DevTools sont satisfaisants pour un MVP local. La campagne k6 confirme la stabilité fonctionnelle des parcours critiques, mais met en évidence deux points de performance non conformes sous charge : login et upload.

---

## 8. Limites du test

Les mesures présentées sont des mesures locales et ponctuelles. La campagne k6 donne une première indication sous charge, mais elle ne remplace pas un test de performance en environnement représentatif de production.

Limites connues :

- environnement local, non représentatif d’une production réelle ;
- faible volume de données ;
- fichiers de test légers ;
- charge k6 limitée à une itération par utilisateur virtuel ;
- absence de mesure CPU/mémoire serveur dans le rapport ;
- absence de test avec fichiers proches de la limite de 1 Go.

---

## 9. Évolutions prévues

Les prochaines campagnes de performance devront compléter ce premier run k6 avec :

- un relevé CPU/mémoire pendant l'exécution ;
- une analyse du coût du login sous concurrence ;
- des uploads de tailles différentes ;
- un test plus long avec plusieurs itérations par utilisateur virtuel ;
- une exécution dans un environnement plus proche de la production.
