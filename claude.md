Do not write comments. Write file and function names that make it clear what the code does and why.

Each file has one responsibility. As soon as a file handles two things, split it.

If a function exceeds ten lines, look for the seam and split it, cutting along "why are we doing this?" rather than "what happens next".

Every number that comes from physics lives in src/units/constants.ts or in the module that owns that physics, never inline at a call site.

The simulation is deterministic. Randomness comes only from src/random/mulberry32.ts seeded from the world seed. No Math.random, no Date.now, no dependence on iteration order over a Map or object.

Per-cell and per-body state is stored as typed arrays indexed by id, never as an array of objects.

Physical models here are reduced parameterizations, not first-principles solvers. Where a model is a stand-in for something much more expensive, the module name says so and a check pins the behaviour that justifies it.

A check earns its place by failing on a mistake someone could plausibly make. If a check exists only to state something true, delete it.
