# Maintenance

## Politique de mise à jour des dépendances

Les dépendances du projet sont mises à jour selon leur niveau de risque et leur criticité.

Les mises à jour de sécurité de sévérité `critical` ou `high` sont traitées en priorité et doivent être corrigées dès que possible. Les mises à jour mineures ou correctives sont regroupées périodiquement afin de limiter les changements non maîtrisés. Les mises à jour majeures sont planifiées séparément, car elles peuvent introduire des breaking changes.

La fréquence indicative est la suivante :

| Type de dépendance | Fréquence |
|---|---|
| Vulnérabilités critiques ou élevées | Dès détection |
| Mises à jour patch | Mensuelle |
| Mises à jour minor | Mensuelle ou par sprint |
| Mises à jour major | Planifiée au cas par cas |
| Frameworks structurants | Après analyse d’impact |


Les dépendances critiques du projet sont notamment : NestJS, React, Vite, Prisma, PostgreSQL client, JWT, bcrypt/argon2, Cypress, Vitest, ESLint et Prettier.

Avant toute mise à jour, une branche dédiée est créée. Après mise à jour, les commandes de testing, couverture et qualité doivent être executés.

## Fréquence

| Action | Fréquence proposée |
|---|---|
| Vérification `npm audit` | Avant livraison et après installation de nouvelles dépendances |
| Mise à jour patch/minor | Mensuelle si les tests passent |
| Mise à jour major | Planifiée au cas par cas |
| Correction vulnérabilité high/critical | Dès détection |
