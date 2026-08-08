/**
 * Minimal catalogue lookup. Every visible string of the MVP comes from the English
 * source catalogue (item_001 AC6) declared in `logics/i18n/contract.json`; adding a
 * locale later means adding a catalogue, not touching the views.
 *
 * The catalogue is nested — the contract requires dot-free key segments — and
 * flattened here into the dotted keys the application uses.
 */

import en from './en.json';

type Catalogue = typeof en;

/** Dotted keys of a nested catalogue, e.g. `mic.start`. */
type DottedKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DottedKeys<T[K]>}`;
}[keyof T & string];

export type TranslationKey = DottedKeys<Catalogue>;

function flatten(source: Record<string, unknown>, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') flat[dotted] = value;
    else if (value && typeof value === 'object') Object.assign(flat, flatten(value as Record<string, unknown>, dotted));
  }
  return flat;
}

/** The English catalogue as dotted keys; also used by tests to assert copy. */
export const CATALOGUE: Record<string, string> = flatten(en as Record<string, unknown>);

/** Looks up `key` and substitutes `{name}` placeholders. */
export function t(key: TranslationKey, values: Record<string, string | number> = {}): string {
  const template = CATALOGUE[key];
  if (template === undefined) {
    // A missing key is a build-time mistake; surface it instead of rendering blank.
    if (import.meta.env.DEV) throw new Error(`Missing translation key: ${key}`);
    return key;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}

export const SOURCE_LOCALE = 'en';
