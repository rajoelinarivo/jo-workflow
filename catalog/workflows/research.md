---
name: research
description: Answer a technical question or choose between libraries, tools, architectures or approaches, ending with a recorded decision rather than code.
---
# Research

Phases run in order by the `dev` orchestrator. [gate] = stop for approval in guided autonomy.

## 1. Frame
- Use: skill `solution-research`.
- Do: state the problem, constraints and weighted decision criteria.
- Done when: the criteria are in the task file.

## 2. Explore
- Use: agent `researcher` for external sources, skill `solution-research`.
- Do: 2 to 4 credible options with sourced facts (versions, licenses, maintenance, known issues).

## 3. Prototype (optional)
- Do: only when cheap and decisive; keep it out of production code or delete it afterwards.

## 4. Recommend [gate]
- Do: comparison table against the criteria, one recommendation, risks and cost of reversing it.
- Done when: the user accepts or picks an option.

## 5. Record
- Use: skill `remember`.
- Done when: an ADR is in `decisions.md`, and the implementation is proposed as a new `/dev` task.
