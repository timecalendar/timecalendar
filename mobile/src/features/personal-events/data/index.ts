export { usePersonalEvents } from "./hooks"
export { findAll, getById, remove, upsert } from "./repository"
export { eventToRow, type PersonalEvent, rowToEvent } from "./types"
// The uid generator lives on the @/db seam (newId); re-exported here so form/ and
// ui/ reach it through this data/ barrel (only data/ may import @/db — B-1).
export { newId } from "@/db"
