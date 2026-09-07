export function sameValue(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergeChanges<T>(
  base: T,
  local: T,
  remote: T,
  atomicFields: readonly string[] = [],
): { value: T; conflict: boolean } {
  let conflict = false;
  function merge(before: unknown, ours: unknown, theirs: unknown, field = ''): unknown {
    if (sameValue(before, ours)) return theirs;
    if (sameValue(ours, theirs) || sameValue(before, theirs)) return ours;
    if (atomicFields.includes(field)) {
      conflict = true;
      return ours;
    }

    if (Array.isArray(before) && Array.isArray(ours) && Array.isArray(theirs)) {
      const entries: unknown[] = [...before, ...ours, ...theirs];
      const key = ['id', 'studentId', 'generatedAt'].find(
        (key) =>
          entries.length > 0 &&
          entries.every((entry) => isRecord(entry) && typeof entry[key] === 'string'),
      );
      if (key) {
        const index = (items: Record<string, unknown>[]) =>
          new Map(items.map((item) => [item[key], item]));
        const old = index(before);
        const next = index(ours);
        const latest = index(theirs);
        const result: unknown[] = [];
        for (const [id, item] of latest) {
          if (old.has(id) && !next.has(id)) {
            if (!sameValue(old.get(id), item)) conflict = true;
            continue;
          }
          result.push(next.has(id) ? merge(old.get(id), next.get(id), item) : item);
        }
        for (const [id, item] of next) {
          if (!latest.has(id)) {
            if (!old.has(id)) result.push(item);
            else if (!sameValue(old.get(id), item)) conflict = true;
          }
        }
        return result;
      }
    }

    if (isRecord(before) && isRecord(ours) && isRecord(theirs)) {
      const result: Record<string, unknown> = {};
      for (const key of new Set([
        ...Object.keys(before),
        ...Object.keys(ours),
        ...Object.keys(theirs),
      ])) {
        const value = merge(before[key], ours[key], theirs[key], key);
        if (value !== undefined) result[key] = value;
      }
      return result;
    }

    conflict = true;
    return ours;
  }
  return { value: merge(base, local, remote) as T, conflict };
}
