/**
 * Builds the single-screen free-practice layout (item_001, item_005, item_006) and
 * exposes the elements the controller drives. All copy comes from the English
 * catalogue.
 *
 * Layout contract (item_006): only the trace and the keyboard flex. Everything else
 * is fixed-height chrome, and every block that is not needed to run the loop lives
 * in an overlay panel so that opening it cannot push the keyboard off screen.
 */

import { INSTRUMENT_IDS, type InstrumentId } from '../audio/instruments';
import { t } from '../i18n';

const INSTRUMENT_LABEL_KEYS: Record<InstrumentId, 'piano.instrumentStudioGrand' | 'piano.instrumentSoftPiano' | 'piano.instrumentWarmOrgan'> = {
  'studio-grand': 'piano.instrumentStudioGrand',
  'soft-piano': 'piano.instrumentSoftPiano',
  'warm-organ': 'piano.instrumentWarmOrgan',
};

export interface AppView {
  root: HTMLElement;
  header: HTMLElement;
  emblem: HTMLImageElement;
  portalLink: HTMLAnchorElement;
  statusBar: HTMLElement;
  controls: HTMLElement;
  traceSection: HTMLElement;
  pianoSection: HTMLElement;

  micButton: HTMLButtonElement;
  micStatus: HTMLElement;
  noteReadout: HTMLElement;
  tuningReadout: HTMLElement;
  levelMeter: HTMLElement;
  levelFill: HTMLElement;
  liveRegion: HTMLElement;
  canvas: HTMLCanvasElement;
  pianoRoot: HTMLElement;

  deviceSelect: HTMLSelectElement;
  deviceControl: HTMLElement;
  instrumentSelect: HTMLSelectElement;
  volumeInput: HTMLInputElement;
  muteButton: HTMLButtonElement;
  panicButton: HTMLButtonElement;
  octaveDownButton: HTMLButtonElement;
  octaveUpButton: HTMLButtonElement;
  rangeReadout: HTMLElement;

  helpButton: HTMLButtonElement;
  helpPanel: HTMLElement;
  helpCloseButton: HTMLButtonElement;
  diagnosticsButton: HTMLButtonElement;
  diagnosticsPanel: HTMLElement;
  diagnosticsBody: HTMLElement;
  diagnosticsCloseButton: HTMLButtonElement;

  updateBanner: HTMLElement;
  updateButton: HTMLButtonElement;
  offlineBadge: HTMLElement;
  offlineNote: HTMLElement;
}

