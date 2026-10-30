---
name: solution-research
description: "Explore options for a technical problem, compare them against explicit criteria in a table, prototype when cheap, recommend one, and log the decision as an ADR. Use when the user asks which library/framework/approach to use, compare options, evaluate alternatives, should we use X or Y, spike, technical investigation, or design choice."
category: research
user-invocable: true
argument-hint: "[problem or question to research]"
---
# Solution research

## 1. Frame the problem
- State the problem in one sentence, independent of any solution.
- List hard constraints (must-haves): language/runtime, license, hosting, compliance, budget, latency, data volume.
- List soft criteria with weights (1–3): e.g. maturity, maintenance activity, performance, learning curve, integration effort, operational cost, lock-in, security track record, team familiarity.
- Check `.harness/memory/decisions.md` for prior decisions that constrain or already answer the question.

## 2. Gather candidates
- Collect 3–5 options, including "do nothing / build minimal in-house" and the option already used elsewhere in the codebase.
- Sources: official docs, changelogs, release cadence, issue tracker health, security advisories, license file, benchmarks with stated methodology. Prefer primary sources over blog posts.
- Discard options that fail a hard constraint and note why in one line.

## 3. Compare
Produce a table:

| Criterion (weight) | Option A | Option B | Option C |
|---|---|---|---|
| Fits constraints | yes | yes | partial |
| Maturity (3) | ... | ... | ... |
| ... | | | |
| Weighted score | | | |

- Use facts with sources, not impressions. Mark unknowns as unknown.
- Note the main risk of each option and how it could be mitigated.

## 4. Prototype if cheap
- If the top two are close or a key criterion is unverified, build a throwaway spike (timebox: about an hour of work) that tests only the riskiest assumption: integration with the stack, performance on realistic data, API ergonomics.
- Keep spikes out of the main source tree (scratch branch or temp directory). Do not merge spike code.
- Record measured results, not feelings.

## 5. Recommend
- Pick one option. State why it wins on the weighted criteria, what you give up, and the conditions under which you would revisit.
- If no option is clearly better, say so and recommend the cheapest reversible one.

## 6. Log the decision
Append an ADR to `.harness/memory/decisions.md`:
```
## ADR-NNN: <title> (YYYY-MM-DD)
Status: proposed | accepted
Context: <problem and constraints>
Decision: <chosen option>
Alternatives: <rejected options, one line each with reason>
Consequences: <trade-offs, follow-ups, revisit triggers>
```
Mark it `proposed` until the user confirms, then `accepted`.

## Definition of done
- Criteria and weights explicit; comparison table with sources.
- Riskiest assumption verified or explicitly flagged.
- One recommendation with trade-offs; ADR recorded.

## Pitfalls
- Picking first and then choosing criteria that justify it.
- Comparing on stars or popularity only.
- Ignoring operational cost and the exit path (lock-in).
- Letting a spike silently become production code.
