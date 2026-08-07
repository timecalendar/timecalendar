# server-notification-localization Specification

## Purpose
TBD - created by archiving change notifications-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Locale and timezone on subscriptions
`NotificationSubscription` SHALL gain `locale` (`fr | en`, default `fr`) and `timezone` (IANA string, default `Europe/Paris`), persisted via migration, accepted in the subscription PUT DTO, and exposed in the regenerated OpenAPI spec.

#### Scenario: PUT with locale and timezone
- **WHEN** a client PUTs a subscription with `locale: "en"` and `timezone: "America/Martinique"`
- **THEN** both values are validated and stored on the subscription

#### Scenario: PUT without new fields
- **WHEN** a client PUTs a subscription omitting `locale` and `timezone`
- **THEN** the subscription defaults to `fr` and `Europe/Paris`

#### Scenario: Invalid values rejected
- **WHEN** a client PUTs `locale: "de"` or a non-IANA `timezone`
- **THEN** the request is rejected with a validation error

### Requirement: Notification strings dictionary
Notification titles and bodies SHALL come from a plain server-side dictionary keyed by locale (`fr`, `en`) — no i18n framework. Every key SHALL exist in both locales, including per-type detail titles (e.g., "Cours annulé" for `cancel`) and the digest text with its count.

#### Scenario: English subscriber
- **WHEN** a push is built for a subscription with `locale: "en"`
- **THEN** the title and body use the English dictionary entries

### Requirement: Timezone-correct time rendering
Times in push bodies SHALL be rendered with `date-fns-tz` `formatInTimeZone(date, subscription.timezone, …)`. The notification path MUST NOT format times in server-local time.

#### Scenario: Overseas subscriber
- **WHEN** a detail push is built for a subscription with `timezone: "America/Martinique"` about an event at 08:00 Martinique time
- **THEN** the body shows 08:00, not the Europe/Paris or server-local rendering

