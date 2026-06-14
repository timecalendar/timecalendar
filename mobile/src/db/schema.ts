import { sqliteTable, text } from "drizzle-orm/sqlite-core"

// The first real feature schema — Personal events (TIM-132 / ADR 011).
//
// Columns mirror the Flutter PersonalEvent.toMap() wire format verbatim so the
// Phase-09 one-shot importer can write recovered rows with no data loss and
// minimal transformation (importer fidelity is the load-bearing constraint):
//  - `uid` is the sembast record key (a UUID) and the identity/upsert key — the
//    explicit primary key, not a surrogate (the uid IS the identity in both the
//    Flutter store and the importer wire format).
//  - `color` holds the `#RRGGBB` hex string verbatim (ColorUtils.colorToHex,
//    alpha stripped) — TEXT-verbatim is the zero-transformation choice (D3).
//  - `startsAt` / `endsAt` / `exportedAt` hold UTC ISO-8601 strings (the exact
//    `DateTime.toUtc().toIso8601String()` shape). TEXT over epoch-ms for importer
//    fidelity AND because lexicographic order of canonical UTC ISO-8601 equals
//    chronological order, so the range query sorts/filters with a plain text
//    column (ADR 011 / D4). Canonicality is guaranteed by the row↔domain mappers.
//  - `kind` (EventKind.Personal) is a constant — not stored.
//
// This file imports drizzle-orm/sqlite-core (lint-banned outside src/db/**),
// which is why the schema lives in the @/db seam dir.
export const personalEvents = sqliteTable("personal_events", {
  uid: text("uid").primaryKey(),
  title: text("title").notNull(),
  color: text("color").notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  exportedAt: text("exported_at").notNull(),
  location: text("location"),
  description: text("description"),
})
