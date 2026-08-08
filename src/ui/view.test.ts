// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../i18n';
import { renderApp } from './view';

let root: HTMLElement;

beforeEach(() => {
  document.body.replaceChildren();
  root = document.createElement('div');
  document.body.append(root);
});

describe('app shell', () => {
  it('exposes every control the free-practice loop needs (item_005 AC1, AC2)', () => {
    const view = renderApp(root);
    expect(view.micButton.textContent).toBe(CATALOGUE['mic.start']);
    expect(view.panicButton.textContent).toBe(CATALOGUE['piano.panic']);
    expect(view.muteButton.textContent).toBe(CATALOGUE['piano.mute']);
    expect(view.instrumentSelect.options).toHaveLength(3);
    expect([...view.instrumentSelect.options].map((option) => option.value)).toEqual([
      'studio-grand',
      'soft-piano',
      'warm-organ',
    ]);
    expect([...view.instrumentSelect.options].map((option) => option.textContent)).toEqual([
      'Studio Grand',
      'Soft Piano',
      'Warm Organ',
    ]);
  });

  it('states the local-only privacy promise up front (item_003 AC1, item_005 AC1)', () => {
    renderApp(root);
    const text = root.textContent ?? '';
    expect(text).toContain(CATALOGUE['mic.consent']);
    expect(text).toContain(CATALOGUE['footer.privacy']);
    expect(text).toContain(CATALOGUE['mic.headphonesHint']);
    expect(text).toContain(CATALOGUE['piano.keyboardHint']);
  });

  it('gives the trace an accessible name and a non-colour legend (item_004 AC6)', () => {
    const view = renderApp(root);
    expect(view.canvas.getAttribute('aria-label')).toBe(CATALOGUE['trace.label']);
    const legend = root.querySelector('.legend')?.textContent ?? '';
    expect(legend).toContain(CATALOGUE['trace.legendInTune']);
    expect(legend).toContain(CATALOGUE['trace.legendUncertain']);
    expect(legend).toContain(CATALOGUE['trace.readingDirection']);
  });

  it('reports microphone state and input level to assistive technology', () => {
    const view = renderApp(root);
    expect(view.micStatus.getAttribute('role')).toBe('status');
    expect(view.levelMeter.getAttribute('role')).toBe('meter');
    expect(view.levelMeter.getAttribute('aria-valuenow')).toBe('0');
    expect(view.liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(view.noteReadout.textContent).toBe(CATALOGUE['pitch.none']);
  });

  it('labels every form control', () => {
    renderApp(root);
    for (const control of root.querySelectorAll<HTMLElement>('select, input')) {
      const labelled = control.id && root.querySelector(`label[for="${control.id}"]`);
      expect(Boolean(labelled), `unlabelled control: ${control.outerHTML}`).toBe(true);
    }
  });

  it('keeps the update banner hidden until an update is ready', () => {
    const view = renderApp(root);
    expect(view.updateBanner.className).toContain('banner--hidden');
    expect(view.updateButton.textContent).toBe(CATALOGUE['app.updateAction']);
  });

  it('is idempotent, so a re-render leaves one shell', () => {
    renderApp(root);
    renderApp(root);
    expect(root.querySelectorAll('.app__header')).toHaveLength(1);
    expect(root.querySelectorAll('canvas')).toHaveLength(1);
  });
});
