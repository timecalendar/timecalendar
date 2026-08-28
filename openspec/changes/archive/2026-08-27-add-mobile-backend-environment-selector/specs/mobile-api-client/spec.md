## MODIFIED Requirements

### Requirement: Base URL is configurable per environment

Every generated request SHALL resolve its base URL at call time through the typed backend-environment seam. Production SHALL map exactly to `https://api-v2.timecalendar.app`, preprod exactly to `https://preprod-api.timecalendar.app`, and local only to the valid absolute HTTP(S) `EXPO_PUBLIC_API_URL` compiled into a development build. The generated client and mutator contract SHALL expose no custom URL input; capability-aware persistence validation SHALL prevent a production runtime from resolving any other URL.

#### Scenario: Development local selection

- **WHEN** a development build with a valid developer-configured `EXPO_PUBLIC_API_URL` has local effective
- **THEN** every generated operation targets that compiled URL

#### Scenario: Preview preprod default

- **WHEN** a preview build has no valid persisted selection
- **THEN** every generated operation targets `https://preprod-api.timecalendar.app`

#### Scenario: Production is locked

- **WHEN** a production or fail-closed build resolves a request while storage contains any malformed or non-production selection
- **THEN** the operation targets `https://api-v2.timecalendar.app`

#### Scenario: A completed switch changes subsequent requests only

- **WHEN** the reset protocol commits an allowed target and reloads
- **THEN** requests after reload resolve the target environment at call time
- **AND** no request runs during the quiesced reset interval
