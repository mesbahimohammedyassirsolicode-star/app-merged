# MySQL 8.0 Migration Runbook

## Preparation

- Copy the SQLite database: `copy backend\database\database.sqlite backend\database\database.sqlite.bak`
- Create the MySQL database with `utf8mb4` and `InnoDB`.
- Update `.env` to use `DB_CONNECTION=mysql`.

## Audit

- `php artisan db:audit-sqlite-mysql`
- Review duplicate attendance fingerprints, mixed role values, orphan counts, and date-format drift before importing.

## Rehearsal Transfer

- Dry run: `php artisan db:transfer-sqlite-mysql --dry-run`
- Fresh schema on MySQL: `php artisan migrate:fresh --database=mysql`
- Real transfer: `php artisan db:transfer-sqlite-mysql --chunk=500`
- Verify: `php artisan db:verify-mysql-migration`

## Safety Notes

- Attendance rows are normalized to calendar dates and `retard` is converted to `late`.
- `teacher` and `student` roles are normalized to `formateur` and `stagiaire`.
- Legacy assignment pivots remain compatibility sources, but `module_trainer` and `formateur_module_group` are the canonical long-term contract.

## Rollback

- Keep the original SQLite file unchanged.
- If a MySQL import is invalid, drop and recreate the MySQL schema, then rerun the rehearsal after fixing the audit findings.
