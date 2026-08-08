# mobile-fcm-subscription — delta

## MODIFIED Requirements

### Requirement: FCM token registered with the backend via the generated PUT client
The app SHALL register the device's FCM token with the server by calling the already-generated `PUT /notification-subscription` client (`useNotificationSubscriptionControllerCreateOrUpdateSubscription`) over the single `customFetch` mutator, assembling the `NotificationSubscriptionCreate` DTO from the local preference store (`frequency` / `nbDaysAhead` / `isActive`), the `fcmToken` from the `@/firebase` `getFcmToken` helper, `calendarIds` taken from the durable `user_calendars` rows' server ids, and the localization pair read through two accessors in the feature `data/` sublayer:

- `locale` — the app's **effective language** (`fr` | `en`): the explicit settings language preference when set, else device detection (the settings `resolveLanguage(getLanguagePreference())` path).
- `timezone` — the **effective display timezone** (IANA string): the explicit display-timezone preference when set, else the device zone from `expo-localization` (`getCalendars()[0].timeZone`), falling back to `"Europe/Paris"` when unavailable (the settings `resolveTimezone(getTimezonePreference())` path). The DTO assembly SHALL read the zone ONLY through this accessor, so the server renders notification times in the same zone the app displays.

The generated client SHALL be imported only in the feature's `data/` sublayer (never regenerated, never imported elsewhere). The PUT SHALL be idempotent — the full DTO is computed and sent fresh on each registration.

#### Scenario: Registration PUTs the assembled DTO
- **WHEN** a non-null FCM token is available and registration runs
- **THEN** the generated PUT mutation is invoked with a DTO carrying the local `frequency` / `nbDaysAhead` / `isActive`, the token as `fcmToken`, the held calendars' server ids as `calendarIds`, the effective language as `locale`, and the effective display timezone as `timezone`

#### Scenario: Locale follows the settings language override
- **WHEN** the user has set an explicit language preference (fr or en) and registration runs
- **THEN** the PUT carries that language as `locale`, not the raw device locale

#### Scenario: Timezone follows the settings display-timezone override
- **WHEN** the user has set an explicit display-timezone preference and registration runs
- **THEN** the PUT carries that zone as `timezone`, not the device zone

#### Scenario: Timezone falls back when the device yields none
- **WHEN** the display-timezone preference is `"system"` and the device timezone is unavailable from expo-localization
- **THEN** the PUT carries `timezone: "Europe/Paris"`

#### Scenario: Null token defers registration
- **WHEN** `getFcmToken` resolves to null (e.g. iOS APNS not yet ready)
- **THEN** no PUT is sent and registration waits for the token-refresh path

#### Scenario: Zero held calendars still PUTs an empty set
- **WHEN** the user holds no calendars and registration runs with a non-null token
- **THEN** the PUT is sent with `calendarIds: []` (so the server can prune), not skipped

### Requirement: Re-registration on preference change and on token refresh
The app SHALL re-PUT the subscription idempotently whenever a preference changes, whenever the FCM token refreshes, and whenever the effective locale or effective display timezone changes. A preference mutation SHALL write the local store first, then trigger a registration with the updated DTO. The token-refresh subscription (`@/firebase` `onFcmTokenRefresh`) SHALL trigger a registration with the new token. A language change (the i18n instance's `languageChanged` event — fired by both the settings override and a device-language change) SHALL trigger a registration carrying the new `locale`. An effective-timezone change — a display-timezone preference change, or a device timezone change while the preference is `"system"` — SHALL trigger a registration carrying the new `timezone`; the trigger SHALL be keyed on the resolved effective zone (not the raw device zone) and SHALL skip the initial mount value (the mount PUT already carried it). Trigger-driven PUT failures SHALL record and self-heal on the next change, refresh, or cold start (every cold start PUTs the full DTO as a backstop).

#### Scenario: Changing a preference re-PUTs
- **WHEN** the user changes `frequency`, `nbDaysAhead`, or `isActive`
- **THEN** the local store is updated and a PUT is sent carrying the new value

#### Scenario: Token refresh re-PUTs
- **WHEN** the FCM token refreshes via `onFcmTokenRefresh`
- **THEN** a PUT is sent carrying the new token

#### Scenario: Language change re-PUTs
- **WHEN** the i18n language changes (settings override or device change)
- **THEN** a PUT is sent carrying the new effective language as `locale`

#### Scenario: Display-timezone preference change re-PUTs
- **WHEN** the user changes the display-timezone preference
- **THEN** a PUT is sent carrying the new effective zone as `timezone`

#### Scenario: Device timezone change re-PUTs under system
- **WHEN** the display-timezone preference is `"system"` and the device timezone changes while the app is running
- **THEN** a PUT is sent carrying the new zone as `timezone`

#### Scenario: Device timezone change is inert under an explicit preference
- **WHEN** an explicit display-timezone preference is set and the device timezone changes
- **THEN** the effective zone is unchanged and no timezone-triggered PUT is sent
