# server-calendar-log-retention Specification

## Purpose
TBD - created by archiving change notifications-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Daily calendar_log prune
A daily job SHALL delete `calendar_log` rows older than 1 year using batched deletes, capping in-app change history at 1 year.

#### Scenario: Old rows pruned
- **WHEN** the prune job runs and rows older than 1 year exist
- **THEN** those rows are deleted in bounded batches until none older than 1 year remain

#### Scenario: Recent rows untouched
- **WHEN** the prune job runs
- **THEN** rows 1 year old or newer are not deleted

