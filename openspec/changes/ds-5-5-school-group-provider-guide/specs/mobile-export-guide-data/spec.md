## ADDED Requirements

### Requirement: The compiled image-origin allow-list names every first-party public bucket
The client's compiled set of accepted export-guide image origins SHALL contain exactly the HTTPS
origins of the development, preprod and production first-party public buckets, so a catalogue
served by any of the three backends is not rejected for its image origin. Any other origin,
including a subdomain or a different scheme of an allowed bucket, SHALL still be rejected.

#### Scenario: Each environment's bucket is accepted
- **WHEN** a catalogue's image declarations use the development, the preprod, or the production
  public-bucket origin
- **THEN** the parser accepts them

#### Scenario: A look-alike origin is rejected
- **WHEN** an image declaration uses `http://` on an allowed bucket host, or a host that only ends
  with an allowed bucket host
- **THEN** that provider is classified invalid

#### Scenario: The set is pinned
- **WHEN** the data-layer tests run
- **THEN** they fail if the compiled origin set gains or loses an entry
