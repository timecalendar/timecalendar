import { SharedDatabaseModule } from "@lyrolab/nest-shared/database"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { FcmNotificationChannel } from "modules/notification-subscription/models/entities/fcm-notification-channel.entity"
import { FeatureFlag } from "modules/feature-flag/models/entities/feature-flag.entity"
import { NotificationSubscription } from "modules/notification-subscription/models/entities/notification-subscription.entity"
import { School } from "modules/school/models/school.entity"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"

// Explicit entity list for the worker test database. nest-shared's
// `forTest`/`setupTestDatabase` take entity classes (not a glob) and build each
// worker's schema from them via `synchronize`. This list MUST mirror every
// `*.entity.ts` (the runtime `dataSourceOptions.entities` glob) — a missing
// entry surfaces immediately as a "relation does not exist" failure for that
// table's specs.
export const testEntities = [
  Calendar,
  CalendarContent,
  CalendarFailure,
  CalendarLog,
  CalendarSubject,
  FcmNotificationChannel,
  FeatureFlag,
  NotificationSubscription,
  School,
  SchoolGroup,
  SchoolProfile,
]

// Evaluating `forTest` registers `testEntities` on the module's static state, so
// importing this constant (in setup-tests.ts) primes `setupTestDatabase()` to
// build the schema before any test compiles a module. The same DynamicModule is
// reused as the database import for every test module.
export const sharedDatabaseTestModule = SharedDatabaseModule.forTest({
  entities: testEntities,
})
