import type { ItemDefinition } from "@/schemas/items";

type TableObservation =
  | { kind: "OBSERVED_CONSTANT"; values: number[]; value: number }
  | { kind: "OBSERVED_VALUES"; values: number[]; minimum: number; maximum: number };
export type ArmorStatObservation =
  | { kind: "RESOURCE_VALUE"; value: number }
  | { kind: "UNBOUND_TIER_TABLE"; table: TableObservation }
  | { kind: "SOURCE_RELATION_UNPROVEN"; resourceValue: number; table: TableObservation }
  | { kind: "UNKNOWN" };

/**
 * Resource scope only. A table constant/range is NOT a concrete item value/bound.
 * No inspected source proves completeness, table-index semantics or modifier composition.
 * Deliberately does not return a comparison-ready numeric stat map.
 */
export function inspectArmorStatContract(item: ItemDefinition) {
  const ordinary = item.stats;
  const raw = item.metadata.tiered_stats;
  const tablePresent = Object.hasOwn(item.metadata, "tiered_stats");
  const columns = new Map<string, number[]>();
  let valid = item.sources.includes("hypixel");
  const columnLengths = new Set<number>();
  if (tablePresent) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !Object.keys(raw).length) valid = false;
    else for (const [label, values] of Object.entries(raw)) {
      const key = label.trim().toUpperCase();
      if (!key || !Array.isArray(values) || !values.length ||
          values.some(value => typeof value !== "number" || !Number.isFinite(value))) { valid = false; continue; }
      columnLengths.add(values.length);
      if (columns.has(key) && JSON.stringify(columns.get(key)) !== JSON.stringify(values)) valid = false;
      columns.set(key, [...values]);
    }
  }
  if (Object.entries(ordinary).some(([key,value]) =>
    !key || key !== key.trim().toUpperCase() || !Number.isFinite(value))) valid = false;
  const table = (values: number[]): TableObservation => values.every(value => value === values[0])
    ? { kind: "OBSERVED_CONSTANT", values: [...values], value: values[0] }
    : { kind: "OBSERVED_VALUES", values: [...values], minimum: Math.min(...values), maximum: Math.max(...values) };
  const keys = [...new Set([...Object.keys(ordinary), ...columns.keys()])].sort();
  const observe = (stat: string): ArmorStatObservation => {
    if (!valid) return {kind:"UNKNOWN"};
    const key = stat.trim().toUpperCase(), values = columns.get(key);
    if (values && Object.hasOwn(ordinary,key)) return {kind:"SOURCE_RELATION_UNPROVEN",resourceValue:ordinary[key],table:table(values)};
    if (values) return {kind:"UNBOUND_TIER_TABLE",table:table(values)};
    if (Object.hasOwn(ordinary,key)) return {kind:"RESOURCE_VALUE",value:ordinary[key]};
    return {kind:"UNKNOWN"}; // Neither a sparse map nor a table proves absence.
  };
  return {
    completeness: "UNPROVEN" as const,
    variantBinding: "UNRESOLVED" as const,
    tableStatus: !tablePresent ? "NOT_PRESENT" as const : valid ? "OBSERVED_UNBOUND" as const : "INVALID" as const,
    columnLayout: columnLengths.size > 1 ? "UNEQUAL_LENGTHS" as const : columnLengths.size === 1 ? "EQUAL_LENGTHS" as const : "UNKNOWN" as const,
    sourceValid: valid, keys, observe,
  };
}
