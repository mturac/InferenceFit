export function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : round((sorted[middle - 1]! + sorted[middle]!) / 2);
}

export function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round(numerator / denominator);
}
