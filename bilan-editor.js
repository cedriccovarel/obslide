/* Édition directe des blocs du bilan, dans le repère de la slide 16:9. */
(function () {
  'use strict';

  const TEXT_BLOCKS = [
    ['.s-title h1', 'title', 'Titre'],
    ['.s-title p', 'subtitle', 'Sous-titre'],
    ['.bilan-intro', 'introduction', 'Message'],
    ['.bilan-content-heading', 'heading', 'Titre du visuel'],
    ['.bilan-note', 'note', 'Note de lecture']
  ];
  const DATA_BLOCKS = [
    ['.bilan-summary > *', 'summary', 'Bloc de synthèse', 'h2, thead th'],
    ['.bilan-band > div', 'indicator', 'Indicateur', 'span'],
    ['.bilan-rank-cards > section', 'card', 'Carte', 'h3, dt'],
    ['.bilan-figure > .bilan-table', 'table', 'Tableau', 'thead th, caption'],
    ['.bilan-chart', 'chart', 'Graphique', ''],
    ['.bilan-bars', 'bars', 'Barres', ''],
    ['.bilan-legend', 'legend', 'Légende', '.bilan-legend-label']
  ];
  const POSITION_LIMIT = 2000;
  const clamp = (value, min, max, fallback = 0) => Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value))) : fallback;
  const readPosition = value => ({
    x: clamp(value?.x, -POSITION_LIMIT, POSITION_LIMIT),
    y: clamp(value?.y, -POSITION_LIMIT, POSITION_LIMIT),
    font: clamp(value?.font ?? 100, 40, 300, 100)
  });
  const textFont = element => Number.parseFloat(getComputedStyle(element).fontSize) || 16;
  const hasText = element => Array.from(element.childNodes).some(node =>
    node.nodeType === Node.TEXT_NODE && node.textContent.trim()
  );
  const keyPart = value => encodeURIComponent(String(value || '').trim().slice(0, 140));

  function create({ slide, stage, toolbar, handle, onSave, onRender, onLayout, onText }) {
    const toggle = toolbar.querySelector('[data-bilan-editor-toggle]');
    const add = toolbar.querySelector('[data-bilan-editor-add]');
    const inspector = toolbar.querySelector('[data-bilan-editor-inspector]');
    const menu = toolbar.querySelector('[data-bilan-editor-block]');
    const font = toolbar.querySelector('[data-bilan-editor-font]');
    const x = toolbar.querySelector('[data-bilan-editor-x]');
    const y = toolbar.querySelector('[data-bilan-editor-y]');
    const reset = toolbar.querySelector('[data-bilan-editor-reset]');
    const remove = toolbar.querySelector('[data-bilan-editor-remove]');
    const fontValue = toolbar.querySelector('[data-bilan-editor-font-value]');

    let model = null;
    let enabled = false;
    let selected = '';
    let slideId = '';
    let drag = null;
    let blocks = new Map();
    let targets = new WeakMap();

    function applyPosition(block) {
      const p = block.position;
      block.element.style.transform = p.x || p.y ? `translate(${p.x}px, ${p.y}px)` : '';
    }

    function applyFont(block) {
      for (const target of block.fonts) {
        target.element.style.fontSize = block.position.font === 100
          ? target.original : `${target.size * block.position.font / 100}px`;
      }
    }

    function register(element, id, label, editable, extra = false) {
      const position = readPosition(model.canvas.positions[id]);
      const block = { element, id, position, label, fonts: [], extra };
      blocks.set(id, block);
      element.dataset.bilanBlock = id;
      applyPosition(block);
      for (const [node, key, labelText] of editable) {
        if (key && Object.hasOwn(model.canvas.labels, key)) node.textContent = model.canvas.labels[key];
        targets.set(node, { key, label: labelText });
        node.dataset.bilanEditable = '';
      }
      return block;
    }

    function editables(element, key, selector) {
      if (!selector) return [];
      return Array.from(element.querySelectorAll(selector)).map((node, index) =>
        [node, `${key}:text:${index}`, node.textContent.trim()]
      );
    }

    function prepare(id, nextModel) {
      if (slideId !== id) selected = '';
      slideId = id;
      model = nextModel;
      blocks = new Map();
      targets = new WeakMap();
      if (!model) return;

      for (const [selector, key, name] of TEXT_BLOCKS) {
        const element = slide.querySelector(selector);
        if (!element) continue;
        register(element, 'text:' + key, name, [[element, '', name]]);
        targets.set(element, { copy: key, label: name });
      }
      const scope = [model.view, model.layout, model.measure, model.basis, model.series, model.detail, model.family]
        .map(keyPart).join(':');
      for (const [selector, kind, name, textSelector] of DATA_BLOCKS) {
        const items = Array.from(slide.querySelectorAll(selector));
        const occurrences = new Map();
        items.forEach(element => {
          const caption = element.querySelector('h2, h3, span, thead th')?.textContent.trim();
          const nameKey = keyPart(caption);
          const occurrence = occurrences.get(nameKey) || 0;
          occurrences.set(nameKey, occurrence + 1);
          const key = [kind, scope, nameKey, occurrence].join(':');
          const label = caption ? `${name} · ${caption}` : name;
          register(element, key, label, editables(element, key, textSelector));
        });
      }
      for (const box of model.canvas.boxes) {
        if (typeof box.id !== 'string' || typeof box.text !== 'string') continue;
        const element = document.createElement('div');
        element.className = 'bilan-free-text';
        element.textContent = box.text;
        slide.appendChild(element);
        register(element, box.id, box.text.split('\n')[0].trim() || 'Zone de texte', [[element, '', 'Zone de texte']], true);
        targets.set(element, { box, label: 'Zone de texte' });
      }
    }

    function finish() {
      for (const block of blocks.values()) {
        const elements = [block.element, ...block.element.querySelectorAll('*')];
        block.fonts = elements.filter(element => !element.closest('svg title') &&
          (hasText(element) || element.hasAttribute('data-bilan-editable')))
          .map(element => ({ element, size: textFont(element), original: element.style.fontSize }));
      }
      for (const block of blocks.values()) applyFont(block);
      updateMode();
    }

    function refreshMenu() {
      menu.replaceChildren(new Option('Choisir un bloc', ''));
      for (const block of blocks.values()) {
        if (block.element.getClientRects().length) menu.add(new Option(block.label, block.id));
      }
      if (!Array.from(menu.options).some(option => option.value === selected)) selected = '';
      menu.value = selected;
    }

    function updateHandle() {
      const block = blocks.get(selected);
      handle.hidden = !enabled || !block || !model || !block.element.getClientRects().length;
      if (handle.hidden) return;
      const base = stage.getBoundingClientRect();
      const r = block.element.getBoundingClientRect();
      const left = Math.max(0, Math.min(base.width - handle.offsetWidth, r.left - base.left));
      const top = Math.max(0, Math.min(base.height - handle.offsetHeight, r.top - base.top - handle.offsetHeight - 4));
      handle.style.left = left + 'px';
      handle.style.top = top + 'px';
    }

    function select(id) {
      blocks.get(selected)?.element.removeAttribute('data-bilan-selected');
      selected = id;
      const block = blocks.get(id);
      menu.value = id;
      inspector.hidden = !enabled || !block;
      if (block && enabled) {
        block.element.dataset.bilanSelected = '';
        font.value = block.position.font;
        fontValue.textContent = `${block.position.font} %`;
        x.value = block.position.x;
        y.value = block.position.y;
        remove.hidden = !block.extra;
      }
      updateHandle();
    }

    function updateMode() {
      toolbar.hidden = !model;
      toggle.textContent = enabled ? 'Terminer l’édition' : 'Éditer sur la slide';
      toggle.setAttribute('aria-pressed', String(enabled));
      toolbar.querySelector('[data-bilan-editor-tools]').hidden = !enabled || !model;
      slide.classList.toggle('bilan-editing', enabled && !!model);
      for (const node of slide.querySelectorAll('[data-bilan-editable]')) {
        const target = targets.get(node);
        if (enabled && model && target) {
          node.setAttribute('contenteditable', 'plaintext-only');
          node.setAttribute('aria-label', `Modifier : ${target.label}`);
        } else {
          node.removeAttribute('contenteditable');
          node.removeAttribute('aria-label');
        }
      }
      refreshMenu();
      select(enabled ? selected : '');
    }

    function stop() {
      if (!enabled) return;
      if (slide.contains(document.activeElement)) document.activeElement.blur();
      enabled = false;
      updateMode();
    }

    function store(block) {
      const position = block.position;
      if (!position.x && !position.y && position.font === 100) delete model.canvas.positions[block.id];
      else model.canvas.positions[block.id] = { ...position };
    }

    function commit(block) {
      store(block);
      onSave();
      onLayout();
      updateHandle();
    }

    toggle.addEventListener('click', () => {
      if (enabled) stop();
      else {
        enabled = true;
        updateMode();
      }
    });
    add.addEventListener('click', () => {
      if (!model) return;
      const id = 'free:' + Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-');
      const offset = model.canvas.boxes.length % 12 * 24;
      model.canvas.boxes.push({ id, text: 'Ton texte' });
      if (offset) model.canvas.positions[id] = { x: offset, y: offset, font: 100 };
      selected = id;
      onSave();
      onRender();
      const text = blocks.get(id)?.element;
      if (text) {
        text.focus();
        const range = document.createRange();
        range.selectNodeContents(text);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
    menu.addEventListener('change', () => select(menu.value));
    font.addEventListener('input', () => {
      const block = blocks.get(selected);
      if (!block) return;
      block.position.font = clamp(font.value, 40, 300, 100);
      fontValue.textContent = `${block.position.font} %`;
      applyFont(block);
      commit(block);
    });
    for (const [input, property] of [[x, 'x'], [y, 'y']]) {
      input.addEventListener('change', () => {
        const block = blocks.get(selected);
        if (!block) return;
        block.position[property] = Math.round(clamp(input.value, -POSITION_LIMIT, POSITION_LIMIT));
        input.value = block.position[property];
        applyPosition(block);
        commit(block);
      });
    }
    reset.addEventListener('click', () => {
      const block = blocks.get(selected);
      if (!block) return;
      block.position = readPosition();
      applyPosition(block);
      applyFont(block);
      select(block.id);
      commit(block);
    });
    remove.addEventListener('click', () => {
      const block = blocks.get(selected);
      if (!block?.extra) return;
      model.canvas.boxes = model.canvas.boxes.filter(box => box.id !== block.id);
      delete model.canvas.positions[block.id];
      selected = '';
      onSave();
      onRender();
    });

    slide.addEventListener('pointerdown', event => {
      if (!enabled) return;
      const id = event.target.closest('[data-bilan-block]')?.dataset.bilanBlock;
      if (id) select(id);
    });
    slide.addEventListener('focusin', event => {
      if (!enabled) return;
      const id = event.target.closest('[data-bilan-block]')?.dataset.bilanBlock;
      if (id) select(id);
    });
    slide.addEventListener('input', event => {
      if (!enabled || !model) return;
      const target = targets.get(event.target);
      if (!target) return;
      const value = event.target.innerText.replace(/\r/g, '');
      if (target.box) target.box.text = value;
      else if (target.copy) onText(target.copy, value);
      else model.canvas.labels[target.key] = value;
      onSave();
      onLayout();
      updateHandle();
    });
    slide.addEventListener('keydown', event => {
      if (enabled && event.key === 'Escape') stop();
    });

    handle.addEventListener('pointerdown', event => {
      const block = blocks.get(selected);
      if (!block || event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      const frame = slide.querySelector('.slide-safe');
      const ratio = frame.getBoundingClientRect().width / frame.offsetWidth || 1;
      drag = { block, startX: event.clientX, startY: event.clientY, ratio, ...block.position };
      handle.classList.add('is-dragging');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag) return;
      const { block, ratio } = drag;
      block.position.x = Math.round(clamp(drag.x + (event.clientX - drag.startX) / ratio, -POSITION_LIMIT, POSITION_LIMIT));
      block.position.y = Math.round(clamp(drag.y + (event.clientY - drag.startY) / ratio, -POSITION_LIMIT, POSITION_LIMIT));
      applyPosition(block);
      select(block.id);
    });
    function endDrag() {
      if (!drag) return;
      const { block } = drag;
      drag = null;
      handle.classList.remove('is-dragging');
      commit(block);
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('lostpointercapture', endDrag);
    handle.addEventListener('keydown', event => {
      const vector = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      const block = blocks.get(selected);
      if (!vector || !block) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      block.position.x = clamp(block.position.x + vector[0] * step, -POSITION_LIMIT, POSITION_LIMIT);
      block.position.y = clamp(block.position.y + vector[1] * step, -POSITION_LIMIT, POSITION_LIMIT);
      applyPosition(block);
      select(block.id);
      commit(block);
    });
    new ResizeObserver(updateHandle).observe(stage);

    return { prepare, finish, stop, updateHandle };
  }

  window.OBSBilanEditor = { create };
})();
