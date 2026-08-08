/**
 * Builds the single-screen free-practice layout (item_001, item_005) and exposes the
 * elements the controller drives. All copy comes from the English catalogue.
 */

import { INSTRUMENT_IDS, type InstrumentId } from '../audio/instruments';
import { t } from '../i18n';

const INSTRUMENT_LABEL_KEYS: Record<InstrumentId, 'piano.instrumentStudioGrand' | 'piano.instrumentSoftPiano' | 'piano.instrumentWarmOrgan'> = {
  'studio-grand': 'piano.instrumentStudioGrand',
  'soft-piano': 'piano.instrumentSoftPiano',
  'warm-organ': 'piano.instrumentWarmOrgan',
};

export interface AppView {
  micButton: HTMLButtonElement;
  micStatus: HTMLParagraphElement;
  noteReadout: HTMLElement;
  tuningReadout: HTMLElement;
  levelMeter: HTMLElement;
  levelFill: HTMLElement;
  liveRegion: HTMLElement;
  canvas: HTMLCanvasElement;
  pianoRoot: HTMLElement;
  instrumentSelect: HTMLSelectElement;
  volumeInput: HTMLInputElement;
  muteButton: HTMLButtonElement;
  panicButton: HTMLButtonElement;
  octaveDownButton: HTMLButtonElement;
  octaveUpButton: HTMLButtonElement;
  rangeReadout: HTMLElement;
  updateBanner: HTMLElement;
  updateButton: HTMLButtonElement;
  offlineBadge: HTMLElement;
  offlineNote: HTMLElement;
}

export function renderApp(root: HTMLElement): AppView {
  root.replaceChildren();

  const header = element('header', 'app__header');
  const brand = element('div', 'app__brand');
  brand.append(text('h1', 'app__title', t('app.name')), text('p', 'app__tagline', t('app.tagline')));
  const offlineBadge = text('span', 'badge', t('app.offlineBadge'));
  offlineBadge.title = t('app.offlineHint');
  header.append(brand, offlineBadge);

  const updateBanner = element('div', 'banner banner--hidden');
  updateBanner.setAttribute('role', 'status');
  const updateButton = button('banner__action', t('app.updateAction'));
  updateBanner.append(text('span', 'banner__text', t('app.updateAvailable')), updateButton);

  // Live pitch panel -------------------------------------------------------
  const pitchPanel = element('section', 'panel panel--pitch');
  pitchPanel.setAttribute('aria-label', t('pitch.label'));

  const noteBlock = element('div', 'pitch');
  const noteReadout = text('output', 'pitch__note', t('pitch.none'));
  noteReadout.setAttribute('aria-live', 'off');
  const tuningReadout = text('span', 'pitch__tuning', '');
  noteBlock.append(text('span', 'pitch__label', t('pitch.label')), noteReadout, tuningReadout);

  const micBlock = element('div', 'mic');
  const micButton = button('button button--primary', t('mic.start'));
  micButton.setAttribute('aria-pressed', 'false');
  const micStatus = text('p', 'mic__status', t('mic.statusIdle')) as HTMLParagraphElement;
  micStatus.setAttribute('role', 'status');
  const levelMeter = element('div', 'level');
  levelMeter.setAttribute('role', 'meter');
  levelMeter.setAttribute('aria-label', t('pitch.level'));
  levelMeter.setAttribute('aria-valuemin', '0');
  levelMeter.setAttribute('aria-valuemax', '100');
  levelMeter.setAttribute('aria-valuenow', '0');
  const levelFill = element('div', 'level__fill');
  levelMeter.append(levelFill);
  micBlock.append(micButton, micStatus, levelMeter, text('p', 'mic__consent', t('mic.consent')));

  pitchPanel.append(noteBlock, micBlock);

  // Trace ------------------------------------------------------------------
  const traceSection = element('section', 'trace');
  const canvas = document.createElement('canvas');
  canvas.className = 'trace__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', t('trace.label'));
  const legend = element('div', 'legend');
  legend.append(
    legendItem('legend__swatch--in-tune', t('trace.legendInTune')),
    legendItem('legend__swatch--off', t('trace.legendOff')),
    legendItem('legend__swatch--uncertain', t('trace.legendUncertain')),
    text('span', 'legend__direction', t('trace.readingDirection')),
  );
  traceSection.append(canvas, legend);

  // Piano ------------------------------------------------------------------
  const pianoSection = element('section', 'piano-section');
  const pianoRoot = element('div', '');
  pianoSection.append(pianoRoot);

  // Controls ---------------------------------------------------------------
  const controls = element('section', 'controls');

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
  volumeInput.className = 'control__input';
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
    labelled('instrument', t('piano.instrument'), instrumentSelect),
    labelled('volume', t('piano.volume'), volumeInput),
    labelledGroup(t('piano.range'), octaveGroup),
    groupOf(muteButton, panicButton),
  );

  // Filled in once the service worker controls the page, so the offline promise is
  // only claimed when it is actually true (item_001 AC2).
  const offlineNote = text('p', 'app__hint app__hint--hidden', t('app.installedOffline'));

  const footer = element('footer', 'app__footer');
  footer.append(
    offlineNote,
    text('p', '', t('footer.privacy')),
    text('p', '', t('footer.scope')),
    text('p', 'app__hint', t('piano.keyboardHint')),
    text('p', 'app__hint', t('mic.headphonesHint')),
  );

  const liveRegion = element('div', 'visually-hidden');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');

  root.append(header, updateBanner, pitchPanel, traceSection, pianoSection, controls, footer, liveRegion);

  return {
    micButton,
    micStatus,
    noteReadout,
    tuningReadout,
    levelMeter,
    levelFill,
    liveRegion,
    canvas,
    pianoRoot,
    instrumentSelect,
    volumeInput,
    muteButton,
    panicButton,
    octaveDownButton,
    octaveUpButton,
    rangeReadout,
    updateBanner,
    updateButton,
    offlineBadge,
    offlineNote,
  };
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
  item.append(swatch, document.createTextNode(label));
  return item;
}
