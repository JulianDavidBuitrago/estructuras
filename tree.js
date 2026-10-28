/* =========================================================
   Bosque de Datos — Utilidades de árboles
   Recorridos, BST, dibujo SVG con nodos clicables.
   ========================================================= */

const TreeKit = (() => {
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Recorridos ---------- */
  function traversal(t, order) {
    const out = [];
    const pre = n => { if (!n) return; out.push(n.v); pre(n.l); pre(n.r); };
    const ino = n => { if (!n) return; ino(n.l); out.push(n.v); ino(n.r); };
    const post = n => { if (!n) return; post(n.l); post(n.r); out.push(n.v); };
    if (order === 'pre') pre(t);
    else if (order === 'in') ino(t);
    else if (order === 'post') post(t);
    else if (order === 'level') {
      const q = t ? [t] : [];
      while (q.length) { const n = q.shift(); out.push(n.v); if (n.l) q.push(n.l); if (n.r) q.push(n.r); }
    }
    return out;
  }

  const ORDER_NAMES = { pre: 'Preorden', in: 'Inorden', post: 'Postorden', level: 'Por niveles' };

  /* ---------- BST ---------- */
  function bstInsert(t, v) {
    const node = { v, l: null, r: null };
    if (!t) return node;
    let cur = t;
    while (true) {
      if (v < cur.v) { if (!cur.l) { cur.l = node; break; } cur = cur.l; }
      else { if (!cur.r) { cur.r = node; break; } cur = cur.r; }
    }
    return t;
  }

  function bstFrom(values) {
    let t = null;
    values.forEach(v => { t = bstInsert(t, v); });
    return t;
  }

  /* Dónde debería ir v: devuelve { parent: valor, side: 'l'|'r' } */
  function bstTarget(t, v) {
    let cur = t;
    while (true) {
      const side = v < cur.v ? 'l' : 'r';
      if (!cur[side]) return { parent: cur.v, side };
      cur = cur[side];
    }
  }

  function findNode(t, v) {
    if (!t) return null;
    if (t.v === v) return t;
    return findNode(t.l, v) || findNode(t.r, v);
  }

  function serialize(t) {
    if (!t) return '·';
    return `(${t.v} ${serialize(t.l)} ${serialize(t.r)})`;
  }

  function count(t) { return t ? 1 + count(t.l) + count(t.r) : 0; }

  function clone(t) { return t ? { v: t.v, l: clone(t.l), r: clone(t.r) } : null; }

  /* ---------- Layout ----------
     Posición x = índice inorden (incluyendo "espacios" opcionales),
     posición y = profundidad. Evita cruces y se adapta a cualquier forma. */
  function layout(t, withSlots) {
    const items = [];
    const edges = [];
    let idx = 0;
    let maxDepth = 0;

    function walk(n, depth, parentItem, side) {
      if (!n) {
        if (withSlots && parentItem) {
          const item = { slot: true, parent: parentItem.v, side, x: idx++, y: depth };
          items.push(item);
          edges.push({ a: parentItem, b: item, slot: true });
          maxDepth = Math.max(maxDepth, depth);
        }
        return;
      }
      const item = { v: n.v, x: 0, y: depth, leaf: !n.l && !n.r };
      walk(n.l, depth + 1, item, 'l');
      item.x = idx++;
      items.push(item);
      maxDepth = Math.max(maxDepth, depth);
      if (parentItem) edges.push({ a: parentItem, b: item });
      walk(n.r, depth + 1, item, 'r');
    }
    walk(t, 0, null, null);
    return { items, edges, cols: idx, rows: maxDepth + 1 };
  }

  /* ---------- Dibujo ----------
     opts: { slots, onNode(v, g), onSlot(slotItem, g), className } */
  function draw(container, t, opts = {}) {
    const { items, edges, cols, rows } = layout(t, !!opts.slots);
    const UX = opts.slots ? 50 : 64;
    const UY = 78;
    const R = 21;
    const PAD = 34;
    const W = Math.max(cols * UX + PAD * 2 - UX, 160);
    const H = (rows - 1) * UY + PAD * 2;
    const px = it => PAD + it.x * UX;
    const py = it => PAD + it.y * UY;

    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'tree-svg ' + (opts.className || ''));
    svg.style.maxWidth = Math.min(W * 1.25, 920) + 'px';
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Árbol binario');

    const gEdges = document.createElementNS(SVGNS, 'g');
    edges.forEach(e => {
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', px(e.a)); line.setAttribute('y1', py(e.a));
      line.setAttribute('x2', px(e.b)); line.setAttribute('y2', py(e.b));
      line.setAttribute('class', e.slot ? 'edge edge-slot' : 'edge');
      gEdges.appendChild(line);
    });
    svg.appendChild(gEdges);

    const map = new Map();
    items.forEach(it => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('transform', `translate(${px(it)},${py(it)})`);
      if (it.slot) {
        g.setAttribute('class', 'slot');
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `Espacio ${it.side === 'l' ? 'izquierdo' : 'derecho'} de ${it.parent}`);
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('r', 14);
        const tx = document.createElementNS(SVGNS, 'text');
        tx.setAttribute('dy', '0.35em');
        tx.textContent = '+';
        g.append(c, tx);
        if (opts.onSlot) {
          g.addEventListener('click', () => opts.onSlot(it, g));
          g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opts.onSlot(it, g); } });
        }
      } else {
        g.setAttribute('class', 'node' + (opts.onNode ? ' clickable' : '') + (it.y === 0 ? ' root' : ''));
        g.dataset.v = it.v;
        const halo = document.createElementNS(SVGNS, 'circle');
        halo.setAttribute('r', R + 6);
        halo.setAttribute('class', 'halo');
        const c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('r', R);
        c.setAttribute('class', 'body');
        const tx = document.createElementNS(SVGNS, 'text');
        tx.setAttribute('dy', '0.35em');
        tx.textContent = it.v;
        const badge = document.createElementNS(SVGNS, 'g');
        badge.setAttribute('class', 'badge');
        badge.setAttribute('transform', `translate(${R - 2},${-R + 2})`);
        const bc = document.createElementNS(SVGNS, 'circle');
        bc.setAttribute('r', 10);
        const bt = document.createElementNS(SVGNS, 'text');
        bt.setAttribute('dy', '0.35em');
        badge.append(bc, bt);
        g.append(halo, c, tx, badge);
        if (opts.onNode) {
          g.setAttribute('tabindex', '0');
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', `Nodo ${it.v}`);
          g.addEventListener('click', () => opts.onNode(it.v, g));
          g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opts.onNode(it.v, g); } });
        }
        map.set(String(it.v), g);
      }
      svg.appendChild(g);
    });

    container.innerHTML = '';
    container.appendChild(svg);
    return {
      svg,
      node: v => map.get(String(v)),
      setBadge(v, text) {
        const g = map.get(String(v));
        if (!g) return;
        g.querySelector('.badge text').textContent = text ?? '';
        g.classList.toggle('has-badge', text !== null && text !== undefined && text !== '');
      }
    };
  }

  return { traversal, ORDER_NAMES, bstInsert, bstFrom, bstTarget, findNode, serialize, count, clone, draw };
})();
