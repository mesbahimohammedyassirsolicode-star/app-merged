-- SQL checks: ensure groupes exist and are linked to filières
-- Run in MySQL: mysql -u user -p database < database/sql_check_groupes.sql

SELECT 'groupes' AS tbl, COUNT(*) AS n FROM groupes WHERE deleted_at IS NULL;
SELECT 'filieres' AS tbl, COUNT(*) AS n FROM filieres WHERE deleted_at IS NULL;
SELECT 'annees_scolaires' AS tbl, COUNT(*) AS n FROM annees_scolaires;
SELECT 'groupe_stagiaire' AS tbl, COUNT(*) AS n FROM groupe_stagiaire;

SELECT g.id, g.label, g.filiere_id, g.annee_scolaire_id, f.label AS filiere_label
FROM groupes g
LEFT JOIN filieres f ON f.id = g.filiere_id AND f.deleted_at IS NULL
WHERE g.deleted_at IS NULL
ORDER BY g.label
LIMIT 20;
