export function capitalize(s: string) {
  return s[0]?.toLocaleUpperCase() + s.slice(1);
}

export function kebabify(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function camelify(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function humanize(s: string): string {
  return kebabify(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
