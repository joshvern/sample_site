# Sample data and provenance

The demo seed is deliberately deterministic. It contains 24 canonical movies
and series, 39 source identities across eight source systems, three ambiguous
review cases, one unresolved record, and 90 days of formula-generated source
metrics.

The catalog is designed to exercise real resolution failure modes:

- same-title regional adaptations: _The Office_ (US and UK)
- same-title remakes: _Dune_ (1984 and 2021)
- film and television collisions: _Fargo_
- punctuation and article inversion: _Office, The_ and _Bear, The_
- Unicode normalization: _Shōgun_ and `SHŌGUN`
- localized titles: _Parasite_ / _기생충_ and _Moana_ / _Vaiana_
- abbreviated aliases: _Everything Everywhere All at Once_ / _EEAAO_
- year-qualified editions and missing-year ambiguity
- exact external-identifier matches that take priority over fuzzy title matches

Canonical records include stable IMDb `tconst` and TMDB identifiers with links
to the corresponding authority pages. Descriptions, platform metrics, source
availability, ingestion activity, and match decisions are illustrative fixture
data rather than claims about current distribution or audience performance.

IMDb publishes selected datasets for personal and non-commercial use and
requires consumers to verify licensing compliance. The application does not
redistribute those datasets or call IMDb at runtime. See
[IMDb non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/).

TMDB offers an authenticated API subject to its terms of use. The application
stores only illustrative identifiers and authority links and does not require a
TMDB API key. See
[TMDB API getting started](https://developer.themoviedb.org/docs/getting-started).

To replace these fixtures in a production implementation, ingest licensed
metadata through a dedicated source system, preserve provider-native IDs in
`source_entity.external_identifiers`, and map them into
`catalog.external_identifier` through the same resolution workflow.
