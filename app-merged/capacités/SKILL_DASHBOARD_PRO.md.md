--- File: SKILL_DASHBOARD_PRO.md ---
---
name: expert-ui-dashboard-react
description: Expert en conception de Dashboards Enterprise (React, TypeScript, Tailwind CSS, Data-Viz)
---

# Skill : Expert UI Dashboard React (Enterprise Grade)

## 🎯 Périmètre Global
**Mission** : Transformer des données brutes et des besoins administratifs en interfaces de pilotage "Pro". L'objectif est de passer d'un "admin template" basique à une expérience SaaS haut de gamme, centrée sur la hiérarchie de l'information, la clarté visuelle et la performance.

### 🚫 Interdictions Globales (The "Anti-Amateur" Rules)
1. **Pas de fonds blancs purs** : Ne jamais utiliser `#FFFFFF` pour le background global. Utiliser des gris très clairs/bleutés (ex: `slate-50` ou `zinc-50`) pour créer un contraste avec les cartes blanches.
2. **Pas de "Nombres Nus"** : Interdiction d'afficher une statistique sans contexte. Chaque KPI doit avoir un label clair et, si possible, un indicateur de tendance (ex: $\uparrow 12\%$).
3. **Pas de bordures lourdes** : Éviter les bordures noires ou grises foncées. Utiliser des bordures subtiles (`border-slate-200`) ou des ombres très légères (`shadow-sm`).
4. **Pas de chargements bloquants** : Interdiction d'utiliser un simple "Loading..." texte. Utiliser systématiquement des **Skeletons** pour simuler la structure du contenu.
5. **Pas de couleurs aléatoires** : Utiliser uniquement une palette sémantique stricte (Success: Green, Danger: Red, Warning: Amber, Info: Blue).

---

## ⚡ Actions (Orchestration)

### Action 0 : Analyse de l'Information Architecture
> **Description** : Analyse les données disponibles pour définir la hiérarchie visuelle.

- **Détection** : Identifie les KPIs primaires (haut de page), les tendances (graphiques) et les listes de détails (tables).
- **Décision** : Définit la disposition du "Bento Grid" (grille adaptative) selon l'importance des données.

### Action A : Architecture du "Shell" (Layout)
> **Description** : Crée la structure globale : Sidebar rétractable, Topbar et zone de contenu principale.

- **Capacité** : `capacité-dashboard-layout.md`
- **Sorties** : Un layout responsive avec navigation active stylisée et gestion du mode sombre.

### Action B : Conception des KPI Cards (Metrics)
> **Description** : Génère des cartes de statistiques professionnelles.

- **Capacité** : `capacité-kpi-metrics.md`
- **Détails** : Intégration d'icônes Lucide-React, typographie contrastée (Label gris / Valeur noire bold) et indicateurs de tendance.
- **Sorties** : Composants `<StatCard />` réutilisables et typés.

### Action C : Implémentation Data-Viz (Charts)
> **Description** : Transforme les données en graphiques interactifs et épurés.

- **Capacité** : `capacité-data-viz.md`
- **Entrées** : Jeux de données JSON.
- **Sorties** : Graphiques (Recharts/Tremor) avec tooltips customisés, sans "chart junk" (suppression des lignes de grille inutiles).

### Action D : Création de Tables de Données Avancées
> **Description** : Développe des tableaux gérant de gros volumes de données.

- **Capacité** : `capacité-data-tables.md`
- **Fonctionnalités** : Pagination, tri, filtres dynamiques et états de survol (hover) des lignes.
- **Sorties** : Composants de table avec TanStack Table (ou équivalent).

### Action E : Intégration d'État et Data Fetching
> **Description** : Connecte l'UI au backend avec une gestion d'état robuste.

- **Capacité** : `capacité-state-management.md`
- **Outils** : TanStack Query (React Query) pour le caching et la synchronisation.
- **Sorties** : Hooks de récupération de données avec gestion des états `isLoading` $\rightarrow$ `Skeleton`.

### Action F : Polissage "Pro" (Micro-interactions)
> **Description** : Ajoute la couche finale de qualité (UX).

- **Capacité** : `capacité-ui-polish.md`
- **Actions** : Transitions Framer Motion, Tooltips d'aide, Toasts de confirmation et accessibilité (ARIA).

---

## 🛠️ Capacités (à créer dans `capacités/`)

| Capacité | Rôle |
| :--- | :--- |
| `capacité-dashboard-layout.md` | Créer un shell responsive avec sidebar et topbar (SaaS style). |
| `capacité-kpi-metrics.md` | Concevoir des cartes de stats avec tendances et icônes sémantiques. |
| `capacité-data-viz.md` | Implémenter des graphiques épurés (Line, Bar, Donut) avec Recharts/Tremor. |
| `capacité-data-tables.md` | Générer des tables complexes (Tri, Filtre, Pagination, Virtualisation). |
| `capacité-state-management.md` | Gérer le fetch de données et les états de chargement avec React Query. |
| `capacité-ui-polish.md` | Appliquer les micro-animations, skeletons et optimisations UX. |

--- End of SKILL_DASHBOARD_PRO.md ---
