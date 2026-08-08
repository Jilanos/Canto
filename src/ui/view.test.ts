// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../i18n';
import { renderApp, renderDiagnostics } from './view';

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
    const label = view.canvas.getAttribute('aria-label') ?? '';
    expect(label).toContain(CATALOGUE['trace.label']);
    // The reading direction belongs to the accessible name: the canvas is the only
    // place that information exists for a screen reader.
    expect(label).toContain(CATALOGUE['trace.readingDirection']);
    const legend = root.querySelector('.legend')?.textContent ?? '';
    expect(legend).toContain(CATALOGUE['trace.legendInTune']);
    expect(legend).toContain(CATALOGUE['trace.legendUncertain']);
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

  it('keeps only the trace and the keyboard in the flexible flow (item_006)', () => {
    const view = renderApp(root);
    // Anything else in the column is fixed-height chrome; the overlay panels are
    // positioned out of the flow so opening them cannot push the keyboard away.
    const flow = [...view.root.children].filter((child) => !child.classList.contains('panel'));
    expect(flow).toContain(view.traceSection);
    expect(flow).toContain(view.pianoSection);
    expect(view.helpPanel.className).toContain('panel');
    expect(view.diagnosticsPanel.className).toContain('panel');
  });

  it('hides the secondary copy in a panel that starts closed (item_006 AC4)', () => {
    const view = renderApp(root);
    expect(view.helpPanel.className).toContain('panel--hidden');
    expect(view.helpButton.getAttribute('aria-expanded')).toBe('false');
    const help = view.helpPanel.textContent ?? '';
    expect(help).toContain(CATALOGUE['piano.keyboardHint']);
    expect(help).toContain(CATALOGUE['mic.headphonesHint']);
    expect(help).toContain(CATALOGUE['footer.privacy']);
    expect(view.helpCloseButton.textContent).toBe(CATALOGUE['app.close']);
  });

  it('starts with diagnostics closed and renders rows on demand (item_007 AC5)', () => {
    const view = renderApp(root);
    expect(view.diagnosticsPanel.className).toContain('panel--hidden');
    expect(view.diagnosticsButton.getAttribute('aria-expanded')).toBe('false');
    expect(view.diagnosticsBody.children).toHaveLength(0);

    renderDiagnostics(view.diagnosticsBody, [
      ['State', 'tracking'],
      ['RMS', '0.0421'],
    ]);
    expect(view.diagnosticsBody.querySelectorAll('dt')).toHaveLength(2);
    expect(view.diagnosticsBody.textContent).toContain('0.0421');

    renderDiagnostics(view.diagnosticsBody, [['State', 'silence']]);
    expect(view.diagnosticsBody.querySelectorAll('dt')).toHaveLength(1);
  });

  it('keeps the microphone control, the note and the level on one status bar', () => {
    const view = renderApp(root);
    expect(view.statusBar.contains(view.micButton)).toBe(true);
    expect(view.statusBar.contains(view.noteReadout)).toBe(true);
    expect(view.statusBar.contains(view.levelMeter)).toBe(true);
    expect(view.statusBar.contains(view.micStatus)).toBe(true);
  });

  it('is idempotent, so a re-render leaves one shell', () => {
    renderApp(root);
    renderApp(root);
    expect(root.querySelectorAll('.app__header')).toHaveLength(1);
    expect(root.querySelectorAll('canvas')).toHaveLength(1);
  });
});
