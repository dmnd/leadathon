export function partition<T>(
  arr: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of arr) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [truthy, falsy];
}

export function groupBy<T, K>(
  xs: Iterable<T>,
  k: (item: T) => K,
): Map<K, Array<T>> {
  const groups = new Map<K, T[]>();
  for (const x of xs) {
    const key = k(x);
    if (groups.has(key)) {
      groups.get(key)!.push(x);
    } else {
      groups.set(key, [x]);
    }
  }
  return groups;
}