export function renderApp(root: HTMLElement): AppView {
  root.replaceChildren();
  root.classList.add('app');

  // Header -----------------------------------------------------------------
  const header = element('header', 'app__header');

  const emblem = document.createElement('img');
  emblem.className = 'app__emblem';
  emblem.src = '/brand/canto-emblem.svg';
  emblem.alt = t('app.emblemAlt');
  emblem.width = 28;
  emblem.height = 28;
  emblem.decoding = 'async';

  const title = text('h1', 'app__title', t('app.name'));
  const brand = element('div', 'app__brand');
  brand.append(emblem, title);

  // Same window on purpose: this is the author's own portal, not an outbound link
  // a visitor would want to keep separate from their practice session.
  const portalLink = document.createElement('a');
  portalLink.className = 'app__portal';
  portalLink.href = 'https://paulmondou.fr';
  portalLink.textContent = t('app.portal');
  portalLink.title = t('app.portalTitle');
  portalLink.rel = 'author';
  const offlineBadge = text('span', 'badge', t('app.offlineBadge'));
  offlineBadge.title = t('app.offlineHint');
  const helpButton = button('button button--ghost', t('app.help'));
  helpButton.setAttribute('aria-expanded', 'false');
  const diagnosticsButton = button('button button--ghost', t('diag.toggle'));
  diagnosticsButton.setAttribute('aria-expanded', 'false');
  const headerActions = element('div', 'app__header-actions');
  headerActions.append(offlineBadge, helpButton, diagnosticsButton, portalLink);
  header.append(brand, headerActions);

  const updateBanner = element('div', 'banner banner--hidden');
  updateBanner.setAttribute('role', 'status');
  const updateButton = button('banner__action', t('app.updateAction'));
  updateBanner.append(text('span', 'banner__text', t('app.updateAvailable')), updateButton);

  // Status bar: microphone, detected note, level, compact legend ------------
  const statusBar = element('section', 'statusbar');
  statusBar.setAttribute('aria-label', t('pitch.label'));

  const micButton = button('button button--primary', t('mic.start'));
  micButton.setAttribute('aria-pressed', 'false');

  const pitchBlock = element('div', 'pitch');
  const noteReadout = text('output', 'pitch__note', t('pitch.none'));
  noteReadout.setAttribute('aria-live', 'off');
  const tuningReadout = text('span', 'pitch__tuning', '');
  pitchBlock.append(noteReadout, tuningReadout);

  const levelMeter = element('div', 'level');
  levelMeter.setAttribute('role', 'meter');
  levelMeter.setAttribute('aria-label', t('pitch.level'));
  levelMeter.setAttribute('aria-valuemin', '0');
  levelMeter.setAttribute('aria-valuemax', '100');
  levelMeter.setAttribute('aria-valuenow', '0');
  const levelFill = element('div', 'level__fill');
  levelMeter.append(levelFill);

  const micStatus = text('p', 'mic__status', t('mic.statusIdle'));
  micStatus.setAttribute('role', 'status');

  const micBlock = element('div', 'statusbar__mic');
  micBlock.append(micButton, micStatus);

  const legend = element('div', 'legend');
  legend.append(
    legendItem('legend__swatch--in-tune', t('trace.legendInTune')),
    legendItem('legend__swatch--off', t('trace.legendOff')),
    legendItem('legend__swatch--uncertain', t('trace.legendUncertain')),
  );

  statusBar.append(micBlock, pitchBlock, levelMeter, legend);

  // Trace and keyboard: the only two flexible blocks ------------------------
  const traceSection = element('section', 'trace');
  const canvas = document.createElement('canvas');
  canvas.className = 'trace__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${t('trace.label')} ${t('trace.readingDirection')}`);
  traceSection.append(canvas);

  const pianoSection = element('section', 'piano-section');
  const pianoRoot = element('div', '');
  pianoSection.append(pianoRoot);

  // Controls ---------------------------------------------------------------
  const controls = element('section', 'controls');

  // The input picker is the only lever a page has against filtering applied
  // upstream of the browser, so it stays next to the other audio controls rather
  // than hiding in a panel. It is populated once permission reveals device labels.
  const deviceSelect = document.createElement('select');
  deviceSelect.className = 'control__input';
  deviceSelect.id = 'input-device';
  const deviceControl = labelled('input-device', t('mic.device'), deviceSelect);
  deviceControl.hidden = true;

  const instrumentSelect = document.createElement('select');
  instrumentSelect.className = 'control__input';
  instrumentSelect.id = 'instrument';
  for (const id of INSTRUMENT_IDS) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = t(INSTRUMENT_LABEL_KEYS[id]);
    instrumentSelect.append(option);
  }

  const volumeInput = document.createElement('input');
  volumeInput.type = 'range';
  volumeInput.className = 'control__input control__input--range';
  volumeInput.id = 'volume';
  volumeInput.min = '0';
  volumeInput.max = '100';
  volumeInput.step = '1';

  const muteButton = button('button', t('piano.mute'));
  muteButton.setAttribute('aria-pressed', 'false');
  const panicButton = button('button', t('piano.panic'));

  const octaveDownButton = button('button button--icon', '−');
  octaveDownButton.setAttribute('aria-label', t('piano.octaveDown'));
  const octaveUpButton = button('button button--icon', '+');
  octaveUpButton.setAttribute('aria-label', t('piano.octaveUp'));
  const rangeReadout = text('output', 'control__value', '');

  const octaveGroup = element('div', 'control__group');
  octaveGroup.append(octaveDownButton, rangeReadout, octaveUpButton);

  controls.append(
    deviceControl,
    labelled('instrument', t('piano.instrument'), instrumentSelect),
    labelled('volume', t('piano.volume'), volumeInput),
    labelledGroup(t('piano.range'), octaveGroup),
    groupOf(muteButton, panicButton),
  );

  // Overlay panels: never part of the height budget -------------------------
  const offlineNote = text('p', 'panel__note panel__note--hidden', t('app.installedOffline'));

  const helpPanel = element('div', 'panel panel--hidden');
  helpPanel.setAttribute('role', 'dialog');
  helpPanel.setAttribute('aria-label', t('app.help'));
  const helpCloseButton = button('button button--ghost panel__close', t('app.close'));
  helpPanel.append(
    helpCloseButton,
    text('p', 'panel__lead', t('mic.consent')),
    text('p', '', t('trace.readingDirection')),
    text('p', '', t('trace.legendUncertain')),
    text('p', '', t('piano.keyboardHint')),
    text('p', '', t('mic.headphonesHint')),
    text('p', '', t('footer.privacy')),
    text('p', '', t('footer.scope')),
    offlineNote,
  );

  const diagnosticsPanel = element('div', 'panel panel--hidden panel--diagnostics');
  diagnosticsPanel.setAttribute('role', 'dialog');
  diagnosticsPanel.setAttribute('aria-label', t('diag.title'));
  const diagnosticsBody = element('dl', 'diag');
  const diagnosticsCloseButton = button('button button--ghost panel__close', t('app.close'));
  diagnosticsPanel.append(diagnosticsCloseButton, text('p', 'panel__lead', t('diag.hint')), diagnosticsBody);

  const liveRegion = element('div', 'visually-hidden');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');

  root.append(
    header,
    updateBanner,
    statusBar,
    traceSection,
    pianoSection,
    controls,
    helpPanel,
    diagnosticsPanel,
    liveRegion,
  );

  return {
    root,
    header,
    emblem,
    portalLink,
    statusBar,
    controls,
    traceSection,
    pianoSection,
    micButton,
    micStatus,
    noteReadout,
    tuningReadout,
    levelMeter,
    levelFill,
    liveRegion,
    canvas,
    pianoRoot,
    deviceSelect,
    deviceControl,
    instrumentSelect,
    volumeInput,
    muteButton,
    panicButton,
    octaveDownButton,
    octaveUpButton,
    rangeReadout,
    helpButton,
    helpPanel,
    helpCloseButton,
    diagnosticsButton,
    diagnosticsPanel,
    diagnosticsBody,
    diagnosticsCloseButton,
    updateBanner,
    updateButton,
    offlineBadge,
    offlineNote,
  };
}

