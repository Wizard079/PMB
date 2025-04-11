/*
  Warnings:

  - You are about to drop the column `balls` on the `Matches` table. All the data in the column will be lost.
  - You are about to drop the column `runs` on the `Matches` table. All the data in the column will be lost.
  - You are about to drop the column `wickets` on the `Matches` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "runs1" INTEGER NOT NULL DEFAULT 0,
    "balls1" INTEGER NOT NULL DEFAULT 0,
    "wickets1" INTEGER NOT NULL DEFAULT 0,
    "runs2" INTEGER NOT NULL DEFAULT 0,
    "balls2" INTEGER NOT NULL DEFAULT 0,
    "wickets2" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED'
);
INSERT INTO "new_Matches" ("id", "status", "team1", "team2") SELECT "id", "status", "team1", "team2" FROM "Matches";
DROP TABLE "Matches";
ALTER TABLE "new_Matches" RENAME TO "Matches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
