export const spikeCounters = { pageMounts: 0 }

// The React Compiler rewrites a compound assignment to an imported binding
// inside a component into a read of an unbound name, which yields NaN.
export function countPageMount() {
  spikeCounters.pageMounts += 1
}
