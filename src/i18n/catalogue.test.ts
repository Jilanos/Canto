import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, t } from './index';

const SRC = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (extname(entry.name) !== '.ts' || entry.name.endsWith('.test.ts')) return [];
    return [path];
  });
}

function scan(pattern: RegExp): Set<string> {
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    for (const match of readFileSync(file, 'utf8').matchAll(pattern)) keys.add(match[1] as string);
  }
  return keys;
}

/** Keys passed straight to `t('key')`; these must exist in the catalogue. */
function directKeys(): Set<string> {
  return scan(/\bt\(\s*'([^']+)'/g);
}

/**
 * Any catalogue-shaped literal. Keys also reach `t()` through ternaries and lookup
 * tables, so the unused-entry check uses this wider scan.
 */
function referencedKeys(): Set<string> {
  return scan(/'([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)'/g);
}

describe('English source catalogue', () => {
  it('defines every key the application asks for (item_001 AC6)', () => {
    const missing = [...directKeys()].filter((key) => !Object.hasOwn(CATALOGUE, key));
    expect(missing).toEqual([]);
  });

  it('has no unused entries', () => {
    const used = referencedKeys();
    const unused = Object.keys(CATALOGUE).filter((key) => !used.has(key));
    expect(unused).toEqual([]);
  });

  it('holds non-empty strings only', () => {
    for (const [key, value] of Object.entries(CATALOGUE)) {
      expect(typeof value, key).toBe('string');
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });

  it('substitutes placeholders and leaves unknown ones intact', () => {
    expect(t('piano.keyLabel', { note: 'C4' })).toBe('Play C4');
    expect(t('piano.rangeValue', { low: 'C3', high: 'C5' })).toBe('C3 to C5');
    expect(t('a11y.activeNotes', {})).toBe('Playing {notes}');
  });
});
