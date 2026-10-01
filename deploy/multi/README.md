# BB multi runtime

Base: upstream `get-bb/bb` desktop-v0.44.0, commit `0baa605b32a00619c1d7e3f32be6553ebcf8244a`.

Branch `multi/0.44.0-foundation` belongs to the existing Kapustin-Team/bb fork. It is separate from the current production fork branch and contains no copied user data, machine identities or plugin state.

The runtime workflow builds bb-app from this branch, packs the built package and installs it in a Linux image. Each deployment must pin the resulting image digest. BB remains a single-trust-boundary application: authentication and instance assignment are enforced by the separate private `Kapustin-Team/bb-multi` gateway. No direct public BB port is allowed.

Before every runtime update, preserve the previous image digest, all tenant home volumes, plugin sources/migration documentation and the bb-multi database. Never run an older BB binary against a database upgraded by a later version. No existing plugin ID, registration or schema is modified in this foundation change.

Future core patches go into this branch with focused tests and migration notes. The gateway must remain the access boundary even if the BB UI is customized.
