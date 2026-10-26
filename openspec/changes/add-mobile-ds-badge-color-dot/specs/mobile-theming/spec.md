# Spec Delta

## ADDED Requirements

### Requirement: Text on the brand wash uses a dedicated label role checked over its surfaces

The theme layer SHALL define a label color role for text drawn on the translucent brand wash, with
light and dark values. A documented contrast pair SHALL be able to name the opaque surface a
translucent background sits on; the automated contrast test SHALL composite the translucent
background over that surface before computing the ratio, and SHALL fail on a translucent
background with no surface named. The brand-wash label SHALL meet the 4.5:1 body-text floor on the
brand wash over the page background, the grouped element background and the Home welcome surface,
in both schemes.

#### Scenario: The brand-wash label clears body contrast on a grouped surface

- **WHEN** the brand-wash label is drawn on the brand wash over the grouped element background
- **THEN** the composited contrast ratio is at least 4.5:1 in light and in dark

#### Scenario: A translucent pair without a surface is rejected

- **WHEN** a documented pair names a translucent background and no surface
- **THEN** the contrast computation throws and the theme test fails
