---
name: benchmark
description: "Measure performance reliably and compare it with a stored baseline: define the metric and workload, warm up, repeat, report variance, keep the machine and conditions constant, store results with the commit hash and flag regressions beyond a threshold. Use when the user says benchmark, performance test, is it faster, measure latency/throughput/memory, perf regression, profile, or optimize."
category: tests
user-invocable: true
argument-hint: "[code path or operation to benchmark]"
---
# Benchmark

## 1. Define what to measure
- Operation under test and the question to answer ("is the new parser at least as fast as the old one on 10 MB inputs?").
- Metric: latency (report median and p95/p99, not mean alone), throughput, allocations/memory peak, startup time, binary size.
- Workload: realistic input sizes and shapes; include small, typical and large cases. Store inputs in the repo or generate them with a fixed seed.

## 2. Use proper tooling
- Use the ecosystem's benchmark harness (built-in benchmark support of the language's test tooling, or the de facto benchmarking library) rather than ad-hoc timers. They handle warmup, iteration counts and statistics.
- For whole-program or HTTP benchmarks, use a load tool with fixed concurrency, duration and warmup.
- Run via `{{commands.bench}}` if configured; otherwise add a bench entry point and set it in `.harness/harness.json`, then `jo-workflow sync`.
- Prevent dead-code elimination: consume the results (sink/black-box functions).

## 3. Control the environment
- Same machine, same power profile, no other heavy processes; on laptops, plugged in.
- Release/optimized build, same compiler/runtime version and flags.
- Disable debug logging and assertions that production does not have.
- Note CPU model, OS, runtime version with every result.
- CI shared runners are noisy; use them for coarse checks only, with a wider threshold.

## 4. Run
- Warmup iterations until steady state (JIT, caches, connection pools).
- At least 5–10 repetitions or the harness default; record each sample.
- Compute median and dispersion (stddev or IQR). If the coefficient of variation exceeds ~5%, fix the noise before comparing.

## 5. Baseline and compare
- Record the baseline on the reference commit first, then the candidate, in the same session and conditions. Alternate runs (A, B, A, B) when noise is a concern.
- Store results in a versioned file (e.g. `bench/results/<date>-<short-hash>.json` or csv) with commit hash, environment and raw samples.
- Compare with a threshold set beforehand (e.g. regression if median is >5% slower and the difference exceeds the noise). Use the harness's statistical comparison if it has one.

## 6. Act on results
- Regression: profile (CPU profiler, allocation profiler, flame graph) before changing code. Optimize the measured hot path, then re-run the full comparison.
- Improvement claim: report numbers with variance and conditions, not a single run.
- Record notable findings (hot paths, misleading micro-benchmarks, environment traps) in `.harness/memory/lessons.md`, and performance budgets in `.harness/memory/decisions.md`.

## Definition of done
- Benchmark reproducible with one command; inputs versioned.
- Baseline and candidate results stored with commit hashes and environment.
- Comparison reported as median plus variance against a pre-defined threshold, with a clear verdict.

## Pitfalls
- Comparing runs from different machines, builds or days without rerunning the baseline.
- Micro-benchmarks that measure the loop or the optimizer, not the code.
- Optimizing without profiling.
- Reporting the best run instead of the median.
