import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

type CourseArgs = {
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
};

type ChallengeArgs = {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  xpReward: number;
  order: number;
  type: "theory";
  theoryContent: string;
  hints: string[];
};

type GeneratedBundle = {
  course: CourseArgs;
  challenges: ChallengeArgs[];
};

const OUTPUT_PATH = path.join(process.cwd(), "scripts", "cs_courses.json");

function usage() {
  console.log(`Usage:
  bun scripts/gen-cs.ts            # generate ${path.relative(process.cwd(), OUTPUT_PATH)}
  bun scripts/gen-cs.ts --seed     # also seed Convex (requires NEXT_PUBLIC_CONVEX_URL)
`);
}

function generateBundles(): GeneratedBundle[] {
  const systemDesign: GeneratedBundle = {
    course: {
      title: "System Design",
      slug: "system-design",
      description: "[Client] -> [API] -> [Cache] -> [DB] (+ async [Queue] for side effects).",
      icon: "Server",
      order: 20,
    },
    challenges: [
      {
        slug: "system-design-requirements-and-apis",
        title: "Requirements → APIs (URL Shortener)",
        description:
          "Sketch the high-level architecture: [Clients] -> [Edge] -> [API] -> [DB], plus [Cache] + [Queue].",
        category: "System Design",
        difficulty: 1,
        xpReward: 120,
        order: 1,
        type: "theory",
        theoryContent: `# Requirements → APIs (URL Shortener)

## Architecture (ASCII)

\`\`\`
        +-----------+         +------------------+
        |  Clients  |  HTTPS  |  Edge / CDN / LB |
        +-----+-----+-------->+--------+---------+
              |                        |
              |                        v
              |                 +------+------+
              |                 |  API Layer  |
              |                 +---+-----+---+
              |                     |     |
              |          cache hit? |     | async events
              |                     v     v
              |                 +---+--+  +-----------+
              |                 |Cache|  | Queue/Bus  |
              |                 +---+-+  +-----+-----+
              |                     |         |
              |                     v         v
              |                 +---+---------+---+
              +---------------->|    Primary DB     |
                                +-------------------+
\`\`\`

## Your task

Design a URL shortener that supports:
- Create short link: \`POST /links\`
- Resolve short link: \`GET /{code}\`
- Click tracking (analytics) without slowing redirects
- Abuse controls (rate limit + basic bot mitigation)

## Deliverables

1) **Requirements**: list functional + non-functional requirements (latency, availability, cost, data retention).
2) **API contract**: request/response shapes and error codes for create + resolve.
3) **Capacity plan**: rough QPS assumptions and what breaks first.
4) **Component responsibilities**: what belongs in API vs cache vs DB vs queue vs analytics.

## Pitfalls to address

- Cache stampede on hot links (how do you prevent thundering herds?)
- Redirect latency budget (P50/P95 target)
- Idempotency for link creation (duplicate requests)
- Consistency tradeoffs for click counts (exact vs approximate)
`,
        hints: [
          "Start from the redirect path; optimize the hot path first.",
          "Make click tracking async (queue + consumer) to keep redirects fast.",
          "Define what must be strongly consistent (if anything) vs eventually consistent.",
        ],
      },
      {
        slug: "system-design-schema-url-shortener",
        title: "Design the Database Schema (Links + Clicks)",
        description:
          "Design a schema: [links] -> [click_events] -> [rollups]. Think indexes + retention.",
        category: "System Design",
        difficulty: 2,
        xpReward: 170,
        order: 2,
        type: "theory",
        theoryContent: `# Design the Database Schema (Links + Clicks)

## Architecture (ASCII)

\`\`\`
            writes                 reads
    +----------------+      +----------------+
    |  API: create   |----->|     links      |
    +----------------+      +----------------+
             |
             | async click events
             v
    +----------------+      +----------------+      +----------------+
    |  redirect API   |----->|  click_events  |----->| click_rollups  |
    +----------------+      +----------------+      +----------------+
\`\`\`

## Your task

Design a schema that supports:
- Link creation (user-owned or anonymous)
- Fast lookup by \`code\`
- Click tracking (high write volume)
- Analytics queries (per link, per day)
- Data retention (e.g. keep raw clicks for 30 days, rollups for 1 year)

## Deliverables

Propose **tables/collections**, **primary keys**, and **indexes**. Explain:
- How you guarantee \`code\` uniqueness
- How you handle mutable metadata (title, tags, destination URL changes)
- How you model click events vs rollups (write amplification vs query cost)

## Constraints (pick and justify)

- Storage: optimize for cost; raw events are large.
- Analytics freshness: rollups can lag by up to 1 minute.
- Delete: users can delete a link; decide what happens to click data.

## Bonus: schema evolution

Explain how you’d add “custom domains” later without breaking existing links.
`,
        hints: [
          "Make \`links(code)\` a unique index; redirects must be O(1).",
          "Store raw click events append-only; build rollups asynchronously.",
          "Think about TTL/partitioning for click events (time-based).",
        ],
      },
      {
        slug: "system-design-caching-and-consistency",
        title: "Caching, Consistency, and Cache Stampedes",
        description: "Avoid stampedes: [Clients] -> [Cache] -> [DB]; coordinate misses safely.",
        category: "System Design",
        difficulty: 3,
        xpReward: 220,
        order: 3,
        type: "theory",
        theoryContent: `# Caching, Consistency, and Cache Stampedes

## Architecture (ASCII)

\`\`\`
                   +------------------+
  request          |  cache (hot set) |
 +------+          +---------+--------+
 |Client|--------------------| hit
 +--+---+                    v
    |                 +-------+------+
    | miss            |  API / app   |
    v                 +-------+------+
 +--+---+                     |
 |Cache|<---------------------+ single-flight?
 +--+---+                     |
    |                         v
    +-------------------->+---+---+
                           |  DB  |
                           +-------+
\`\`\`

## Your task

You have a hot link that suddenly becomes viral. Cache entries expire every 60 seconds.
At expiry, 10k clients request the same \`code\` at once.

1) Describe the **failure mode** (what happens to API + DB).
2) Propose **two different mitigations**, and discuss tradeoffs:
   - single-flight / request coalescing
   - probabilistic early refresh / jittered TTLs
   - stale-while-revalidate
   - negative caching for “not found”
3) Explain what consistency you need for redirects when a destination URL changes.

## Deliverables

- A short write-up of your chosen strategy.
- An updated diagram showing where coordination happens.
`,
        hints: [
          "Jitter TTLs so not everything expires at the same instant.",
          "Single-flight prevents N concurrent cache misses for the same key.",
          "Stale-while-revalidate can cap DB load while keeping latency low.",
        ],
      },
      {
        slug: "system-design-rate-limiting-and-abuse-controls",
        title: "Rate Limiting + Abuse Controls",
        description: "Protect create/resolve: [Edge] -> [RateLimiter] -> [API]. Use token buckets.",
        category: "System Design",
        difficulty: 3,
        xpReward: 220,
        order: 4,
        type: "theory",
        theoryContent: `# Rate Limiting + Abuse Controls

## Architecture (ASCII)

\`\`\`
 +--------+    +-----------+    +-------------------+    +-----+
 | Client | -> | Edge/LB   | -> | Rate Limit Store  | -> | API |
 +--------+    +-----------+    +-------------------+    +--+--+
                                                         |
                                                         v
                                                       +--+--+
                                                       | DB  |
                                                       +-----+
\`\`\`

## Your task

You see two abuse patterns:
- Link creation spam (millions of create requests)
- Redirect probing (bots scanning codes)

Design protections for:
1) \`POST /links\` (creation)
2) \`GET /{code}\` (redirect)

## Deliverables

- Pick a rate limiting algorithm (token bucket/leaky bucket/fixed window) for each path.
- Define keying strategy (per IP, per user, per API key, per /24, per user+IP).
- Explain what storage you use (in-memory, Redis, edge KV) and its failure modes.
- Add one mitigation beyond rate limiting (CAPTCHA gate, email verification, proof-of-work, reputation scoring).

## Bonus

How do you avoid a “distributed race” where multiple edge nodes allow the same request because state is slightly stale?
`,
        hints: [
          "Creation paths need stronger identity and heavier throttling than redirects.",
          "Favor token buckets for smooth limiting; add burst capacity.",
          "For multi-node correctness, prefer centralized counters or bounded staleness with conservative limits.",
        ],
      },
      {
        slug: "system-design-outbox-and-analytics-schema",
        title: "Outbox Pattern: Schema + Race-Free Event Emission",
        description: "Eliminate dual-write races: [DB txn] -> [outbox] -> [publisher] -> [bus].",
        category: "System Design",
        difficulty: 4,
        xpReward: 280,
        order: 5,
        type: "theory",
        theoryContent: `# Outbox Pattern: Schema + Race-Free Event Emission

## Architecture (ASCII)

\`\`\`
        +------------+          +-----------------+
        |  API (txn) |          |  Outbox Poller  |
        +-----+------+          +--------+--------+
              |                          |
              | 1) write link + outbox   | 2) publish + mark sent
              v                          v
        +-----+--------------------------+------+
        |              Primary DB               |
        |  links   |   outbox_events   |  ...   |
        +----------+-------------------+--------+
                              |
                              v
                         +----+----+
                         |  Bus    |
                         +----+----+
                              |
                              v
                        +-----+------+
                        | Consumers  |
                        +------------+
\`\`\`

## The problem

If your API writes \`links\` to the DB and separately publishes an event to a message bus, you can get a **dual-write race**:
- DB write succeeds, publish fails → missing events
- Publish succeeds, DB write fails → phantom events

## Your task (schema design + race avoidance)

1) Design an \`outbox_events\` table/collection schema that supports:
   - ordering per aggregate (e.g. per link)
   - deduplication / idempotency
   - retry tracking (attempt count, next attempt)
   - payload versioning
2) Describe the publisher algorithm that is safe under concurrency:
   - how it claims work
   - how it prevents two workers publishing the same event
3) Explain how consumers handle duplicates (at-least-once delivery).

## Deliverables

- Table schema + indexes.
- Pseudocode for publisher loop with concurrency control.
- One concrete example of a race and how your design prevents it.
`,
        hints: [
          "Use a DB transaction: write business row + outbox row atomically.",
          "Workers can claim rows via conditional update (status=NEW → CLAIMED) or DB locks.",
          "At-least-once means duplicates happen; consumers must be idempotent.",
        ],
      },
      {
        slug: "system-design-multi-region-failover",
        title: "Multi-Region Failover (Read vs Write Paths)",
        description:
          "Design failover: [Region A] <-> [Region B]; decide write authority + read replicas.",
        category: "System Design",
        difficulty: 4,
        xpReward: 280,
        order: 6,
        type: "theory",
        theoryContent: `# Multi-Region Failover (Read vs Write Paths)

## Architecture (ASCII)

\`\`\`
           +------------------ Global DNS ------------------+
           |                                                |
           v                                                v
     +-----------+                                    +-----------+
     | Region A  |                                    | Region B  |
     |  API/LB   |                                    |  API/LB   |
     +-----+-----+                                    +-----+-----+
           |                                                |
           v                                                v
     +-----+-----+    async replication / log shipping +-----+-----+
     |  DB (RW)  |<---------------------------------->|  DB (RO)  |
     +-----------+                                    +-----------+
\`\`\`

## Your task

You want redirects to be low-latency globally, but link creation must remain correct.

1) Choose a topology:
   - single-writer + read replicas
   - multi-writer (conflict resolution)
2) Define what happens during region outage:
   - can users still create links?
   - can redirects still resolve?
3) Decide how to invalidate caches across regions on destination changes.

## Deliverables

- A short description of your topology and operational playbook.
- The consistency model users will observe (e.g. “destination updates can take up to N seconds globally”).
- One failure drill: “Region A down” timeline with expected behavior.
`,
        hints: [
          "For correctness, keep a single write authority unless you truly need multi-writer.",
          "Redirects can often tolerate eventual consistency; creations usually can’t.",
          "Cache invalidation across regions is hard; consider short TTL + versioning.",
        ],
      },
    ],
  };

  const distributedSystems: GeneratedBundle = {
    course: {
      title: "Distributed Systems",
      slug: "distributed-systems",
      description:
        "[Clients] -> [Service] -> [Replicas]; correctness lives in clocks, logs, and idempotency.",
      icon: "Network",
      order: 21,
    },
    challenges: [
      {
        slug: "distributed-systems-replication-and-consistency",
        title: "Replication + Consistency (Leader/Follower)",
        description:
          "Explain replication: [Leader] -> [Followers]; define read/write consistency choices.",
        category: "Distributed Systems",
        difficulty: 1,
        xpReward: 130,
        order: 1,
        type: "theory",
        theoryContent: `# Replication + Consistency (Leader/Follower)

## Architecture (ASCII)

\`\`\`
          writes                  replication                reads
 +--------+        +---------+    log/stream    +---------+   +--------+
 |Client A| -----> | Leader  | ---------------> |Follower |<--|Client B|
 +--------+        +----+----+                  +----+----+   +--------+
                        |                            |
                        v                            v
                    +---+----------------------------+---+
                    |            Storage / WAL            |
                    +-------------------------------------+
\`\`\`

## Your task

Define and compare:
- strong consistency vs eventual consistency
- read-your-writes, monotonic reads, causal consistency

Then answer:
1) If a client writes at time T, when can another client safely read the new value?
2) What’s the cost of synchronous replication (latency, availability)?
3) How do leader elections affect correctness (stale reads, split brain)?

## Deliverables

- A short table mapping **consistency guarantees** → **implementation choices** (quorums, leader leases, read fences).
- One concrete bug caused by weak consistency and how you’d detect it.
`,
        hints: [
          "Synchronous replication improves consistency but can reduce availability.",
          "Leader elections can cause stale reads unless clients use fencing/epochs.",
          "Define what your product needs; don’t overpay for consistency you won’t use.",
        ],
      },
      {
        slug: "distributed-systems-fix-inventory-race",
        title: "Fix a Race Condition: Overselling Inventory",
        description:
          "Race: two checkouts read stock=1 and both decrement. Fix with atomicity + idempotency.",
        category: "Distributed Systems",
        difficulty: 3,
        xpReward: 240,
        order: 2,
        type: "theory",
        theoryContent: `# Fix a Race Condition: Overselling Inventory

## Architecture (ASCII)

\`\`\`
 +--------+      +-------------+      +----------+
 | Client | ---> | Checkout Svc| ---> |   DB     |
 +--------+      +------+------+      +----+-----+
                       |                   |
                       | payment           | stock
                       v                   v
                  +----+-----+        +----+-----+
                  | Payments |        | Inventory|
                  +----------+        +----------+
\`\`\`

## The bug

You have:
1) read current stock
2) if stock > 0 then decrement

Two requests can interleave:
- R1 reads stock=1
- R2 reads stock=1
- R1 decrements to 0
- R2 decrements to -1  (oversold)

## Your task

Propose **two** fixes, at least one of which must work across multiple service instances:

Option ideas:
- DB transaction with \`SELECT ... FOR UPDATE\` / conditional update
- atomic compare-and-swap update (\`UPDATE ... WHERE stock > 0\`)
- reservation model with expiry (hold stock for N minutes)
- distributed lock (with fencing token)

Also design an **idempotency key** strategy for retries (payment callbacks can retry!).

## Deliverables

- Pseudocode for your chosen approach.
- A short explanation of the failure modes (deadlocks, lock contention, timeouts).
- How you would test it (load test + deterministic concurrency test).
`,
        hints: [
          "Prefer making the decrement atomic at the database layer.",
          "Idempotency prevents duplicate charges and double decrements on retries.",
          "Locks without fencing can still break during failover; address that explicitly.",
        ],
      },
      {
        slug: "distributed-systems-fix-distributed-lock-race",
        title: "Fix a Race Condition: Naive Distributed Lock",
        description: "Race: lock stolen after GC pause. Fix with TTL + fencing tokens + renewals.",
        category: "Distributed Systems",
        difficulty: 4,
        xpReward: 290,
        order: 3,
        type: "theory",
        theoryContent: `# Fix a Race Condition: Naive Distributed Lock

## Architecture (ASCII)

\`\`\`
 +---------+       +-----------------+
 | Worker1 |<----->|  Lock Service   |
 +---------+       | (Redis/etcd)    |
 +---------+       +--------+--------+
 | Worker2 |<-------------->|
 +---------+                v
                        +----+----+
                        |  DB    |
                        +---------+
\`\`\`

## The bug

Worker1 acquires a lock and starts a critical section. It gets paused (GC, stop-the-world, node stall),
and the lock TTL expires. Worker2 acquires the same lock and starts the same critical section.
Now you have **two owners**.

## Your task

1) Explain why “\`SETNX\` + TTL” is not enough by itself.
2) Propose a safe locking protocol that includes:
   - unique lock value (owner token)
   - TTL + renewals (watchdog)
   - **fencing token** (monotonic epoch) passed to downstream systems
3) Show how the DB (or downstream) rejects stale owners using the fencing token.

## Deliverables

- A diagram of the protocol steps.
- Pseudocode for acquire/renew/release.
- A concrete stale-owner scenario and how the fencing token prevents corruption.
`,
        hints: [
          "A lock only protects work if the protected system can detect staleness (fencing).",
          "Renewals help but still fail under long pauses; fencing is the key correctness lever.",
          "Release must verify ownership token to avoid deleting someone else’s lock.",
        ],
      },
      {
        slug: "distributed-systems-raft-log-replication",
        title: "Consensus by Log: Raft Mental Model",
        description:
          "Understand consensus: [Leader] replicates a log; commits when a quorum acknowledges.",
        category: "Distributed Systems",
        difficulty: 4,
        xpReward: 280,
        order: 4,
        type: "theory",
        theoryContent: `# Consensus by Log: Raft Mental Model

## Architecture (ASCII)

\`\`\`
             AppendEntries(term, prevIdx, entries...)
 +---------+  --------------------------------------> +---------+
 | Leader  |  --------------------------------------> | Follower|
 +----+----+  --------------------------------------> +----+----+
      |                                                 |
      | commit index advances when quorum acks           |
      v                                                 v
 +----+------------------+                    +---------+---------+
 |     Replicated Log    |                    |     Replicated Log |
 +-----------------------+                    +--------------------+
\`\`\`

## Your task

Explain, in your own words:
- leader election + terms
- log matching property
- commit rule (why quorum matters)

Then answer:
1) What does “linearizable write” mean in a Raft-backed KV store?
2) What happens if a leader is partitioned but still running?
3) How do you prevent an old leader from overwriting newer state after recovery?

## Deliverables

- One page explanation with a timeline diagram of an election and a commit.
`,
        hints: [
          "Terms prevent stale leaders from continuing to commit.",
          "Log matching prevents divergent histories from being committed.",
          "Linearizable reads often need a read index / leader lease mechanism.",
        ],
      },
      {
        slug: "distributed-systems-clocks-and-ordering",
        title: "Time, Ordering, and Causality",
        description:
          "Model causality: events form a DAG; use Lamport/vector clocks to order without real time.",
        category: "Distributed Systems",
        difficulty: 2,
        xpReward: 190,
        order: 5,
        type: "theory",
        theoryContent: `# Time, Ordering, and Causality

## Architecture (ASCII)

\`\`\`
 Node A:  a1 ---- a2 ---- a3
            \\           /
             \\         /
 Node B:       b1 ---- b2

 (message edges create "happens-before")
\`\`\`

## Your task

You’re building a collaborative app. Two users update the same document concurrently.

1) Explain why wall-clock timestamps are insufficient (skew, leap, drift).
2) Use **Lamport clocks** to derive a consistent total order. What information is lost?
3) Use **vector clocks** to detect concurrency. What’s the storage cost?
4) Decide on a conflict resolution strategy:
   - last-write-wins (LWW)
   - operational transform (OT)
   - CRDT

## Deliverables

- A short example with 2 nodes and 5 events showing Lamport and vector clock values.
- A paragraph describing which strategy you would pick and why.
`,
        hints: [
          "Lamport clocks give you an order but not true causality.",
          "Vector clocks can detect concurrency, but scale with the number of nodes.",
          "Choose a strategy that matches product needs; CRDTs aren’t always necessary.",
        ],
      },
      {
        slug: "distributed-systems-outbox-idempotency-schema",
        title: "Schema Design: Idempotency + Exactly-Once-ish Processing",
        description: "Design tables for idempotency: [requests] -> [outbox] -> [consumer_offsets].",
        category: "Distributed Systems",
        difficulty: 3,
        xpReward: 240,
        order: 6,
        type: "theory",
        theoryContent: `# Schema Design: Idempotency + Exactly-Once-ish Processing

## Architecture (ASCII)

\`\`\`
 +---------+    +---------+    +-----------+    +------------+
 | Client  | -> |  API    | -> |  DB txn   | -> |  Outbox    |
 +---------+    +----+----+    +-----+-----+    +-----+------+
                           \\\\                      |
                            \\\\ publish             v
                             \\\\              +-----+------+
                              \\\\             |   Bus      |
                               \\\\            +-----+------+
                                \\\\                 |
                                 \\\\                v
                                  \\\\        +------+------+
                                   ------->  | Consumers   |
                                              +-------------+
\`\`\`

## Your task

You want “exactly-once” effects (e.g., sending a single email) even though your bus is at-least-once.

Design a schema that supports:
- **Idempotency keys** for API requests
- **Outbox events** for safe publishing
- **Consumer dedupe** (processed event ids) OR transactional sinks

## Deliverables

1) Table schemas + indexes for:
   - \`idempotency_keys\`
   - \`outbox_events\`
   - \`processed_events\` (or equivalent)
2) A clear algorithm for:
   - handling retries on the API side
   - handling duplicates on the consumer side
3) One race condition your design prevents (show the interleaving).
`,
        hints: [
          "Exactly-once is usually an illusion; target exactly-once effects instead.",
          "Idempotency keys must cover the full side-effect scope, not just the request body.",
          "Consumers should store a dedupe key in the same transaction as the effect if possible.",
        ],
      },
    ],
  };

  const rustProgramming: GeneratedBundle = {
    course: {
      title: "Rust Programming",
      slug: "rust-programming",
      description:
        "[Ownership] -> [Borrowing] -> [Concurrency]; make invalid states unrepresentable.",
      icon: "Terminal",
      order: 22,
    },
    challenges: [
      {
        slug: "rust-programming-ownership-and-borrowing",
        title: "Ownership + Borrowing: Mental Model",
        description:
          "Understand data flow: [Owner] -> (borrow) -> [Reader]; prevent aliasing + mutation.",
        category: "Rust Programming",
        difficulty: 1,
        xpReward: 120,
        order: 1,
        type: "theory",
        theoryContent: `# Ownership + Borrowing: Mental Model

## Architecture (ASCII)

\`\`\`
          move             borrow (&T)          borrow (&mut T)
 +--------+      +-------------------+      +-------------------+
 | Owner  | ---> |   New Owner       |      | Exclusive Borrow  |
 +--------+      +-------------------+      +-------------------+
    |                     ^
    | shared borrows      |
    v                     |
 +-------------------+    |
 | Shared Borrowers  |----+
 +-------------------+
\`\`\`

## Your task

Explain:
- what “move” means
- why Rust forbids aliasing + mutation at the same time
- the difference between \`&T\` and \`&mut T\`

Then design an API for a function that:
- takes a buffer
- parses a header
- returns a view into the buffer without copying

## Deliverables

- A short explanation of lifetimes as a *relationship*, not a “time”.
- A function signature you’d propose (with lifetimes if needed) and why.
`,
        hints: [
          "Think of lifetimes as constraints: “this reference can’t outlive that buffer.”",
          "If you return slices/str views, you usually need a lifetime parameter.",
          "Avoid cloning/copying unless you truly need owned data.",
        ],
      },
      {
        slug: "rust-programming-schema-job-queue",
        title: "Design a Schema: Job Queue for Rust Workers",
        description:
          "Schema challenge: [producer] -> [jobs table] -> [workers]; handle retries safely.",
        category: "Rust Programming",
        difficulty: 2,
        xpReward: 180,
        order: 2,
        type: "theory",
        theoryContent: `# Design a Schema: Job Queue for Rust Workers

## Architecture (ASCII)

\`\`\`
 +-----------+         +------------------+         +-----------+
 | Producer  |  INSERT |   jobs (table)   |  CLAIM  | Workers   |
 +-----------+ ------> +------------------+ ------> +-----------+
                                |
                                v
                          +-----+------+
                          |  deadletter|
                          +------------+
\`\`\`

## Your task (schema design)

You are implementing a background job system. Workers are Rust services.

Design a schema that supports:
- enqueue jobs
- claim jobs safely (no two workers take the same job)
- retries with backoff
- dead-lettering after N failures
- visibility timeout / lease (worker crashes)

## Deliverables

1) Propose a \`jobs\` table schema + indexes.
2) Describe the “claim” operation as an **atomic** DB operation.
3) Explain how you prevent a race where two workers claim the same job.

## Bonus

How do you make job handlers idempotent (so retries don’t double-charge)?
`,
        hints: [
          "Model a lease: claimed_until + claimed_by + attempt_count.",
          "Claim with an atomic conditional update (status=READY and claimed_until < now).",
          "Idempotency keys belong near the side-effect boundary, not deep inside the handler.",
        ],
      },
      {
        slug: "rust-programming-fix-async-race",
        title: "Fix a Race Condition: Async Cancellation + Shared State",
        description:
          "Race: task cancellation leaves shared state inconsistent. Fix with structured concurrency.",
        category: "Rust Programming",
        difficulty: 4,
        xpReward: 300,
        order: 3,
        type: "theory",
        theoryContent: `# Fix a Race Condition: Async Cancellation + Shared State

## Architecture (ASCII)

\`\`\`
 +-----------+      spawn       +-----------------+
 | Request   |  ----------->    | Task A (writes) |
 +-----------+                   +-----------------+
        |                                |
        | cancel/timeout                  | updates shared state
        v                                v
 +-----------+                     +------+------+
 | Runtime   |                     | Shared Map  |
 +-----------+                     +-------------+
\`\`\`

## The bug

You have two async tasks that update shared state:
- Task A starts writing \`state["job"]=IN_PROGRESS\`
- Task A is cancelled (timeout / client disconnect) before it writes \`DONE\`
- Another task observes \`IN_PROGRESS\` forever

## Your task

Propose fixes using Rust async patterns (e.g., Tokio):
- structured concurrency (ensure child tasks are joined/aborted deterministically)
- “finally” cleanup via drop guards
- atomic state machine transitions
- store progress in durable storage rather than in-memory when needed

## Deliverables

- A state machine diagram with allowed transitions.
- A design that guarantees cleanup even on cancellation.
- One test strategy that reproduces the race (timeouts + controlled scheduling).
`,
        hints: [
          "Cancellation is a control-flow path; treat it like an error path with cleanup.",
          "Model state transitions explicitly; reject invalid transitions.",
          "If correctness matters across processes, in-memory state is insufficient.",
        ],
      },
      {
        slug: "rust-programming-lifetimes-api-design",
        title: "Design an API with Lifetimes (Parser/Tokenizer)",
        description:
          "Design signatures: [input bytes] -> [tokens] -> [AST]. Avoid unnecessary allocations.",
        category: "Rust Programming",
        difficulty: 3,
        xpReward: 240,
        order: 4,
        type: "theory",
        theoryContent: `# Design an API with Lifetimes (Parser/Tokenizer)

## Architecture (ASCII)

\`\`\`
  &str / &[u8]  --->  tokenizer  --->  parser  --->  AST
        |              |              |
        | borrows      | borrows      | may own
        v              v              v
     slices          token spans     nodes
\`\`\`

## Your task

You’re designing a tokenizer that returns tokens referencing the original input to avoid copies.

1) Propose a \`Token<'a>\` type.
2) Propose function signatures for:
   - \`tokenize(input: &'a str) -> Vec<Token<'a>>\`
   - \`parse(tokens: &[Token<'a>]) -> Ast<'a>\` OR an owned AST
3) Decide: should the AST borrow from input or own strings? Justify based on usage.

## Deliverables

- Type definitions + function signatures.
- A paragraph on tradeoffs (speed, memory, ergonomics).
`,
        hints: [
          "Borrowing from input avoids allocations but ties lifetimes together.",
          "If you need to store the AST long-term, owning is often easier.",
          "Sometimes a hybrid works: intern strings or copy only identifiers.",
        ],
      },
      {
        slug: "rust-programming-traits-and-architecture",
        title: "Architecture with Traits: Storage + Services",
        description: "Design modular architecture: [trait Storage] <- [PgStorage] / [MemStorage].",
        category: "Rust Programming",
        difficulty: 2,
        xpReward: 200,
        order: 5,
        type: "theory",
        theoryContent: `# Architecture with Traits: Storage + Services

## Architecture (ASCII)

\`\`\`
                 +------------------+
                 |   Service Layer  |
                 +---------+--------+
                           |
                           v
                 +---------+--------+
                 |   trait Storage  |
                 +----+--------+----+
                      |        |
                      v        v
               +------+--+  +--+------+
               | PgStore |  | MemStore|
               +---------+  +---------+
\`\`\`

## Your task

Design a storage abstraction for a small app (e.g., links, jobs, or users).

1) Decide between:
   - generics (\`Service<S: Storage>\`)
   - trait objects (\`Box<dyn Storage>\`)
2) Define the trait surface area (methods, error types, async considerations).
3) Explain how you will test the service layer deterministically.

## Deliverables

- Trait definition sketch (methods + error type approach).
- Explanation: why generics vs trait objects for your use case.
`,
        hints: [
          "Generics give static dispatch; trait objects simplify wiring and reduce monomorphization.",
          "Async traits require careful design; consider returning futures or using an async runtime.",
          "In-memory implementations are great for unit tests when behavior matches real storage.",
        ],
      },
      {
        slug: "rust-programming-fix-atomics-race",
        title: "Fix a Race Condition: Atomics + Memory Ordering",
        description:
          "Race: stale reads due to weak ordering. Fix with Acquire/Release and invariants.",
        category: "Rust Programming",
        difficulty: 5,
        xpReward: 360,
        order: 6,
        type: "theory",
        theoryContent: `# Fix a Race Condition: Atomics + Memory Ordering

## Architecture (ASCII)

\`\`\`
 Thread A (producer):          Thread B (consumer):
  write data                   read flag
  set flag                     read data

        +-------------------------------+
        |  shared memory (cache lines)  |
        +-------------------------------+
\`\`\`

## The bug

You use an atomic boolean flag to signal that some data is ready, but the consumer sometimes sees:
- flag == true
- data still looks uninitialized / old

This can happen if you use relaxed ordering everywhere.

## Your task

1) Explain the required invariant: “if flag is true, data writes must be visible.”
2) Choose and justify memory orderings:
   - producer: store(flag, Release)
   - consumer: load(flag, Acquire)
3) Describe when you’d still need stronger ordering (SeqCst) or fences.

## Deliverables

- A brief explanation of the reordering you’re preventing.
- A corrected pseudo-implementation (no need to compile).
- One test strategy (stress test + Loom model checking).
`,
        hints: [
          "Acquire/Release creates a happens-before edge between threads.",
          "Relaxed only provides atomicity for that variable, not visibility for surrounding data.",
          "Model checking (Loom) can find reorderings that are rare in practice.",
        ],
      },
    ],
  };

  return [systemDesign, distributedSystems, rustProgramming];
}

async function seedBundles(bundles: GeneratedBundle[]) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local (needed for --seed).");
    process.exitCode = 1;
    return;
  }

  const client = new ConvexHttpClient(convexUrl);

  for (const bundle of bundles) {
    const courseId = await client.mutation(api.seedCourses.createCourse, bundle.course);
    console.log(`✅ Course ensured: ${bundle.course.title} (${courseId})`);

    for (const challenge of bundle.challenges) {
      await client.mutation(api.seedCourses.createChallenge, {
        ...challenge,
        courseId,
      });
      console.log(`   - Challenge ensured: ${challenge.title}`);
    }
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("-h") || args.has("--help")) {
    usage();
    return;
  }

  const bundles = generateBundles();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(bundles, null, 2));
  console.log(`✅ Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);

  if (args.has("--seed")) {
    console.log("🌱 Seeding Convex...");
    await seedBundles(bundles);
    console.log("🏁 Done.");
  } else {
    console.log("Tip: run with --seed to insert/update these courses in Convex.");
  }
}

main().catch((error) => {
  console.error("❌ gen-cs failed:", error);
  process.exit(1);
});
