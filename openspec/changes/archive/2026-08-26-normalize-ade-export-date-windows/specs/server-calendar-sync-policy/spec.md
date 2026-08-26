## ADDED Requirements

### Requirement: Fetch URL normalization does not bypass sync cadence

Changing an upstream URL's ADE date parameters at fetch time SHALL NOT make a calendar due,
alter its resolved minimum sync interval, or cause an additional upstream request. The
calendar SHALL continue to be fetched only when selected by the existing stored
`syncPlannedAt` policy.

#### Scenario: Lyon 1 remains capped within the hour

- **WHEN** a Lyon 1 ADE URL with an explicit date pair is created and clients request sync
  repeatedly during the following 60 minutes
- **THEN** the date pair is normalized for the creation fetch and Lyon 1 receives exactly one
  upstream request during that hour

#### Scenario: Lyon 1 recomputes the window only when due

- **WHEN** that Lyon 1 calendar becomes due after its 60-minute interval
- **THEN** the next upstream request uses a date pair recomputed for that fetch and no
  intermediate request was made

#### Scenario: Other schools retain their configured cadence

- **WHEN** a normalized ADE calendar resolves to a strategy using the 30-minute default or
  another declared interval
- **THEN** its next-fetch planning continues to use that unchanged interval
