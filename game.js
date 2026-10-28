/* =========================================================
   Bosque de Datos — Motor del juego
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- Configuración ---------------- */
  const XP_PER_EX = 100;
  const HINT_COST = 25;
  const ERROR_COST = 15;
  const MIN_XP = 10;
  const STORE_KEY = 'bosqueDeDatos.v1';
  const RANKS = [
    [0, '🌰 Semilla'], [300, '🌱 Brote'], [900, '🌿 Arbusto'],
    [1700, '🌳 Árbol joven'], [2700, '🌲 Roble'], [3800, '🦉 Guardián del Bosque']
  ];

  /* ---------------- Utilidades ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $('#app');

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    children.flat().forEach(c => {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Resaltado sencillo de sintaxis Python */
  const PY_RE = /(#.*$)|("[^"\n]*"|'[^'\n]*')|\b(def|class|return|if|else|elif|while|for|in|not|and|or|is|import|from|raise|None|True|False|lambda|pass)\b|\b(print|len|max|min|float|list|range|deque|self)\b|\b(\d+)\b/gm;
  function highlight(code) {
    return escapeHtml(code).replace(PY_RE, (m, com, str, kw, bi, num) => {
      if (com) return `<span class="t-com">${com}</span>`;
      if (str) return `<span class="t-str">${str}</span>`;
      if (kw) return `<span class="t-kw">${kw}</span>`;
      if (bi) return `<span class="t-bi">${bi}</span>`;
      if (num) return `<span class="t-num">${num}</span>`;
      return m;
    });
  }

  function codeBlock(code) {
    return h('pre', { class: 'code', html: highlight(code) });
  }

  /* ---------------- Estado persistente ---------------- */
  const defaultState = () => ({ levels: {}, exam: null, sound: true, teacher: false, seenHelp: false });
  let state = defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* almacenamiento no disponible */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* sin almacenamiento */ }
    renderTop();
  }

  function totalXP() {
    let xp = 0;
    Object.values(state.levels).forEach(l => { xp += l.best || 0; });
    if (state.exam) xp += Math.round((state.exam.bestGrade || 0) * 200);
    return xp;
  }

  function rankFor(xp) {
    let r = RANKS[0][1];
    RANKS.forEach(([min, name]) => { if (xp >= min) r = name; });
    return r;
  }

  const levelState = id => state.levels[id] || { done: false, best: 0, stars: 0 };
  const isUnlocked = idx => state.teacher || idx === 0 || levelState(LEVELS[idx - 1].id).done;
  const examUnlocked = () => state.teacher || LEVELS.every(l => levelState(l.id).done);

  /* ---------------- Barra superior ---------------- */
  function renderTop() {
    const xp = totalXP();
    $('#xp').textContent = `⚡ ${xp} XP`;
    $('#rank').textContent = rankFor(xp);
    $('#btn-sound').textContent = state.sound ? '🔊' : '🔇';
  }
  $('#brand').addEventListener('click', () => showHome());
  $('#btn-help').addEventListener('click', () => showHelp());
  $('#btn-sound').addEventListener('click', () => { state.sound = !state.sound; save(); if (state.sound) sfx('ok'); });

  /* ---------------- Sonido ---------------- */
  let actx = null;
  function sfx(kind) {
    if (!state.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const seq = {
        ok: [[660, 0], [990, 0.08]],
        bad: [[220, 0], [160, 0.1]],
        click: [[520, 0]],
        win: [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.32]],
        hint: [[440, 0], [550, 0.07]]
      }[kind] || [[440, 0]];
      seq.forEach(([f, t]) => {
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = kind === 'bad' ? 'sawtooth' : 'triangle';
        o.frequency.value = f;
        const start = actx.currentTime + t;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        o.connect(g).connect(actx.destination);
        o.start(start); o.stop(start + 0.2);
      });
    } catch (e) { /* audio no disponible */ }
  }

  /* ---------------- Toast y confeti ---------------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function confetti() {
    const colors = ['#5df2a3', '#ffd166', '#5ec8ff', '#ff7aa2', '#b18cff'];
    const box = h('div', { class: 'confetti no-print' });
    for (let i = 0; i < 80; i++) {
      const p = h('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.6 + 's';
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4000);
  }

  function setView(node) {
    app.innerHTML = '';
    app.appendChild(node);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* =========================================================
     WIDGETS DE EJERCICIO
     Cada widget recibe (ex, ctx) y retorna:
     { el, needsCheck, check() -> {ok, msg}, reveal(), lock() }
     ctx: { exam, success(), fail(msg) }
     ========================================================= */
  const Widgets = {};

  /* ----- Opción múltiple ----- */
  Widgets.mc = (ex, ctx) => {
    let chosen = null;
    let locked = false;
    const order = shuffle(ex.options.map((_, i) => i));
    const letters = 'ABCD';
    const list = h('div', { class: 'mc-list' });
    const buttons = order.map((origIdx, pos) => {
      const b = h('button', { class: 'mc-opt', type: 'button' },
        h('span', { class: 'mc-letter' }, letters[pos]),
        h('span', { class: 'mc-text', html: ex.options[origIdx] }));
      b.addEventListener('click', () => {
        if (locked) return;
        chosen = origIdx;
        buttons.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        sfx('click');
      });
      b.dataset.idx = origIdx;
      list.appendChild(b);
      return b;
    });
    return {
      el: list, needsCheck: true,
      check() {
        if (chosen === null) return { ok: null, msg: 'Selecciona una opción.' };
        const ok = chosen === ex.answer;
        if (!ok && !ctx.exam) buttons.find(b => +b.dataset.idx === chosen).classList.add('wrong');
        return { ok };
      },
      reveal() { buttons.forEach(b => { if (+b.dataset.idx === ex.answer) b.classList.add('correct'); }); },
      lock() { locked = true; list.classList.add('locked'); }
    };
  };

  /* ----- Completar código ----- */
  const norm = s => String(s).replace(/\s+/g, '').replace(/["']/g, '"');
  Widgets.fill = (ex) => {
    const parts = ex.code.split('____');
    const pre = h('pre', { class: 'code fill-code' });
    let input = null;
    parts.forEach((p, i) => {
      pre.appendChild(h('span', { html: highlight(p) }));
      if (i < parts.length - 1) {
        input = h('input', { class: 'blank', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Espacio en blanco' });
        input.style.width = Math.max(6, ex.answers[0].length + 2) + 'ch';
        pre.appendChild(input);
      }
    });
    setTimeout(() => input && input.focus(), 60);
    return {
      el: pre, needsCheck: true, input,
      check() {
        const val = input.value.trim();
        if (!val) return { ok: null, msg: 'Escribe tu respuesta en el espacio resaltado.' };
        const ok = ex.answers.some(a => norm(a) === norm(val));
        input.classList.toggle('wrong', !ok);
        return { ok };
      },
      reveal() { input.value = ex.answers[0]; input.classList.remove('wrong'); input.classList.add('correct'); },
      lock() { input.disabled = true; }
    };
  };

  /* ----- Ordenar líneas ----- */
  Widgets.order = (ex) => {
    const items = ex.lines.map((text, i) => ({ text, i }));
    let current;
    do { current = shuffle(items); } while (ex.lines.length > 1 && current.every((it, k) => it.i === k));
    const list = h('ol', { class: 'order-list' });
    let dragFrom = null;
    let locked = false;

    function render() {
      list.innerHTML = '';
      current.forEach((it, pos) => {
        const indent = it.text.match(/^ */)[0].length;
        const li = h('li', { class: 'order-item', draggable: locked ? 'false' : 'true' },
          h('span', { class: 'grip', 'aria-hidden': 'true' }, '⋮⋮'),
          h('code', { class: 'order-code', html: highlight(it.text.trimStart()) }),
          h('span', { class: 'order-btns' },
            h('button', { type: 'button', class: 'mini', 'aria-label': 'Subir', disabled: pos === 0 || locked, onclick: () => move(pos, pos - 1) }, '▲'),
            h('button', { type: 'button', class: 'mini', 'aria-label': 'Bajar', disabled: pos === current.length - 1 || locked, onclick: () => move(pos, pos + 1) }, '▼')));
        li.querySelector('.order-code').style.paddingLeft = (indent * 0.6) + 'ch';
        li.addEventListener('dragstart', e => { dragFrom = pos; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(pos)); } catch (_) { } });
        li.addEventListener('dragend', () => li.classList.remove('dragging'));
        li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('over'); });
        li.addEventListener('dragleave', () => li.classList.remove('over'));
        li.addEventListener('drop', e => { e.preventDefault(); li.classList.remove('over'); if (dragFrom !== null) move(dragFrom, pos); dragFrom = null; });
        list.appendChild(li);
      });
    }
    function move(from, to) {
      if (locked || to < 0 || to >= current.length || from === to) return;
      const [x] = current.splice(from, 1);
      current.splice(to, 0, x);
      sfx('click');
      render();
    }
    render();
    const seqOk = () => {
      const texts = current.map(it => it.text);
      if (texts.every((t, k) => t === ex.lines[k])) return true;
      return (ex.alts || []).some(alt => alt.every((idx, k) => ex.lines[idx] === texts[k]));
    };
    return {
      el: h('div', { class: 'order-wrap' }, h('p', { class: 'muted small' }, 'Arrastra las líneas o usa las flechas ▲ ▼. La sangría ya está incluida.'), list),
      needsCheck: true,
      check() {
        const ok = seqOk();
        if (!ok) {
          const correctPos = current.filter((it, k) => it.text === ex.lines[k]).length;
          return { ok, msg: `Hay ${correctPos} de ${ex.lines.length} líneas en su posición correcta.` };
        }
        return { ok };
      },
      reveal() { current = items.slice(); render(); list.classList.add('solved'); },
      lock() { locked = true; render(); }
    };
  };

  /* ----- Seleccionar nodos ----- */
  Widgets.select = (ex) => {
    const sel = new Set();
    let locked = false;
    const box = h('div', { class: 'tree-box' });
    const counter = h('span', { class: 'chip' }, 'Seleccionados: 0');
    const view = TreeKit.draw(box, ex.tree, {
      onNode: (v, g) => {
        if (locked) return;
        const key = String(v);
        if (sel.has(key)) sel.delete(key); else sel.add(key);
        g.classList.toggle('selected', sel.has(key));
        g.classList.remove('wrong');
        counter.textContent = `Seleccionados: ${sel.size}`;
        sfx('click');
      }
    });
    const answer = new Set(ex.answer.map(String));
    return {
      el: h('div', {}, box, h('div', { class: 'row-center' }, counter)),
      needsCheck: true,
      check() {
        if (!sel.size) return { ok: null, msg: 'Haz clic en al menos un nodo.' };
        const ok = sel.size === answer.size && [...sel].every(v => answer.has(v));
        if (!ok) {
          const hits = [...sel].filter(v => answer.has(v)).length;
          const extra = sel.size - hits;
          return { ok, msg: `Aciertos: ${hits} de ${answer.size}${extra ? ` · ${extra} nodo(s) sobrante(s)` : ''}.` };
        }
        return { ok };
      },
      reveal() {
        TreeKit.traversal(ex.tree, 'pre').forEach(v => {
          const g = view.node(v);
          g.classList.toggle('selected', answer.has(String(v)));
          if (answer.has(String(v))) g.classList.add('correct');
        });
      },
      lock() { locked = true; box.classList.add('locked'); }
    };
  };

  /* ----- Recorrido interactivo ----- */
  Widgets.traverse = (ex, ctx) => {
    const expected = TreeKit.traversal(ex.tree, ex.order).map(String);
    const seq = [];
    let locked = false;
    const box = h('div', { class: 'tree-box' });
    const trail = h('div', { class: 'trail' });
    const undo = h('button', { class: 'btn ghost small', type: 'button', onclick: () => undoLast() }, '↶ Deshacer');
    const label = h('span', { class: 'chip accent' }, TreeKit.ORDER_NAMES[ex.order]);
    const view = TreeKit.draw(box, ex.tree, { onNode: (v, g) => click(String(v), g) });

    function renderTrail() {
      trail.innerHTML = '';
      expected.forEach((_, i) => trail.appendChild(h('span', { class: 'trail-cell' + (seq[i] ? ' filled' : '') }, seq[i] || '')));
    }
    function click(v, g) {
      if (locked || seq.includes(v)) return;
      if (!ctx.exam) {
        const want = expected[seq.length];
        if (v !== want) {
          g.classList.remove('shake'); void g.getBBox(); g.classList.add('shake', 'wrong');
          setTimeout(() => g.classList.remove('wrong'), 600);
          ctx.fail(`El nodo <b>${v}</b> no va en la posición ${seq.length + 1}.`);
          return;
        }
      }
      seq.push(v);
      g.classList.add('visited');
      view.setBadge(v, seq.length);
      sfx('click');
      renderTrail();
      if (!ctx.exam && seq.length === expected.length) ctx.success();
    }
    function undoLast() {
      if (locked || !seq.length) return;
      const v = seq.pop();
      view.node(v).classList.remove('visited');
      view.setBadge(v, '');
      renderTrail();
    }
    renderTrail();
    return {
      el: h('div', {}, h('div', { class: 'row-center gap' }, label, ctx.exam ? undo : null), box, trail),
      needsCheck: !!ctx.exam,
      check() {
        if (seq.length < expected.length) return { ok: null, msg: `Te faltan ${expected.length - seq.length} nodo(s) por visitar.` };
        return { ok: seq.every((v, i) => v === expected[i]) };
      },
      reveal() {
        seq.length = 0;
        expected.forEach((v, i) => { seq.push(v); view.node(v).classList.add('visited'); view.setBadge(v, i + 1); });
        renderTrail();
      },
      lock() { locked = true; box.classList.add('locked'); undo.disabled = true; }
    };
  };

  /* ----- Construir BST ----- */
  Widgets.bstbuild = (ex, ctx) => {
    let tree = TreeKit.bstFrom(ex.start);
    let k = 0;
    let locked = false;
    const box = h('div', { class: 'tree-box' });
    const queue = h('div', { class: 'value-queue' });
    const reset = h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (locked) return; tree = TreeKit.bstFrom(ex.start); k = 0; render(); } }, '↺ Reiniciar');
    const correctTree = TreeKit.bstFrom([...ex.start, ...ex.values]);

    function render(lastV) {
      queue.innerHTML = '';
      queue.appendChild(h('span', { class: 'muted small' }, 'Por insertar:'));
      ex.values.forEach((v, i) => queue.appendChild(h('span', { class: 'qv' + (i === k ? ' current' : '') + (i < k ? ' done' : '') }, v)));
      const done = k >= ex.values.length;
      const view = TreeKit.draw(box, tree, { slots: !done && !locked, onSlot: (slot, g) => place(slot, g) });
      if (lastV !== undefined) { const n = view.node(lastV); if (n) n.classList.add('pop'); }
    }
    function place(slot, g) {
      if (locked || k >= ex.values.length) return;
      const v = ex.values[k];
      if (!ctx.exam) {
        const target = TreeKit.bstTarget(tree, v);
        if (target.parent !== slot.parent || target.side !== slot.side) {
          g.classList.add('wrong');
          setTimeout(() => g.classList.remove('wrong'), 600);
          const lado = slot.side === 'l' ? 'izquierdo' : 'derecho';
          ctx.fail(`El <b>${v}</b> no va como hijo ${lado} de <b>${slot.parent}</b>. Compara desde la raíz.`);
          return;
        }
      }
      const parent = TreeKit.findNode(tree, slot.parent);
      parent[slot.side] = { v, l: null, r: null };
      k++;
      sfx('click');
      render(v);
      if (!ctx.exam && k >= ex.values.length) ctx.success();
    }
    render();
    return {
      el: h('div', {}, h('div', { class: 'row-center gap' }, queue, ctx.exam ? reset : null), box),
      needsCheck: !!ctx.exam,
      check() {
        if (k < ex.values.length) return { ok: null, msg: `Te faltan ${ex.values.length - k} valor(es) por insertar.` };
        return { ok: TreeKit.serialize(tree) === TreeKit.serialize(correctTree) };
      },
      reveal() { tree = TreeKit.clone(correctTree); k = ex.values.length; render(); },
      lock() { locked = true; reset.disabled = true; render(); }
    };
  };

  /* ----- Simulador de pila / cola ----- */
  Widgets.sim = (ex, ctx) => {
    const isStack = ex.kind === 'pila';
    const items = [];
    let step = 0;
    let locked = false;
    const opsBox = h('ol', { class: 'ops' });
    const stage = h('div', { class: 'sim-stage ' + (isStack ? 'stack' : 'queue') });
    const hint = h('p', { class: 'sim-hint' });
    const runBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => run() }, '▶ Ejecutar operación');

    const opText = op => op[0] === 'in'
      ? (isStack ? `pila.append(${op[1]})` : `cola.append(${op[1]})`)
      : (isStack ? 'pila.pop()' : 'cola.popleft()');

    ex.ops.forEach(op => opsBox.appendChild(h('li', { html: `<code>${opText(op)}</code>` })));

    function render() {
      [...opsBox.children].forEach((li, i) => { li.className = i < step ? 'done' : i === step ? 'current' : ''; });
      stage.innerHTML = '';
      stage.appendChild(h('span', { class: 'sim-label start' }, isStack ? 'base' : 'frente ←'));
      items.forEach((v, i) => {
        const b = h('button', { type: 'button', class: 'cell' }, v);
        b.addEventListener('click', () => pick(i, b));
        stage.appendChild(b);
      });
      if (!items.length) stage.appendChild(h('span', { class: 'muted small empty' }, '(vacía)'));
      stage.appendChild(h('span', { class: 'sim-label end' }, isStack ? 'tope' : '← final'));
      const op = ex.ops[step];
      if (!op) {
        hint.innerHTML = `✅ Operaciones terminadas. Estado final: <code>[${items.join(', ')}]</code>`;
        runBtn.disabled = true;
      } else if (op[0] === 'in') {
        hint.innerHTML = `Presiona <b>Ejecutar</b> para ${isStack ? 'apilar' : 'encolar'} el <b>${op[1]}</b>.`;
        runBtn.disabled = locked;
      } else {
        hint.innerHTML = `Haz clic en el elemento que sale con <code>${opText(op)}</code>.`;
        runBtn.disabled = true;
      }
      stage.classList.toggle('awaiting', !!op && op[0] === 'out');
    }
    function run() {
      const op = ex.ops[step];
      if (locked || !op || op[0] !== 'in') return;
      items.push(op[1]); step++; sfx('click'); render();
      stage.lastElementChild.previousElementSibling.classList.add('enter');
    }
    function pick(i, b) {
      const op = ex.ops[step];
      if (locked || !op || op[0] !== 'out') return;
      const correct = isStack ? items.length - 1 : 0;
      if (i !== correct) {
        b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500);
        ctx.fail(isStack ? 'En una pila solo sale el elemento del <b>tope</b>.' : 'En una cola solo sale el elemento del <b>frente</b>.');
        return;
      }
      b.classList.add('leave');
      sfx('click');
      setTimeout(() => {
        items.splice(i, 1); step++; render();
        if (step >= ex.ops.length) ctx.success();
      }, 260);
    }
    render();
    return {
      el: h('div', { class: 'sim' }, h('div', { class: 'sim-grid' }, h('div', {}, h('h4', {}, 'Operaciones'), opsBox), h('div', {}, h('h4', {}, isStack ? 'Pila' : 'Cola'), stage, hint, h('div', { class: 'row-center' }, runBtn)))),
      needsCheck: false,
      check() { return { ok: step >= ex.ops.length }; },
      reveal() {
        while (step < ex.ops.length) {
          const op = ex.ops[step];
          if (op[0] === 'in') items.push(op[1]); else if (isStack) items.pop(); else items.shift();
          step++;
        }
        render();
      },
      lock() { locked = true; runBtn.disabled = true; }
    };
  };

  const TYPE_LABEL = {
    mc: '🔘 Opción múltiple', fill: '✏️ Completa el código', order: '🧩 Ordena el código',
    select: '👆 Selecciona nodos', traverse: '🧭 Recorrido', bstbuild: '🌱 Construye el BST', sim: '🎛️ Simulador'
  };

  /* =========================================================
     VISTA: INICIO
     ========================================================= */
  function showHome() {
    const xp = totalXP();
    const doneCount = LEVELS.filter(l => levelState(l.id).done).length;
    const nextIdx = LEVELS.findIndex((l, i) => isUnlocked(i) && !levelState(l.id).done);

    const hero = h('section', { class: 'hero' },
      h('div', { class: 'hero-text' },
        h('p', { class: 'eyebrow' }, 'Estructuras de datos en Python'),
        h('h1', {}, 'Explora el ', h('span', { class: 'grad' }, 'Bosque de Datos')),
        h('p', { class: 'lead' }, 'Domina nodos, pilas, colas y, sobre todo, árboles. Supera 7 niveles con ejercicios interactivos, usa pistas cuando las necesites y demuestra lo aprendido en la evaluación final.'),
        h('div', { class: 'hero-actions' },
          h('button', { class: 'btn primary lg', onclick: () => nextIdx >= 0 ? showLevelIntro(nextIdx) : (examUnlocked() ? showExamIntro() : showLevelIntro(0)) },
            doneCount === 0 ? '🚀 Empezar a jugar' : nextIdx >= 0 ? '▶ Continuar' : '🏆 Ir a la evaluación'),
          h('button', { class: 'btn ghost lg', onclick: () => showHelp() }, '📖 Cómo jugar'))),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, heroTree()));

    const stats = h('section', { class: 'stats' },
      stat('⚡', xp, 'XP total'),
      stat('🗺️', `${doneCount}/${LEVELS.length}`, 'Niveles completados'),
      stat('⭐', LEVELS.reduce((s, l) => s + (levelState(l.id).stars || 0), 0) + '/' + LEVELS.length * 3, 'Estrellas'),
      stat('🎓', state.exam ? state.exam.bestGrade.toFixed(1) : '—', 'Mejor nota final'));

    const map = h('section', { class: 'map' }, h('h2', { class: 'section-title' }, 'Mapa de niveles'));
    const grid = h('div', { class: 'level-grid' });
    LEVELS.forEach((lvl, i) => {
      const ls = levelState(lvl.id);
      const unlocked = isUnlocked(i);
      const card = h('button', {
        class: 'level-card' + (ls.done ? ' done' : '') + (!unlocked ? ' locked' : '') + (i === nextIdx ? ' next' : ''),
        disabled: !unlocked, onclick: () => showLevelIntro(i)
      },
        h('div', { class: 'lc-top' }, h('span', { class: 'lc-icon' }, unlocked ? lvl.icon : '🔒'), h('span', { class: 'lc-num' }, `Nivel ${lvl.id}`)),
        h('h3', {}, lvl.title),
        h('p', {}, lvl.desc),
        h('div', { class: 'lc-foot' },
          h('span', { class: 'stars' }, [1, 2, 3].map(s => h('span', { class: s <= (ls.stars || 0) ? 'on' : '' }, '★'))),
          h('span', { class: 'muted small' }, `${lvl.exercises.length} retos`)));
      grid.appendChild(card);
    });
    const exU = examUnlocked();
    grid.appendChild(h('button', { class: 'level-card exam-card' + (!exU ? ' locked' : ''), disabled: !exU, onclick: () => showExamIntro() },
      h('div', { class: 'lc-top' }, h('span', { class: 'lc-icon' }, exU ? '🏆' : '🔒'), h('span', { class: 'lc-num' }, 'Final')),
      h('h3', {}, 'Evaluación final'),
      h('p', {}, exU ? `${EXAM.questions.length} retos difíciles · ${EXAM.minutes} min · sin pistas` : 'Completa los 7 niveles para desbloquearla.'),
      h('div', { class: 'lc-foot' }, h('span', { class: 'muted small' }, state.exam ? `Mejor nota: ${state.exam.bestGrade.toFixed(1)} / 5.0` : 'Nota de 1.0 a 5.0'))));
    map.appendChild(grid);

    setView(h('div', { class: 'view home' }, hero, stats, map));
    if (!state.seenHelp) {
      state.seenHelp = true; save();
      setTimeout(() => toast('👋 ¿Primera vez? Revisa <b>Cómo jugar</b> antes de empezar.'), 600);
    }
  }

  function stat(icon, value, label) {
    return h('div', { class: 'stat' }, h('span', { class: 'stat-icon' }, icon), h('div', {}, h('b', {}, String(value)), h('span', {}, label)));
  }

  function heroTree() {
    const wrap = h('div', { class: 'hero-tree' });
    TreeKit.draw(wrap, T(50, T(30, T(20), T(40)), T(70, T(60), T(80))), { className: 'deco' });
    return wrap;
  }

  /* =========================================================
     VISTA: INTRODUCCIÓN DEL NIVEL
     ========================================================= */
  function showLevelIntro(idx) {
    const lvl = LEVELS[idx];
    const counts = {};
    lvl.exercises.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    setView(h('div', { class: 'view narrow' },
      h('button', { class: 'back', onclick: () => showHome() }, '← Mapa'),
      h('div', { class: 'card intro' },
        h('div', { class: 'intro-head' }, h('span', { class: 'big-icon' }, lvl.icon), h('div', {}, h('p', { class: 'eyebrow' }, `Nivel ${lvl.id} de ${LEVELS.length}`), h('h1', {}, lvl.title))),
        h('h3', {}, '📘 Lo que necesitas saber'),
        h('div', { class: 'brief', html: lvl.brief }),
        h('h3', {}, '🐍 Ejemplo en Python'),
        codeBlock(lvl.snippet),
        h('h3', {}, '🎯 Retos de este nivel'),
        h('div', { class: 'chips' }, Object.entries(counts).map(([t, n]) => h('span', { class: 'chip' }, `${TYPE_LABEL[t]} × ${n}`))),
        h('p', { class: 'muted small' }, `Cada reto vale hasta ${XP_PER_EX} XP. Cada pista cuesta ${HINT_COST} XP y cada error ${ERROR_COST} XP.`),
        h('div', { class: 'row-end' }, h('button', { class: 'btn primary lg', onclick: () => startLevel(idx) }, 'Comenzar nivel →')))));
  }

  /* =========================================================
     VISTA: JUGAR UN NIVEL
     ========================================================= */
  function startLevel(idx) {
    const run = { idx, ex: 0, results: [] };
    playExercise(run);
  }

  function playExercise(run) {
    const lvl = LEVELS[run.idx];
    const ex = lvl.exercises[run.ex];
    let hintsUsed = 0;
    let errors = 0;
    let finished = false;

    const potential = () => Math.max(MIN_XP, XP_PER_EX - hintsUsed * HINT_COST - errors * ERROR_COST);

    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    const hintBox = h('div', { class: 'hints' });
    const xpChip = h('span', { class: 'chip xp' });
    const updateXp = () => { xpChip.textContent = `⚡ ${potential()} XP en juego`; };

    const ctx = {
      exam: false,
      success: () => onSuccess(),
      fail: msg => onFail(msg)
    };
    const widget = Widgets[ex.type](ex, ctx);

    const hintBtn = h('button', { class: 'btn hint', type: 'button', onclick: () => useHint() }, `💡 Pista (${ex.hints.length})`);
    const checkBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => check() }, '✔ Comprobar');
    const solveBtn = h('button', { class: 'btn ghost', type: 'button', hidden: true, onclick: () => giveUp() }, '👁 Ver solución');
    const nextBtn = h('button', { class: 'btn success', type: 'button', hidden: true, onclick: () => next() },
      run.ex + 1 < lvl.exercises.length ? 'Siguiente reto →' : 'Terminar nivel 🏁');

    if (!widget.needsCheck) checkBtn.hidden = true;
    if (widget.input) widget.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); finished ? next() : check(); } });

    function useHint() {
      if (finished || hintsUsed >= ex.hints.length) return;
      hintBox.appendChild(h('div', { class: 'hint-item', html: `<b>Pista ${hintsUsed + 1}:</b> ${ex.hints[hintsUsed]}` }));
      hintsUsed++;
      sfx('hint');
      hintBtn.textContent = hintsUsed >= ex.hints.length ? '💡 Sin más pistas' : `💡 Pista (${ex.hints.length - hintsUsed})`;
      hintBtn.disabled = hintsUsed >= ex.hints.length;
      updateXp();
    }
    function check() {
      if (finished) return;
      const r = widget.check();
      if (r.ok === null) { setFeedback('info', r.msg); return; }
      if (r.ok) onSuccess(); else onFail(r.msg || 'Aún no es correcto. Revisa y vuelve a intentarlo.');
    }
    function onFail(msg) {
      errors++;
      sfx('bad');
      updateXp();
      setFeedback('bad', `❌ ${msg}`);
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      if (errors >= 2) solveBtn.hidden = false;
    }
    function onSuccess() {
      if (finished) return;
      finished = true;
      const gained = potential();
      run.results.push({ xp: gained, hints: hintsUsed, errors });
      sfx('ok');
      widget.reveal(); widget.lock();
      setFeedback('ok', `<b>✅ ¡Correcto! +${gained} XP</b><p>${ex.explain}</p>`);
      endButtons();
    }
    function giveUp() {
      if (finished) return;
      finished = true;
      run.results.push({ xp: 0, hints: hintsUsed, errors, revealed: true });
      widget.reveal(); widget.lock();
      setFeedback('info', `<b>👁 Solución</b><p>${ex.explain}</p><p class="small muted">Este reto no suma XP. Puedes repetir el nivel para mejorar tu puntaje.</p>`);
      endButtons();
    }
    function endButtons() {
      checkBtn.hidden = true; hintBtn.hidden = true; solveBtn.hidden = true; nextBtn.hidden = false;
      setTimeout(() => nextBtn.focus(), 50);
    }
    function setFeedback(kind, html) {
      feedback.className = 'feedback show ' + kind;
      feedback.innerHTML = html;
    }
    function next() {
      run.ex++;
      if (run.ex < lvl.exercises.length) playExercise(run); else finishLevel(run);
    }

    updateXp();
    const progress = h('div', { class: 'progress' }, lvl.exercises.map((_, i) =>
      h('span', { class: i < run.ex ? (run.results[i].revealed ? 'seg revealed' : 'seg done') : i === run.ex ? 'seg current' : 'seg' })));

    const card = h('div', { class: 'card exercise' },
      h('div', { class: 'ex-head' }, h('span', { class: 'chip' }, TYPE_LABEL[ex.type]), xpChip),
      h('h2', { class: 'ex-q', html: ex.q }),
      ex.tree && ex.type !== 'select' && ex.type !== 'traverse' ? h('div', { class: 'tree-box static' }) : null,
      ex.code && ex.type !== 'fill' ? codeBlock(ex.code) : null,
      widget.el,
      hintBox,
      feedback,
      h('div', { class: 'actions' }, hintBtn, h('span', { class: 'spacer' }), solveBtn, checkBtn, nextBtn));

    setView(h('div', { class: 'view narrow' },
      h('div', { class: 'play-head' },
        h('button', { class: 'back', onclick: () => { if (confirm('¿Salir del nivel? Perderás el progreso de esta partida.')) showHome(); } }, '← Salir'),
        h('div', { class: 'play-title' }, h('span', {}, `${lvl.icon} Nivel ${lvl.id} · ${lvl.title}`), h('span', { class: 'muted small' }, `Reto ${run.ex + 1} de ${lvl.exercises.length}`))),
      progress, card));

    const staticBox = card.querySelector('.tree-box.static');
    if (staticBox) TreeKit.draw(staticBox, ex.tree);
  }

  function finishLevel(run) {
    const lvl = LEVELS[run.idx];
    const earned = run.results.reduce((s, r) => s + r.xp, 0);
    const max = lvl.exercises.length * XP_PER_EX;
    const ratio = earned / max;
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
    const prev = levelState(lvl.id);
    const improved = earned > (prev.best || 0);
    state.levels[lvl.id] = { done: true, best: Math.max(prev.best || 0, earned), stars: Math.max(prev.stars || 0, stars) };
    save();
    sfx('win'); confetti();

    const hints = run.results.reduce((s, r) => s + r.hints, 0);
    const errors = run.results.reduce((s, r) => s + r.errors, 0);
    const nextIdx = run.idx + 1;
    const msg = stars === 3 ? '¡Dominio total! 🌟' : stars === 2 ? '¡Muy bien! Vas por buen camino.' : 'Nivel superado. Repítelo para ganar más estrellas.';

    setView(h('div', { class: 'view narrow' },
      h('div', { class: 'card summary' },
        h('p', { class: 'eyebrow' }, `Nivel ${lvl.id} completado`),
        h('h1', {}, lvl.title),
        h('div', { class: 'big-stars' }, [1, 2, 3].map(s => h('span', { class: s <= stars ? 'on' : '', style: `animation-delay:${s * 0.18}s` }, '★'))),
        h('p', { class: 'lead' }, msg),
        h('div', { class: 'stats compact' },
          stat('⚡', `${earned}/${max}`, 'XP obtenido'),
          stat('💡', hints, 'Pistas usadas'),
          stat('❌', errors, 'Errores')),
        improved && prev.best ? h('p', { class: 'chip accent' }, `🎉 Nuevo récord: superaste tus ${prev.best} XP anteriores`) : null,
        h('div', { class: 'row-center gap wrap' },
          h('button', { class: 'btn ghost', onclick: () => startLevel(run.idx) }, '↺ Repetir nivel'),
          h('button', { class: 'btn ghost', onclick: () => showHome() }, '🗺️ Mapa'),
          nextIdx < LEVELS.length
            ? h('button', { class: 'btn primary', onclick: () => showLevelIntro(nextIdx) }, `Nivel ${nextIdx + 1} →`)
            : h('button', { class: 'btn primary', onclick: () => showExamIntro() }, '🏆 Evaluación final')))));
  }

  /* =========================================================
     EVALUACIÓN FINAL
     ========================================================= */
  function showExamIntro() {
    if (!examUnlocked()) { toast('🔒 Completa los 7 niveles para desbloquear la evaluación.'); return; }
    const name = h('input', { class: 'text-input', type: 'text', placeholder: 'Nombre completo', autocomplete: 'name' });
    const code = h('input', { class: 'text-input', type: 'text', placeholder: 'Código estudiantil (opcional)' });
    setView(h('div', { class: 'view narrow' },
      h('button', { class: 'back', onclick: () => showHome() }, '← Mapa'),
      h('div', { class: 'card intro exam-intro' },
        h('div', { class: 'intro-head' }, h('span', { class: 'big-icon' }, '🏆'), h('div', {}, h('p', { class: 'eyebrow' }, 'Nivel difícil'), h('h1', {}, EXAM.title))),
        h('ul', { class: 'rules' },
          h('li', {}, `📝 ${EXAM.questions.length} retos que combinan todo lo visto, con énfasis en árboles.`),
          h('li', {}, `⏱️ Tienes ${EXAM.minutes} minutos. Al agotarse el tiempo, la evaluación se entrega sola.`),
          h('li', {}, '🚫 No hay pistas y cada reto se responde una sola vez.'),
          h('li', {}, '🧭 En recorridos y BST no verás si aciertas mientras juegas: construye tu respuesta y presiona Responder.'),
          h('li', {}, '🎓 La nota va de 1.0 a 5.0. Se aprueba con 3.0. Al final verás la retroalimentación de cada reto.')),
        h('div', { class: 'form-row' }, name, code),
        h('div', { class: 'row-end' }, h('button', {
          class: 'btn primary lg', onclick: () => {
            if (!name.value.trim()) { name.focus(); name.classList.add('wrong'); toast('Escribe tu nombre para identificar el resultado.'); return; }
            startExam(name.value.trim(), code.value.trim());
          }
        }, 'Iniciar evaluación ⏱️')))));
    name.focus();
  }

  function startExam(student, studentCode) {
    const run = { i: 0, answers: [], start: Date.now(), student, studentCode, timer: null, over: false };
    const deadline = run.start + EXAM.minutes * 60 * 1000;
    run.deadline = deadline;
    run.timer = setInterval(() => {
      const left = deadline - Date.now();
      const el = $('#exam-timer');
      if (el) {
        const m = Math.max(0, Math.floor(left / 60000));
        const s = Math.max(0, Math.floor((left % 60000) / 1000));
        el.textContent = `⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        el.classList.toggle('danger', left < 120000);
        const bar = $('#exam-timebar');
        if (bar) bar.style.width = Math.max(0, left / (EXAM.minutes * 600)) + '%';
      }
      if (left <= 0) { toast('⏰ Se acabó el tiempo. Evaluación entregada.'); finishExam(run); }
    }, 500);
    examQuestion(run);
  }

  function examQuestion(run) {
    const ex = EXAM.questions[run.i];
    const ctx = { exam: true, success() { }, fail() { } };
    const widget = Widgets[ex.type](ex, ctx);
    const feedback = h('div', { class: 'feedback' });
    const submit = h('button', { class: 'btn primary', type: 'button', onclick: () => answer() }, run.i + 1 < EXAM.questions.length ? 'Responder y continuar →' : 'Responder y entregar 🏁');
    const skip = h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (confirm('¿Dejar este reto sin responder? Contará como incorrecto.')) record(false, true); } }, 'Omitir');
    if (widget.input) widget.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); answer(); } });

    function answer() {
      const r = widget.check();
      if (r.ok === null) { feedback.className = 'feedback show info'; feedback.innerHTML = r.msg; return; }
      record(!!r.ok, false);
    }
    function record(ok, skipped) {
      if (run.over) return;
      run.answers[run.i] = { ok, skipped };
      sfx('click');
      run.i++;
      if (run.i < EXAM.questions.length) examQuestion(run); else finishExam(run);
    }

    const progress = h('div', { class: 'progress' }, EXAM.questions.map((_, i) => h('span', { class: i < run.i ? 'seg done neutral' : i === run.i ? 'seg current' : 'seg' })));
    const card = h('div', { class: 'card exercise exam' },
      h('div', { class: 'ex-head' }, h('span', { class: 'chip' }, TYPE_LABEL[ex.type]), h('span', { class: 'chip' }, ex.topic)),
      h('h2', { class: 'ex-q', html: ex.q }),
      ex.tree && ex.type !== 'select' && ex.type !== 'traverse' ? h('div', { class: 'tree-box static' }) : null,
      ex.code && ex.type !== 'fill' ? codeBlock(ex.code) : null,
      widget.el, feedback,
      h('div', { class: 'actions' }, skip, h('span', { class: 'spacer' }), submit));

    setView(h('div', { class: 'view narrow' },
      h('div', { class: 'play-head' },
        h('div', { class: 'play-title' }, h('span', {}, `🏆 Evaluación final · ${run.student}`), h('span', { class: 'muted small' }, `Reto ${run.i + 1} de ${EXAM.questions.length}`)),
        h('span', { class: 'timer', id: 'exam-timer' }, '⏱️ --:--')),
      h('div', { class: 'timebar' }, h('span', { id: 'exam-timebar' })),
      progress, card));
    const staticBox = card.querySelector('.tree-box.static');
    if (staticBox) TreeKit.draw(staticBox, ex.tree);
  }

  function finishExam(run) {
    if (run.over) return;
    run.over = true;
    clearInterval(run.timer);
    const n = EXAM.questions.length;
    const results = EXAM.questions.map((q, i) => ({ q, ok: !!(run.answers[i] && run.answers[i].ok), skipped: !run.answers[i] || run.answers[i].skipped }));
    const correct = results.filter(r => r.ok).length;
    const grade = Math.round((1 + 4 * correct / n) * 10) / 10;
    const passed = grade >= EXAM.passGrade;
    const usedMs = Math.min(Date.now(), run.deadline) - run.start;
    const used = `${Math.floor(usedMs / 60000)} min ${Math.floor((usedMs % 60000) / 1000)} s`;

    state.exam = { bestGrade: Math.max(state.exam ? state.exam.bestGrade : 0, grade), last: grade, date: new Date().toISOString() };
    save();
    if (passed) { sfx('win'); confetti(); } else sfx('bad');

    const topics = {};
    results.forEach(r => {
      const t = r.q.topic;
      topics[t] = topics[t] || { ok: 0, total: 0 };
      topics[t].total++; if (r.ok) topics[t].ok++;
    });

    const date = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

    setView(h('div', { class: 'view narrow' },
      h('div', { class: 'card summary report' },
        h('p', { class: 'eyebrow' }, 'Resultado de la evaluación final'),
        h('h1', {}, run.student),
        h('p', { class: 'muted' }, [run.studentCode ? `Código ${run.studentCode} · ` : '', date, ` · Tiempo usado: ${used}`].join('')),
        h('div', { class: 'grade ' + (passed ? 'pass' : 'fail') },
          h('span', { class: 'grade-num' }, grade.toFixed(1)),
          h('span', { class: 'grade-label' }, passed ? 'APROBADO' : 'NO APROBADO'),
          h('span', { class: 'muted small' }, `${correct} de ${n} retos correctos · escala 1.0 – 5.0`)),
        h('h3', {}, '📊 Desempeño por tema'),
        h('div', { class: 'topic-bars' }, Object.entries(topics).map(([t, v]) =>
          h('div', { class: 'topic-row' },
            h('span', { class: 'topic-name' }, t),
            h('span', { class: 'topic-bar' }, h('span', { style: `width:${(v.ok / v.total) * 100}%` })),
            h('span', { class: 'topic-val' }, `${v.ok}/${v.total}`)))),
        h('h3', {}, '🔍 Retroalimentación reto por reto'),
        h('ol', { class: 'review' }, results.map(r =>
          h('li', { class: r.ok ? 'ok' : 'bad' },
            h('div', { class: 'review-q' }, h('span', { class: 'mark' }, r.ok ? '✔' : r.skipped ? '–' : '✘'), h('span', { html: r.q.q })),
            h('p', { class: 'review-exp', html: (r.q.type === 'traverse' ? `<b>Secuencia correcta:</b> <code>${TreeKit.traversal(r.q.tree, r.q.order).join(' → ')}</code><br>` : '') + r.q.explain })))),
        h('div', { class: 'row-center gap wrap no-print' },
          h('button', { class: 'btn ghost', onclick: () => window.print() }, '🖨️ Imprimir / guardar PDF'),
          h('button', { class: 'btn ghost', onclick: () => showHome() }, '🗺️ Mapa'),
          h('button', { class: 'btn primary', onclick: () => showExamIntro() }, '↺ Presentar de nuevo')))));
  }

  /* =========================================================
     VISTA: INSTRUCCIONES
     ========================================================= */
  function showHelp() {
    const demoTree = T('B', T('A'), T('C'));
    const teacherToggle = h('input', { type: 'checkbox', id: 'teacher', checked: state.teacher });
    teacherToggle.addEventListener('change', () => { state.teacher = teacherToggle.checked; save(); toast(state.teacher ? '🔓 Todos los niveles desbloqueados' : '🔒 Desbloqueo por progreso activado'); });

    const howTo = [
      ['🔘', 'Opción múltiple', 'Lee la pregunta y el código (si lo hay). Haz clic en una opción y presiona <b>Comprobar</b>. Las opciones cambian de orden cada vez.'],
      ['✏️', 'Completa el código', 'Escribe en el espacio resaltado lo que falta (una palabra, un número o una expresión). Presiona <b>Enter</b> o <b>Comprobar</b>. No importan los espacios.'],
      ['🧩', 'Ordena el código', 'Arrastra las líneas o usa las flechas ▲ ▼ hasta que el programa quede en el orden correcto. La sangría ya viene puesta: úsala como pista.'],
      ['👆', 'Selecciona nodos', 'Haz clic en los nodos que cumplen la condición (se ponen verdes). Vuelve a hacer clic para quitar uno. Luego presiona <b>Comprobar</b>.'],
      ['🧭', 'Recorrido', 'Haz clic en los nodos <b>en el orden exacto</b> del recorrido pedido. Cada nodo correcto recibe un número. Si te equivocas, el nodo tiembla en rojo y pierdes XP.'],
      ['🌱', 'Construye el BST', 'Arriba ves los valores por insertar (el actual está resaltado). Haz clic en el círculo <b>+</b> donde debe quedar. Compara siempre desde la raíz: menor a la izquierda, mayor a la derecha.'],
      ['🎛️', 'Simulador de pila / cola', 'Sigue la lista de operaciones. Con <b>Ejecutar</b> se agrega el valor; cuando la operación sea <code>pop()</code> o <code>popleft()</code>, haz clic en el elemento que debe salir.']
    ];

    setView(h('div', { class: 'view narrow' },
      h('button', { class: 'back', onclick: () => showHome() }, '← Mapa'),
      h('div', { class: 'card help' },
        h('p', { class: 'eyebrow' }, 'Guía del jugador'),
        h('h1', {}, '📖 Cómo jugar'),
        h('p', { class: 'lead' }, 'Bosque de Datos es un juego para practicar estructuras de datos en Python. Avanzas por 7 niveles, ganas experiencia (XP) y al final presentas una evaluación de nivel difícil.'),

        h('h2', {}, '1. Tu recorrido'),
        h('ol', { class: 'steps' },
          h('li', {}, h('b', {}, 'Elige un nivel en el mapa. '), 'Al principio solo está abierto el Nivel 1; cada nivel que completas desbloquea el siguiente.'),
          h('li', {}, h('b', {}, 'Lee la introducción. '), 'Cada nivel empieza con la teoría esencial y un ejemplo en Python. Léela con calma: los retos se basan en ella.'),
          h('li', {}, h('b', {}, 'Resuelve los retos. '), 'Puedes intentar cuantas veces quieras. Al acertar verás una explicación de por qué esa es la respuesta.'),
          h('li', {}, h('b', {}, 'Gana estrellas. '), 'Al terminar el nivel recibes de 1 a 3 estrellas según tu XP. Puedes repetirlo para mejorar: se guarda tu mejor resultado.'),
          h('li', {}, h('b', {}, 'Presenta la evaluación final. '), 'Se desbloquea al completar los 7 niveles.')),

        h('h2', {}, '2. Los niveles'),
        h('div', { class: 'level-mini' }, LEVELS.map(l => h('div', {}, h('span', {}, l.icon), h('b', {}, `${l.id}. ${l.title}`), h('span', { class: 'muted small' }, l.desc)))),

        h('h2', {}, '3. Puntaje, pistas y errores'),
        h('div', { class: 'score-grid' },
          h('div', {}, h('b', {}, `⚡ ${XP_PER_EX} XP`), h('span', {}, 'es lo máximo que vale cada reto.')),
          h('div', {}, h('b', {}, `💡 −${HINT_COST} XP`), h('span', {}, 'por cada pista. Las pistas aparecen de a una, de la más general a la más concreta.')),
          h('div', {}, h('b', {}, `❌ −${ERROR_COST} XP`), h('span', {}, `por cada intento fallido. Si aciertas, siempre ganas al menos ${MIN_XP} XP.`)),
          h('div', {}, h('b', {}, '👁 Ver solución'), h('span', {}, 'aparece tras 2 errores. Muestra la respuesta y la explicación, pero el reto da 0 XP.'))),
        h('p', {}, 'Con la XP subes de rango: ', RANKS.map(r => r[1]).join(' → '), '.'),

        h('h2', {}, '4. Cómo resolver cada tipo de reto'),
        h('div', { class: 'howto' }, howTo.map(([i, t, d]) => h('div', { class: 'howto-item' }, h('span', { class: 'howto-icon' }, i), h('div', {}, h('b', {}, t), h('p', { html: d }))))),

        h('h2', {}, '5. Recordatorio rápido: recorridos'),
        h('div', { class: 'cheat' },
          h('div', { class: 'tree-box mini', id: 'help-tree' }),
          h('table', { class: 'cheat-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Recorrido'), h('th', {}, 'Regla'), h('th', {}, 'Resultado'))),
            h('tbody', {},
              ['pre', 'in', 'post', 'level'].map(o => h('tr', {},
                h('td', {}, TreeKit.ORDER_NAMES[o]),
                h('td', {}, { pre: 'Raíz → Izq → Der', in: 'Izq → Raíz → Der', post: 'Izq → Der → Raíz', level: 'Nivel por nivel, de izq. a der.' }[o]),
                h('td', {}, h('code', {}, TreeKit.traversal(demoTree, o).join(' ')))))))),

        h('h2', {}, '6. Evaluación final'),
        h('ul', {},
          h('li', {}, `${EXAM.questions.length} retos de nivel difícil, ${EXAM.minutes} minutos, sin pistas.`),
          h('li', {}, 'Cada reto se responde una sola vez y no se muestra si acertaste hasta el final.'),
          h('li', {}, 'En recorridos puedes usar «Deshacer» y en el BST puedes «Reiniciar» antes de responder.'),
          h('li', {}, 'La nota va de 1.0 a 5.0 y se aprueba con 3.0. Al final verás tu desempeño por tema, la explicación de cada reto y podrás imprimir o guardar el resultado en PDF.')),

        h('h2', {}, '7. Consejos'),
        h('ul', {},
          h('li', {}, 'Ten papel a mano: dibujar el árbol o la pila te ayuda a no perderte.'),
          h('li', {}, 'Antes de pedir una pista, intenta razonar el caso más pequeño posible.'),
          h('li', {}, 'Lee siempre la explicación después de cada reto, incluso si acertaste.'),
          h('li', {}, 'Tu progreso se guarda automáticamente en este navegador.')),

        h('div', { class: 'teacher-box' },
          h('h3', {}, '👩‍🏫 Opciones para el docente'),
          h('label', { class: 'switch' }, teacherToggle, h('span', {}, 'Modo docente: desbloquear todos los niveles y la evaluación')),
          h('button', {
            class: 'btn ghost small', onclick: () => {
              if (confirm('¿Borrar todo el progreso guardado en este navegador?')) { state = defaultState(); state.seenHelp = true; save(); toast('Progreso reiniciado.'); showHome(); }
            }
          }, '🗑️ Reiniciar progreso')),

        h('div', { class: 'row-center' }, h('button', { class: 'btn primary lg', onclick: () => showHome() }, '¡Entendido, a jugar! 🚀')))));
    TreeKit.draw($('#help-tree'), demoTree);
  }

  /* ---------------- Arranque ---------------- */
  renderTop();
  showHome();
})();
