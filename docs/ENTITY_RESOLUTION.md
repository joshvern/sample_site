# Entity Resolution

## Normalization

`title-normalizer-v1`:

1. applies Unicode NFKC;
2. trims and collapses whitespace;
3. extracts a trailing `(YYYY)` year;
4. extracts US/U.S. and UK/U.K. qualifiers into `US` or `GB`;
5. converts `Office, The` to `The Office`;
6. lowercases and normalizes punctuation.

The result retains the original title, extracted year/region, normalized title,
and version. Normalized titles are not unique and never prove identity.

## Candidate generation

Candidates are generated in this order:

1. exact external identifier;
2. normalized title, year, and type;
3. exact normalized title with compatible metadata;
4. PostgreSQL trigram similarity.

At most five candidates scoring at least `0.50` are stored for one generation
version. The default review queue recommends `0.70+`.

## Scoring

| Feature                | Weight |
| ---------------------- | -----: |
| Title similarity       |   0.65 |
| Year compatibility     |   0.15 |
| Type compatibility     |   0.10 |
| Country compatibility  |   0.05 |
| Language compatibility |   0.05 |

Contradictory year, type, and country subtract `0.25`, `0.30`, and `0.20`.
External-ID matches receive deterministic `1.0` priority.

Automatic acceptance requires:

- score `>= 0.95`;
- no year, type, or country contradiction;
- a lead of at least `0.05` over the next candidate;
- no missing-year ambiguity among same-title canonical entities.

Thus a title-only `The Office` record cannot automatically choose between the
2001 GB and 2005 US editions.

## Decisions and history

Candidate rows retain their model, method, score, normalization version, and
interpretable feature JSON. Accepting, rejecting, directly mapping, unmapping,
or creating content validates the current workspace.

An accepted reassignment locks the source record, closes the old mapping with
`valid_to`, inserts the new mapping, updates candidate state, and rebuilds the
old and new canonical aggregates transactionally. No mapping is repointed or
deleted.

Future generators—metadata enrichment, embeddings, or learned alias signals—can
write candidates under new model versions without changing mapping history.