/** Replaces the diagnostics rows in place; called at a throttled rate. */
export function renderDiagnostics(body: HTMLElement, rows: readonly [string, string][]): void {
  const fragment = document.createDocumentFragment();
  for (const [label, value] of rows) {
    fragment.append(text('dt', 'diag__label', label), text('dd', 'diag__value', value));
  }
  body.replaceChildren(fragment);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content: string): HTMLElementTagNameMap[K] {
  const node = element(tag, className);
  node.textContent = content;
  return node;
}

function button(className: string, label: string): HTMLButtonElement {
  const node = element('button', className);
  node.type = 'button';
  node.textContent = label;
  return node;
}

function labelled(id: string, labelText: string, control: HTMLElement): HTMLElement {
  const wrapper = element('div', 'control');
  const label = element('label', 'control__label');
  label.htmlFor = id;
  label.textContent = labelText;
  wrapper.append(label, control);
  return wrapper;
}

function labelledGroup(labelText: string, control: HTMLElement): HTMLElement {
  const wrapper = element('div', 'control');
  const group = element('span', 'control__label');
  group.id = `label-${labelText.toLowerCase().replace(/\s+/g, '-')}`;
  group.textContent = labelText;
  control.setAttribute('role', 'group');
  control.setAttribute('aria-labelledby', group.id);
  wrapper.append(group, control);
  return wrapper;
}

function groupOf(...nodes: HTMLElement[]): HTMLElement {
  const wrapper = element('div', 'control control--actions');
  wrapper.append(...nodes);
  return wrapper;
}

function legendItem(swatchClass: string, label: string): HTMLElement {
  const item = element('span', 'legend__item');
  const swatch = element('span', `legend__swatch ${swatchClass}`);
  swatch.setAttribute('aria-hidden', 'true');
  item.append(swatch, text('span', 'legend__text', label));
  return item;
}
