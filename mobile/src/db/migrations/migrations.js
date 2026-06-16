// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_handy_nuke.sql"
import m0001 from "./0001_loving_bug.sql"
import m0002 from "./0002_first_mauler.sql"
import m0003 from "./0003_soft_iron_fist.sql"
import journal from "./meta/_journal.json"

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
  },
}
