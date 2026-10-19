# Existing Neon database recovery — NO RESET

Your Neon database already has migration `20261019012333_init`, while the local archive does not. **Do not run `prisma migrate reset`.**

1. Create a Neon branch or backup first. Keep production credentials private.
2. Use Prisma 6.19.x, as pinned by your install lockfile if present.
3. On a safe development branch, preview the difference between the database and the schema:

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > /tmp/trading-journal-sync.sql
```

4. Review the SQL. If it contains destructive changes, STOP. If it only adds expected tables/columns, apply on the development branch:

```bash
npx prisma db execute --file /tmp/trading-journal-sync.sql --schema prisma/schema.prisma
npx prisma generate
```

5. Test `/admin` and user login. Applying SQL **does not repair migration history**. To restore migration history properly, retrieve the original `20261019012333_init/migration.sql` from the original repository or backup and preserve its checksum/content. Then create and apply versioned follow-up migrations for the new fields, reconciling any schema changes made manually. Do not invent a replacement initial migration with the same name or mark an unrelated migration as applied.
6. Avoid `prisma migrate dev` against this shared database until the missing migration has been recovered and history reconciled. Use a fresh Neon branch for subsequent migration testing.

Note: `P2022 User.phone` occurs because your Prisma schema contains `User.phone` but the database has not been updated. The same schema drift may include Phase 4 `LedgerSettings` and `LedgerDay` tables.
