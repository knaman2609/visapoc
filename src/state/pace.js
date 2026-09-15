/**
 * One cadence for every step-by-step reveal in the app.
 *
 * These loaders drifted badly apart — the agent rail revealed a step every
 * 432ms while the profile drawer took 2,880ms for the same kind of list, which
 * read as a hang rather than as thinking. Anything that reveals reasoning a
 * line at a time paces off this, so they cannot drift again.
 */
export const REVEAL_MS = 460

/** A scan that sweeps a whole book can afford to be a touch slower. */
export const SCAN_MS = 460
