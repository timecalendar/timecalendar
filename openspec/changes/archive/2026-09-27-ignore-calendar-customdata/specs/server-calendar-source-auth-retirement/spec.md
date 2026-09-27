## ADDED Requirements

### Requirement: Calendar creation accepts and discards legacy custom data

`POST /calendars` SHALL continue to accept `customData: null` and a valid nested `customData.auth` object in its existing request shape. The server SHALL discard either value before persistence or upstream fetching. The committed create request and response contract SHALL remain unchanged.

#### Scenario: Current client sends null

- **WHEN** a valid calendar-create request contains `customData: null`
- **THEN** creation succeeds and the saved calendar has a null `customData` column

#### Scenario: Older client sends Basic credentials

- **WHEN** a valid calendar-create request contains `customData: { auth: { username, password } }`
- **THEN** creation succeeds, the saved calendar has a null `customData` column, and no credentials reach the upstream fetcher

### Requirement: Calendar fetching does not use source credentials

Calendar fetching SHALL use the effective transformed URL and the current fetch context without a source credential argument. It SHALL NOT derive an outbound Basic Authorization header from `customData`, including when resyncing a row whose retained column contains a non-null historical value.

#### Scenario: New calendar fetch

- **WHEN** a calendar is created with a valid `customData.auth` value
- **THEN** its upstream request uses the effective URL without a Basic Authorization header derived from that value

#### Scenario: Historical row resync

- **WHEN** an eligible stored calendar has a non-null `customData` column
- **THEN** sync fetches its effective URL without passing that column value to the fetch layer

### Requirement: Upstream authentication challenge is an ordinary fetch failure

An upstream HTTP 401 SHALL be reported through the ordinary fetch failure path. The server SHALL NOT return the calendar-source Basic-auth markers previously used to request or reject credentials. Existing retry and abort budgets SHALL remain bounded.

#### Scenario: Challenged iCal source

- **WHEN** an upstream iCal request returns HTTP 401 with a Basic challenge
- **THEN** the fetch fails with the ordinary upstream request error, without an `auth: basic` or `basicAuth: failed` marker
