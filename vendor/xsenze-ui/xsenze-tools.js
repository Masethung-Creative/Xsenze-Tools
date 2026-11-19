/*! Xsenze UI Kit tools v0.10.0 | MIT */
var XsenzeTools = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target2, all) => {
    for (var name in all)
      __defProp(target2, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/js/tools/index.js
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default,
    tools: () => plugin
  });

  // src/js/shared.js
  var $ = (sel, root = document) => root.querySelector(sel);
  var $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  var ready = (el, key) => {
    const k = `xz${key}Ready`;
    if (el.dataset[k]) return true;
    el.dataset[k] = "1";
    return false;
  };
  var fire = (el, type, detail, cancelable = false) => el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }));
  var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var clamp = (v2, min = 0, max = 1) => Math.min(max, Math.max(min, v2));
  var uid = 0;
  var nextId = (p) => `xz-${p}-s${++uid}`;
  var query = (q) => typeof matchMedia === "function" ? matchMedia(q) : { matches: false, addEventListener() {
  } };
  var reducedQuery = query("(prefers-reduced-motion: reduce)");
  var fineQuery = query("(pointer: fine)");
  var motionOn = () => !reducedQuery.matches && document.documentElement.getAttribute("data-xz-motion") !== "off";
  var motionListeners = /* @__PURE__ */ new Set();
  var notifyMotion = () => {
    const on = motionOn();
    motionListeners.forEach((cb) => cb(on));
  };
  reducedQuery.addEventListener("change", notifyMotion);
  var store = {
    get(key, fallback = null) {
      try {
        const v2 = localStorage.getItem(key);
        return v2 === null ? fallback : JSON.parse(v2);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
      }
    }
  };
  var isRtl = (el = document.documentElement) => getComputedStyle(el).direction === "rtl";
  function dirKey(e, el) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return null;
    const forward = e.key === "ArrowRight";
    return forward !== isRtl(el) ? "next" : "prev";
  }
  var apple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
  function parseShortcut(s) {
    if (!s || s === "none") return null;
    const parts = String(s).toLowerCase().split("+").map((p) => p.trim()).filter(Boolean);
    const key = parts.pop();
    const has = (m) => parts.includes(m);
    return { key, mod: has("mod"), ctrl: has("ctrl"), meta: has("meta") || has("cmd"), alt: has("alt"), shift: has("shift") };
  }
  function shortcutLabel(s) {
    const sc = typeof s === "string" ? parseShortcut(s) : s;
    if (!sc) return "";
    const mac = apple();
    const parts = [];
    if (sc.mod || sc.meta) parts.push(mac ? "\u2318" : sc.mod ? "Ctrl" : "Win");
    if (sc.ctrl) parts.push(mac ? "\u2303" : "Ctrl");
    if (sc.alt) parts.push(mac ? "\u2325" : "Alt");
    if (sc.shift) parts.push(mac ? "\u21E7" : "Shift");
    parts.push(sc.key.length === 1 ? sc.key.toUpperCase() : sc.key[0].toUpperCase() + sc.key.slice(1));
    return mac ? parts.join("") : parts.join(" ");
  }
  function ariaShortcut(s) {
    const sc = typeof s === "string" ? parseShortcut(s) : s;
    if (!sc) return "";
    const key = sc.key.length === 1 ? sc.key.toUpperCase() : sc.key[0].toUpperCase() + sc.key.slice(1);
    const extra = [sc.alt && "Alt", sc.shift && "Shift"].filter(Boolean);
    const join = (m) => [...m, ...extra, key].join("+");
    if (sc.mod) return `${join(["Control"])} ${join(["Meta"])}`;
    return join([sc.ctrl && "Control", sc.meta && "Meta"].filter(Boolean));
  }

  // src/js/tools/split.js
  function initSplits(root) {
    var _a, _b, _c;
    for (const el of $$("[data-xz-split]", root)) {
      if (ready(el, "Split")) continue;
      const panes = $$(":scope > .xz-split__pane", el);
      if (panes.length < 2) continue;
      const rows = el.classList.contains("xz-split--rows");
      const name = el.getAttribute("data-xz-split");
      const key = name ? `xz-split:${name}` : "";
      const min = Number((_a = el.dataset.xzMin) != null ? _a : 15);
      const max = Number((_b = el.dataset.xzMax) != null ? _b : 85);
      let handle = el.querySelector(":scope > .xz-split__handle");
      if (!handle) {
        handle = Object.assign(document.createElement("div"), { className: "xz-split__handle" });
        panes[0].after(handle);
      }
      (_c = panes[0]).id || (_c.id = nextId("pane"));
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-orientation", rows ? "horizontal" : "vertical");
      handle.setAttribute("aria-controls", panes[0].id);
      handle.setAttribute("aria-valuemin", "0");
      handle.setAttribute("aria-valuemax", "100");
      if (!handle.hasAttribute("aria-label") && !handle.hasAttribute("aria-labelledby")) handle.setAttribute("aria-label", el.dataset.xzLabel || "Resize panes");
      handle.tabIndex = 0;
      const start = parseFloat(getComputedStyle(el).getPropertyValue("--xz-split")) || 50;
      let size = clamp(Number(key ? store.get(key, start) : start) || start, min, max);
      let before = size;
      const set = (value, { save = true, emit = true } = {}) => {
        const folded = el.classList.contains("is-collapsed");
        size = folded ? 0 : Math.round(clamp(value, min, max) * 10) / 10;
        el.style.setProperty("--xz-split", `${size}%`);
        handle.setAttribute("aria-valuenow", String(Math.round(size)));
        handle.setAttribute("aria-valuetext", folded ? "Folded away" : `${Math.round(size)}%`);
        if (save && key && !folded) store.set(key, size);
        if (emit) fire(el, "xz:resize", { size, collapsed: folded });
      };
      const collapse = () => {
        if (el.classList.contains("is-collapsed")) return;
        before = size;
        el.classList.add("is-collapsed");
        set(0, { save: false });
      };
      const restore = () => {
        if (!el.classList.contains("is-collapsed")) return;
        el.classList.remove("is-collapsed");
        set(before);
      };
      const toggle = () => el.classList.contains("is-collapsed") ? restore() : collapse();
      handle.addEventListener("keydown", (e) => {
        var _a2;
        const step = e.shiftKey ? 10 : 2;
        let next = null;
        if (rows) next = (_a2 = { ArrowDown: size + step, ArrowUp: size - step }[e.key]) != null ? _a2 : null;
        else {
          const d = dirKey(e, el);
          if (d) next = d === "next" ? size + step : size - step;
        }
        if (e.key === "Home") next = min;
        if (e.key === "End") next = max;
        if (e.key === "Enter") {
          e.preventDefault();
          toggle();
          return;
        }
        if (next === null) return;
        e.preventDefault();
        el.classList.remove("is-collapsed");
        set(next);
      });
      handle.addEventListener("dblclick", toggle);
      handle.addEventListener("pointerdown", (e) => {
        var _a2;
        if (e.button !== 0) return;
        e.preventDefault();
        handle.focus({ preventScroll: true });
        (_a2 = handle.setPointerCapture) == null ? void 0 : _a2.call(handle, e.pointerId);
        el.classList.add("is-dragging");
        const move = (ev) => {
          const r = el.getBoundingClientRect();
          const at = rows ? (ev.clientY - r.top) / r.height : (isRtl(el) ? r.right - ev.clientX : ev.clientX - r.left) / r.width;
          el.classList.remove("is-collapsed");
          set(at * 100, { save: false });
        };
        const end = () => {
          el.classList.remove("is-dragging");
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
          if (key) store.set(key, size);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      });
      el.xzSplit = { set: (v2) => (el.classList.remove("is-collapsed"), set(v2)), get: () => size, collapse, restore, toggle };
      set(size, { save: false, emit: false });
    }
  }

  // src/js/tools/menubar.js
  var usable = (list) => $$(":scope > li > .xz-menu__item, :scope > li > .xz-menu__group > li > .xz-menu__item", list).filter((i) => !i.disabled);
  var labelOf = (item) => item.dataset.action || [...item.childNodes].filter((n) => !(n.nodeType === 1 && n.classList.contains("xz-menu__shortcut"))).map((n) => n.textContent).join("").trim();
  function setupItem(item) {
    if (!item.hasAttribute("role")) item.setAttribute("role", "menuitem");
    if (item.tagName === "BUTTON") item.type = "button";
    item.tabIndex = -1;
    const sc = item.getAttribute("data-xz-shortcut");
    if (sc && !item.querySelector(".xz-menu__shortcut")) {
      const k = Object.assign(document.createElement("kbd"), { className: "xz-menu__shortcut", textContent: shortcutLabel(sc) });
      k.setAttribute("aria-hidden", "true");
      item.append(k);
      item.setAttribute("aria-keyshortcuts", ariaShortcut(sc));
    }
    if (/^menuitem(checkbox|radio)$/.test(item.getAttribute("role")) && !item.hasAttribute("aria-checked")) item.setAttribute("aria-checked", "false");
  }
  function setupList(list, parent) {
    list.setAttribute("role", "menu");
    list.hidden = true;
    list.id || (list.id = nextId("menu"));
    parent.id || (parent.id = nextId("menuitem"));
    list.setAttribute("aria-labelledby", parent.id);
    parent.setAttribute("aria-haspopup", "menu");
    parent.setAttribute("aria-expanded", "false");
    parent.xzSub = list;
    list.xzParent = parent;
    for (const li of $$(":scope > li", list)) {
      if (li.classList.contains("xz-menu__separator")) {
        li.setAttribute("role", "separator");
        continue;
      }
      li.setAttribute("role", "none");
      const group = li.querySelector(":scope > .xz-menu__group");
      if (group) {
        group.setAttribute("role", "group");
        for (const g of $$(":scope > li", group)) {
          g.setAttribute("role", "none");
          const item2 = g.querySelector(":scope > .xz-menu__item");
          if (item2) setupItem(item2);
        }
        continue;
      }
      const item = li.querySelector(":scope > .xz-menu__item");
      if (!item) continue;
      setupItem(item);
      const sub = li.querySelector(":scope > .xz-menu__list");
      if (sub) setupList(sub, item);
    }
  }
  function position(list, anchor, beside) {
    Object.assign(list.style, { left: "0px", top: "0px", right: "auto", bottom: "auto" });
    const a = anchor.getBoundingClientRect();
    const p = list.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const rtl = isRtl(anchor);
    let left;
    let top;
    if (beside) {
      left = rtl ? a.left - p.width + 2 : a.right - 2;
      if (!rtl && left + p.width > vw - 8) left = a.left - p.width + 2;
      if (rtl && left < 8) left = a.right - 2;
      top = Math.min(a.top - 5, vh - p.height - 8);
    } else {
      left = rtl ? a.right - p.width : a.left;
      top = a.bottom;
      if (top + p.height > vh - 8 && a.top - p.height > 8) top = a.top - p.height;
    }
    list.style.left = `${Math.max(8, Math.min(left, vw - p.width - 8))}px`;
    list.style.top = `${Math.max(8, top)}px`;
  }
  function initMenubars(root) {
    for (const bar of $$("[data-xz-menubar]", root)) {
      if (ready(bar, "Menubar")) continue;
      bar.setAttribute("role", "menubar");
      const tops = [];
      for (const li of $$(":scope > li", bar)) {
        li.setAttribute("role", "none");
        const t = li.querySelector(":scope > .xz-menubar__trigger");
        if (!t) continue;
        t.setAttribute("role", "menuitem");
        if (t.tagName === "BUTTON") t.type = "button";
        t.tabIndex = -1;
        const list = li.querySelector(":scope > .xz-menu__list");
        if (list) setupList(list, t);
        tops.push(t);
      }
      if (!tops.length) continue;
      tops[0].tabIndex = 0;
      let current = null;
      const focusTop = (t) => {
        for (const x of tops) x.tabIndex = x === t ? 0 : -1;
        t.focus();
      };
      const closeList = (list) => {
        for (const it of usable(list)) if (it.xzSub && !it.xzSub.hidden) closeList(it.xzSub);
        list.hidden = true;
        list.xzParent.setAttribute("aria-expanded", "false");
      };
      const closeAll = () => {
        if (!current) return;
        if (current.xzSub) closeList(current.xzSub);
        current = null;
      };
      const openTop = (t, focus) => {
        var _a, _b;
        if (current && current !== t) closeAll();
        if (!t.xzSub) return;
        current = t;
        t.setAttribute("aria-expanded", "true");
        t.xzSub.hidden = false;
        position(t.xzSub, t, false);
        const all = usable(t.xzSub);
        if (focus === "first") (_a = all[0]) == null ? void 0 : _a.focus();
        if (focus === "last") (_b = all[all.length - 1]) == null ? void 0 : _b.focus();
      };
      const openSub = (item, focusFirst) => {
        var _a;
        const list = item.closest('[role="menu"]');
        for (const sib of usable(list)) if (sib !== item && sib.xzSub && !sib.xzSub.hidden) closeList(sib.xzSub);
        item.setAttribute("aria-expanded", "true");
        item.xzSub.hidden = false;
        position(item.xzSub, item, true);
        if (focusFirst) (_a = usable(item.xzSub)[0]) == null ? void 0 : _a.focus();
      };
      const step = (t, by) => tops[(tops.indexOf(t) + by + tops.length) % tops.length];
      const isTopList = (list) => tops.includes(list.xzParent);
      const typeahead = (list, from, key) => {
        const k = key.toLowerCase();
        const i = list.indexOf(from);
        const order = [...list.slice(i + 1), ...list.slice(0, i + 1)];
        return order.find((x) => labelOf(x).toLowerCase().startsWith(k));
      };
      const activate = (item) => {
        if (item.xzSub) return openSub(item, true);
        const role = item.getAttribute("role");
        if (role === "menuitemcheckbox") {
          const on = item.getAttribute("aria-checked") !== "true";
          item.setAttribute("aria-checked", String(on));
          fire(item, "xz:action", { action: labelOf(item), item, checked: on });
          return;
        }
        if (role === "menuitemradio") {
          const menu = item.closest('[role="menu"]');
          const scope = item.closest('[role="group"]') || menu;
          for (const r of $$('[role="menuitemradio"]', scope)) if (r.closest('[role="menu"]') === menu) r.setAttribute("aria-checked", String(r === item));
          fire(item, "xz:action", { action: labelOf(item), item, checked: true });
          return;
        }
        const top = current;
        closeAll();
        if (top) focusTop(top);
        fire(item, "xz:action", { action: labelOf(item), item });
      };
      bar.addEventListener("click", (e) => {
        const t = e.target.closest(".xz-menubar__trigger");
        if (t && tops.includes(t)) {
          if (current === t) closeAll();
          else openTop(t, e.detail === 0 ? "first" : null);
          return;
        }
        const item = e.target.closest(".xz-menu__item");
        if (!item || item.disabled || !bar.contains(item)) return;
        activate(item);
      });
      bar.addEventListener("keydown", (e) => {
        var _a, _b;
        const t = e.target.closest(".xz-menubar__trigger");
        if (t && tops.includes(t)) {
          const d2 = dirKey(e, bar);
          let to = null;
          if (d2) to = step(t, d2 === "next" ? 1 : -1);
          else if (e.key === "Home") to = tops[0];
          else if (e.key === "End") to = tops[tops.length - 1];
          else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openTop(t, e.key === "ArrowDown" ? "first" : "last");
            return;
          } else if (e.key === "Escape") {
            closeAll();
            return;
          } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) to = typeahead(tops, t, e.key);
          if (!to) return;
          e.preventDefault();
          const wasOpen = Boolean(current);
          focusTop(to);
          if (wasOpen) openTop(to, null);
          return;
        }
        const item = e.target.closest(".xz-menu__item");
        if (!item || !bar.contains(item)) return;
        const list = item.closest('[role="menu"]');
        const all = usable(list);
        const i = all.indexOf(item);
        const d = dirKey(e, bar);
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
          e.preventDefault();
          const n = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
          (_a = all[(n + all.length) % all.length]) == null ? void 0 : _a.focus();
        } else if (d === "next" && item.xzSub) {
          e.preventDefault();
          openSub(item, true);
        } else if (d && isTopList(list)) {
          e.preventDefault();
          const to = step(current, d === "next" ? 1 : -1);
          closeAll();
          focusTop(to);
          openTop(to, "first");
        } else if (d === "prev" || e.key === "Escape") {
          e.preventDefault();
          if (isTopList(list)) {
            const top = current;
            closeAll();
            if (top) focusTop(top);
          } else {
            closeList(list);
            list.xzParent.focus();
          }
        } else if (e.key === "Tab") {
          closeAll();
        } else if (e.key === " " && item.tagName !== "BUTTON") {
          e.preventDefault();
          item.click();
        } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          (_b = typeahead(all, item, e.key)) == null ? void 0 : _b.focus();
        }
      });
      bar.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        const t = e.target.closest(".xz-menubar__trigger");
        if (t && current && current !== t && tops.includes(t)) {
          focusTop(t);
          openTop(t, null);
          return;
        }
        const item = e.target.closest(".xz-menu__item");
        if (!item || item.disabled || !bar.contains(item) || item === document.activeElement) return;
        item.focus({ preventScroll: true });
        const list = item.closest('[role="menu"]');
        for (const sib of usable(list)) if (sib !== item && sib.xzSub && !sib.xzSub.hidden) closeList(sib.xzSub);
        if (item.xzSub && item.xzSub.hidden) openSub(item, false);
      });
      bar.addEventListener("focusout", (e) => {
        if (current && !bar.contains(e.relatedTarget)) closeAll();
      });
      document.addEventListener("pointerdown", (e) => {
        if (current && !bar.contains(e.target)) closeAll();
      });
      addEventListener("resize", closeAll);
      document.addEventListener("scroll", (e) => current && !(e.target instanceof Node && bar.contains(e.target)) && closeAll(), true);
      bar.xzMenubar = { close: closeAll, open: (label) => openTop(tops.find((t) => labelOf(t) === label) || tops[0], null) };
    }
  }

  // src/js/tools/duallist.js
  function initDuallists(root, { icon }) {
    for (const el of $$("[data-xz-duallist]", root)) {
      if (ready(el, "Duallist")) continue;
      const boxes = $$(':scope > label > input[type="checkbox"]', el);
      if (!boxes.length) continue;
      const [availLabel, chosenLabel] = (el.dataset.xzLabels || "Available|Chosen").split("|");
      const [addLabel, removeLabel, upLabel, downLabel] = (el.dataset.xzButtons || "Add|Remove|Up|Down").split("|");
      const status = Object.assign(document.createElement("p"), { className: "xz-sr-only" });
      status.setAttribute("role", "status");
      const body = Object.assign(document.createElement("div"), { className: "xz-duallist__body" });
      const side = (title) => {
        const wrap = Object.assign(document.createElement("div"), { className: "xz-duallist__side" });
        const head = Object.assign(document.createElement("p"), { className: "xz-duallist__title", id: nextId("duallist") });
        const count = document.createElement("span");
        head.append(title, count);
        const list = Object.assign(document.createElement("ul"), { className: "xz-duallist__list", tabIndex: 0 });
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-multiselectable", "true");
        list.setAttribute("aria-labelledby", head.id);
        list.dataset.empty = el.dataset.xzEmpty || "Nothing here";
        wrap.append(head, list);
        body.append(wrap);
        return { list, count, title };
      };
      const avail = side(availLabel);
      const chosen = side(chosenLabel);
      const button = (name, label, iconName) => {
        const b = Object.assign(document.createElement("button"), { type: "button", className: "xz-panel__action" });
        b.innerHTML = `${icon(iconName, { size: "sm" })}<span>${label}</span>`;
        b.setAttribute("aria-label", label);
        b.dataset.move = name;
        return b;
      };
      const actions = Object.assign(document.createElement("div"), { className: "xz-duallist__actions" });
      const btn = {
        add: button("add", addLabel, "chevron-right"),
        remove: button("remove", removeLabel, "chevron-left"),
        up: button("up", upLabel, "arrow-up"),
        down: button("down", downLabel, "arrow-down")
      };
      actions.append(btn.add, btn.remove, btn.up, btn.down);
      const summary = Object.assign(document.createElement("p"), { className: "xz-duallist__summary" });
      el.append(body, actions, summary, status);
      const options = boxes.map((box) => {
        const li = Object.assign(document.createElement("li"), { className: "xz-duallist__option", id: nextId("option") });
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        for (const n of box.parentElement.childNodes) if (n !== box) li.append(n.cloneNode(true));
        if (box.disabled) li.setAttribute("aria-disabled", "true");
        li.xzBox = box;
        return li;
      });
      for (const li of options) (li.xzBox.checked ? chosen : avail).list.append(li);
      const nameOf = (li) => {
        var _a;
        return ((_a = li.firstChild) == null ? void 0 : _a.textContent.trim()) || li.xzBox.value;
      };
      const optionsIn = (list) => $$(".xz-duallist__option", list);
      const selected = (list) => optionsIn(list).filter((o) => o.getAttribute("aria-selected") === "true");
      const say = (text) => {
        status.textContent = "";
        setTimeout(() => status.textContent = text, 30);
      };
      const anchor = /* @__PURE__ */ new Map();
      const sync = (changed2 = []) => {
        for (const s of [avail, chosen]) s.count.textContent = String(optionsIn(s.list).length);
        const order = [...optionsIn(chosen.list), ...optionsIn(avail.list)];
        for (const li of order) {
          const box = li.xzBox;
          const on = li.parentElement === chosen.list;
          if (box.checked !== on) {
            box.checked = on;
            changed2.push(box);
          }
          body.before(box.parentElement);
        }
        const names = optionsIn(chosen.list).map(nameOf);
        summary.textContent = names.length ? names.join(" / ") : el.dataset.xzEmpty || "Nothing chosen";
        const selAvail = selected(avail.list).length;
        const selChosen = selected(chosen.list);
        const all = optionsIn(chosen.list);
        btn.add.disabled = !selAvail;
        btn.remove.disabled = !selChosen.length;
        btn.up.disabled = !selChosen.length || selChosen[0] === all[0];
        btn.down.disabled = !selChosen.length || selChosen[selChosen.length - 1] === all[all.length - 1];
        for (const box of changed2) box.dispatchEvent(new Event("change", { bubbles: true }));
        if (changed2.length) fire(el, "xz:change", { value: names.length ? optionsIn(chosen.list).map((o) => o.xzBox.value) : [] });
      };
      const setActive = (list, li) => {
        for (const o of optionsIn(list)) o.classList.toggle("is-active", o === li);
        if (li) {
          list.setAttribute("aria-activedescendant", li.id);
          li.scrollIntoView({ block: "nearest" });
        } else list.removeAttribute("aria-activedescendant");
      };
      const select = (list, li, { add = false, range = false } = {}) => {
        const all = optionsIn(list);
        if (range && anchor.get(list)) {
          const [a, b] = [all.indexOf(anchor.get(list)), all.indexOf(li)].sort((x, y) => x - y);
          all.forEach((o, i) => o.setAttribute("aria-selected", String(i >= a && i <= b && o.getAttribute("aria-disabled") !== "true")));
        } else if (add) {
          li.setAttribute("aria-selected", String(li.getAttribute("aria-selected") !== "true"));
          anchor.set(list, li);
        } else {
          all.forEach((o) => o.setAttribute("aria-selected", String(o === li && o.getAttribute("aria-disabled") !== "true")));
          anchor.set(list, li);
        }
        setActive(list, li);
        sync();
      };
      const move = (from, to) => {
        const picked = selected(from.list).filter((o) => o.getAttribute("aria-disabled") !== "true");
        if (!picked.length) return;
        const next = optionsIn(from.list).find((o, i, all) => i > all.indexOf(picked[picked.length - 1]) && !picked.includes(o)) || optionsIn(from.list).filter((o) => !picked.includes(o)).pop();
        for (const o of optionsIn(to.list)) o.setAttribute("aria-selected", "false");
        for (const o of picked) to.list.append(o);
        setActive(to.list, picked[picked.length - 1]);
        setActive(from.list, next || null);
        if (next) next.setAttribute("aria-selected", "false");
        say(picked.length === 1 ? `${nameOf(picked[0])} moved to ${to.title}` : `${picked.length} items moved to ${to.title}`);
        sync();
      };
      const reorder = (by) => {
        const picked = selected(chosen.list);
        if (!picked.length) return;
        const all = optionsIn(chosen.list);
        if (by < 0 && picked[0] === all[0]) return;
        if (by > 0 && picked[picked.length - 1] === all[all.length - 1]) return;
        if (by < 0) for (const o of picked) o.previousElementSibling.before(o);
        else for (const o of [...picked].reverse()) o.nextElementSibling.after(o);
        const pos = optionsIn(chosen.list).indexOf(picked[0]) + 1;
        say(`${picked.length === 1 ? nameOf(picked[0]) : `${picked.length} items`} moved ${by < 0 ? "up" : "down"}, ${pos} of ${all.length}`);
        setActive(chosen.list, picked[0]);
        sync();
      };
      for (const s of [avail, chosen]) {
        const other = s === avail ? chosen : avail;
        s.list.addEventListener("click", (e) => {
          const li = e.target.closest(".xz-duallist__option");
          if (!li || li.getAttribute("aria-disabled") === "true") return;
          select(s.list, li, { add: e.ctrlKey || e.metaKey, range: e.shiftKey });
        });
        s.list.addEventListener("dblclick", (e) => {
          const li = e.target.closest(".xz-duallist__option");
          if (!li || li.getAttribute("aria-disabled") === "true") return;
          select(s.list, li);
          move(s, other);
        });
        s.list.addEventListener("focus", () => {
          const all = optionsIn(s.list);
          if (all.length && !s.list.getAttribute("aria-activedescendant")) setActive(s.list, selected(s.list)[0] || all[0]);
        });
        s.list.addEventListener("keydown", (e) => {
          const all = optionsIn(s.list);
          const active = all.find((o) => o.classList.contains("is-active")) || all[0];
          const i = all.indexOf(active);
          if (s === chosen && e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            if (active && active.getAttribute("aria-selected") !== "true") select(s.list, active);
            reorder(e.key === "ArrowUp" ? -1 : 1);
            return;
          }
          const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: all.length - 1 }[e.key];
          if (to !== void 0 && all.length) {
            e.preventDefault();
            const li = all[Math.max(0, Math.min(all.length - 1, to))];
            if (e.shiftKey) select(s.list, li, { range: true });
            else setActive(s.list, li);
          } else if (e.key === " " && active) {
            e.preventDefault();
            select(s.list, active, { add: true });
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (active && !selected(s.list).length) select(s.list, active);
            move(s, other);
          } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
            e.preventDefault();
            all.forEach((o) => o.setAttribute("aria-selected", String(o.getAttribute("aria-disabled") !== "true")));
            sync();
          }
        });
      }
      btn.add.addEventListener("click", () => move(avail, chosen));
      btn.remove.addEventListener("click", () => move(chosen, avail));
      btn.up.addEventListener("click", () => reorder(-1));
      btn.down.addEventListener("click", () => reorder(1));
      el.xzDuallist = {
        value: () => optionsIn(chosen.list).map((o) => o.xzBox.value),
        set(values) {
          const list = [...values];
          for (const o of options) if (!list.includes(o.xzBox.value)) avail.list.append(o);
          for (const v2 of list) {
            const o = options.find((x) => x.xzBox.value === v2);
            if (o) chosen.list.append(o);
          }
          sync();
        }
      };
      sync();
    }
  }

  // src/js/tools/readout.js
  var h = (y, x1 = 1.3, x2 = 10.7) => `M${x1} ${y}L${x1 + 1} ${y - 1}H${x2 - 1}L${x2} ${y}L${x2 - 1} ${y + 1}H${x1 + 1}Z`;
  var v = (x, y1, y2) => `M${x} ${y1}L${x + 1} ${y1 + 1}V${y2 - 1}L${x} ${y2}L${x - 1} ${y2 - 1}V${y1 + 1}Z`;
  var SEGS = [h(1), v(11, 1.3, 9.7), v(11, 10.3, 18.7), h(19), v(1, 10.3, 18.7), v(1, 1.3, 9.7), h(10)];
  var MASKS = { 0: 126, 1: 48, 2: 109, 3: 121, 4: 51, 5: 91, 6: 95, 7: 112, 8: 127, 9: 123, "-": 1, " ": 0 };
  var NS = "http://www.w3.org/2000/svg";
  function charSvg(ch) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "xz-readout__char");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (ch === ":" || ch === ".") {
      svg.setAttribute("viewBox", "0 0 4 20");
      svg.classList.add("xz-readout__char--narrow");
      for (const y of ch === ":" ? [5, 13] : [17.6]) {
        const r = document.createElementNS(NS, "rect");
        Object.entries({ x: 1, y, width: 2, height: 2, class: "xz-readout__seg is-on" }).forEach(([k, val]) => r.setAttribute(k, val));
        svg.append(r);
      }
      return svg;
    }
    svg.setAttribute("viewBox", "0 0 12 20");
    for (const d of SEGS) {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "xz-readout__seg");
      svg.append(p);
    }
    svg.xzChar = "";
    return svg;
  }
  function paint(svg, ch) {
    var _a;
    if (svg.xzChar === ch) return;
    svg.xzChar = ch;
    const mask = (_a = MASKS[ch]) != null ? _a : 0;
    [...svg.children].forEach((p, i) => p.classList.toggle("is-on", Boolean(mask & 1 << 6 - i)));
  }
  function initReadouts(root) {
    for (const el of $$("[data-xz-readout]", root)) {
      if (ready(el, "Readout")) continue;
      const text = Object.assign(document.createElement("span"), { className: "xz-sr-only" });
      const digits = Object.assign(document.createElement("span"), { className: "xz-readout__digits" });
      digits.setAttribute("aria-hidden", "true");
      let chars = [];
      const set = (value) => {
        const s = String(value);
        text.textContent = s;
        const shape = s.replace(/[0-9 -]/g, "8");
        if (shape !== chars.map((c) => c.xzShape).join("")) {
          digits.textContent = "";
          chars = [...s].map((c) => {
            const svg = charSvg(/[:.]/.test(c) ? c : "8");
            svg.xzShape = /[:.]/.test(c) ? c : "8";
            digits.append(svg);
            return svg;
          });
        }
        [...s].forEach((c, i) => !/[:.]/.test(c) && paint(chars[i], c));
      };
      const start = el.textContent.trim();
      el.textContent = "";
      el.append(text, digits);
      set(start);
      el.xzReadout = { set, get: () => text.textContent };
    }
  }
  var two = (n) => String(Math.floor(n)).padStart(2, "0");
  function clock(ms, tenths) {
    const total = Math.max(0, ms) / 1e3;
    const hours = Math.floor(total / 3600);
    const mins = Math.floor(total % 3600 / 60);
    const secs = Math.floor(total % 60);
    let s = hours ? `${hours}:${two(mins)}:${two(secs)}` : `${two(mins)}:${two(secs)}`;
    if (tenths) s += `.${two(Math.floor(total * 100 % 100))}`;
    return s;
  }
  var words = (secs) => secs >= 60 ? `${Math.round(secs / 60)} minute${Math.round(secs / 60) === 1 ? "" : "s"}` : `${secs} second${secs === 1 ? "" : "s"}`;
  function initTimers(root) {
    for (const el of $$("[data-xz-timer]", root)) {
      if (ready(el, "Timer")) continue;
      const display = $(".xz-readout", el);
      const toggleBtn = $("[data-xz-timer-start]", el);
      const resetBtn = $("[data-xz-timer-reset]", el);
      const duration = Number(el.getAttribute("data-xz-timer")) * 1e3 || 0;
      const down = duration > 0;
      const tenths = el.hasAttribute("data-xz-tenths");
      const warnAt = Number(el.dataset.xzWarn || 0) * 1e3;
      const labels = (el.dataset.xzLabels || "Start|Pause|Resume").split("|");
      const status = Object.assign(document.createElement("span"), { className: "xz-sr-only" });
      status.setAttribute("role", "status");
      el.append(status);
      let elapsed = 0;
      let since = 0;
      let timer = 0;
      let warned = false;
      const now = () => elapsed + (since ? performance.now() - since : 0);
      const show = () => {
        const ms = down ? duration - now() : now();
        const text = clock(down ? Math.ceil(ms / (tenths ? 10 : 1e3)) * (tenths ? 10 : 1e3) : ms, tenths);
        if (display == null ? void 0 : display.xzReadout) display.xzReadout.set(text);
        else if (display) display.textContent = text;
        if (down && warnAt && !warned && since && ms <= warnAt && ms > 0) {
          warned = true;
          display == null ? void 0 : display.classList.add("is-warning");
          status.textContent = `${words(Math.round(warnAt / 1e3))} left`;
        }
        if (down && ms <= 0) finish();
      };
      const label = () => {
        if (!toggleBtn) return;
        const text = since ? labels[1] : elapsed ? labels[2] : labels[0];
        const span = $("span", toggleBtn);
        (span || toggleBtn).textContent = text;
        el.classList.toggle("is-running", Boolean(since));
      };
      const start = () => {
        if (since || down && now() >= duration) return;
        since = performance.now();
        timer = setInterval(show, tenths ? 50 : 200);
        label();
        fire(el, "xz:timer", { state: "running" });
      };
      const pause = () => {
        if (!since) return;
        elapsed = now();
        since = 0;
        clearInterval(timer);
        show();
        label();
        fire(el, "xz:timer", { state: "paused", seconds: Math.round(elapsed / 1e3) });
      };
      const finish = () => {
        elapsed = duration;
        since = 0;
        clearInterval(timer);
        label();
        el.classList.add("is-done");
        if (toggleBtn) toggleBtn.disabled = true;
        status.textContent = el.dataset.xzDone || "Time is up";
        fire(el, "xz:timeup", {});
      };
      const reset = () => {
        clearInterval(timer);
        elapsed = 0;
        since = 0;
        warned = false;
        el.classList.remove("is-done");
        display == null ? void 0 : display.classList.remove("is-warning");
        if (toggleBtn) toggleBtn.disabled = false;
        show();
        label();
        fire(el, "xz:timer", { state: "reset" });
      };
      toggleBtn == null ? void 0 : toggleBtn.addEventListener("click", () => since ? pause() : start());
      resetBtn == null ? void 0 : resetBtn.addEventListener("click", reset);
      el.xzTimer = { start, pause, reset, seconds: () => Math.round((down ? duration - now() : now()) / 1e3) };
      show();
      label();
      if (el.hasAttribute("data-xz-autostart")) start();
    }
  }

  // src/js/tools/paper.js
  var SIZES = { A3: [297, 420], A4: [210, 297], A5: [148, 210], LETTER: [215.9, 279.4], LEGAL: [215.9, 355.6], ID: [54, 85.6] };
  var mmOf = (input) => {
    const own = /^([\d.]+)\s*[x×]\s*([\d.]+)$/i.exec(input.dataset.mm || "");
    if (own) return [Number(own[1]), Number(own[2])];
    return SIZES[String(input.value).toUpperCase().replace(/[\s-]+CARD$/, "")] || null;
  };
  var fmt = (n) => (Math.round(n * 10) / 10).toLocaleString("en-IN");
  var px = (mm) => Math.round(mm / 25.4 * 96);
  function initPapers(root) {
    for (const el of $$("[data-xz-paper]", root)) {
      if (ready(el, "Paper")) continue;
      const radios = $$('input[type="radio"]', el);
      const sizes = radios.filter((r) => mmOf(r));
      const turns = radios.filter((r) => /^(portrait|landscape)$/i.test(r.value));
      const measure = $(".xz-measure", el);
      const stage = $(".xz-paper__stage", el);
      const box = measure && $(".xz-measure__box", measure);
      const out = (name) => $$(`[data-xz-paper-out="${name}"]`, el);
      let page = null;
      const fit = () => {
        if (!stage || !box || !page) return;
        const cs = getComputedStyle(stage);
        const x = $(".xz-measure__x", measure);
        const y = $(".xz-measure__y", measure);
        const sideW = y ? y.getBoundingClientRect().width + parseFloat(getComputedStyle(y).marginInlineEnd || 0) : 0;
        const sideH = x ? x.getBoundingClientRect().height + parseFloat(getComputedStyle(x).marginBlockEnd || 0) : 0;
        const roomW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - sideW;
        const roomH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - sideH;
        if (roomW <= 0 || roomH <= 0) return;
        const scale = Math.min(1, Math.max(0.1, parseFloat(cs.getPropertyValue("--xz-paper-scale")) || 1));
        const [w, h2] = page;
        const bw = Math.min(roomW, roomH * (w / h2)) * scale;
        box.style.setProperty("--xz-paper-w", `${Math.round(bw)}px`);
        box.style.setProperty("--xz-paper-h", `${Math.round(bw * (h2 / w))}px`);
        if (!stage.classList.contains("is-ready")) requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("is-ready")));
      };
      const update = (emit) => {
        var _a;
        const size = sizes.find((r) => r.checked) || sizes[0];
        if (!size) return;
        let [w, h2] = mmOf(size);
        const landscape = (((_a = turns.find((r) => r.checked)) == null ? void 0 : _a.value) || "").toLowerCase() === "landscape";
        if (landscape !== w > h2) [w, h2] = [h2, w];
        page = [w, h2];
        el.dataset.orientation = landscape ? "landscape" : "portrait";
        if (measure) {
          measure.style.setProperty("--xz-ratio", `${w} / ${h2}`);
          const x = $(".xz-measure__x", measure);
          const y = $(".xz-measure__y", measure);
          if (x) x.textContent = `${fmt(w)} mm`;
          if (y) {
            const span = $("span", y) || y.appendChild(document.createElement("span"));
            span.textContent = `${fmt(h2)} mm`;
          }
        }
        fit();
        out("width").forEach((o) => o.textContent = `${fmt(w)} mm`);
        out("height").forEach((o) => o.textContent = `${fmt(h2)} mm`);
        out("pixels").forEach((o) => o.textContent = `${px(w)} \xD7 ${px(h2)} px`);
        out("name").forEach((o) => o.textContent = size.dataset.name || size.value);
        if (emit) fire(el, "xz:paper", { size: size.value, orientation: el.dataset.orientation, mm: [w, h2], px: [px(w), px(h2)] });
      };
      el.addEventListener("change", (e) => {
        var _a, _b;
        return ((_b = (_a = e.target).matches) == null ? void 0 : _b.call(_a, 'input[type="radio"]')) && update(true);
      });
      if (stage && typeof ResizeObserver === "function") new ResizeObserver(fit).observe(stage);
      el.xzPaper = { fit, update: () => update(true) };
      update(false);
    }
  }

  // src/js/tools/beforeafter.js
  var ARROWS = '<svg class="xz-icon xz-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>';
  function initBeforeAfter(root) {
    var _a;
    for (const el of $$("[data-xz-beforeafter]", root)) {
      const media = [...el.children].filter((c) => !c.matches("figcaption, .xz-beforeafter__range, .xz-beforeafter__line, .xz-beforeafter__tag")).slice(0, 2);
      if (media.length < 2 || ready(el, "Beforeafter")) continue;
      const [before, after] = media;
      before.classList.add("xz-beforeafter__before");
      after.classList.add("xz-beforeafter__after");
      const names = [el.dataset.xzBefore || "Before", el.dataset.xzAfter || "After"];
      const range = Object.assign(document.createElement("input"), { type: "range", className: "xz-beforeafter__range", min: 0, max: 100, step: 1 });
      range.setAttribute("aria-label", el.getAttribute("aria-label") || `${names[0]} and ${names[1]}`);
      const line = Object.assign(document.createElement("span"), { className: "xz-beforeafter__line" });
      line.innerHTML = `<span class="xz-beforeafter__knob">${ARROWS}</span>`;
      line.setAttribute("aria-hidden", "true");
      const tags = names.map((n, i) => {
        const t = Object.assign(document.createElement("span"), { className: `xz-beforeafter__tag xz-beforeafter__tag--${i ? "after" : "before"}`, textContent: n });
        t.setAttribute("aria-hidden", "true");
        return t;
      });
      after.after(range, line, ...tags);
      const set = (pct, emit) => {
        const p = Math.round(clamp(pct, 0, 100));
        range.value = String(p);
        el.style.setProperty("--xz-pos", `${p}%`);
        range.setAttribute("aria-valuetext", `${p}% ${names[0].toLowerCase()}, ${100 - p}% ${names[1].toLowerCase()}`);
        if (emit) fire(el, "xz:compare", { position: p });
      };
      range.addEventListener("input", () => set(Number(range.value), true));
      const at = (e) => {
        const r = el.getBoundingClientRect();
        return (isRtl(el) ? r.right - e.clientX : e.clientX - r.left) / r.width * 100;
      };
      el.addEventListener("pointerdown", (e) => {
        var _a2;
        if (e.button !== 0 || e.target.closest("a, button, figcaption")) return;
        e.preventDefault();
        range.focus({ preventScroll: true });
        (_a2 = el.setPointerCapture) == null ? void 0 : _a2.call(el, e.pointerId);
        el.classList.add("is-dragging");
        set(at(e), true);
        const move = (ev) => set(at(ev), true);
        const end = () => {
          el.classList.remove("is-dragging");
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", end);
          el.removeEventListener("pointercancel", end);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", end);
        el.addEventListener("pointercancel", end);
      });
      el.xzBeforeafter = { set: (p) => set(p, true), get: () => Number(range.value) };
      set(Number((_a = el.dataset.xzStart) != null ? _a : 50), false);
    }
  }

  // src/js/tools/color.js
  var ctx = null;
  function parse(input) {
    if (input && typeof input === "object" && "r" in input) return input;
    const s = String(input != null ? input : "").trim();
    if (!s || /^(currentcolor|inherit|initial|unset|revert|transparent)$/i.test(s)) return null;
    const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
    if (hex) {
      let x = hex[1];
      if (x.length < 5) x = [...x].map((c) => c + c).join("");
      const n = parseInt(x.slice(0, 6), 16);
      return { r: n >> 16, g: n >> 8 & 255, b: n & 255, a: x.length === 8 ? parseInt(x.slice(6), 16) / 255 : 1 };
    }
    if (typeof CSS === "undefined" || !CSS.supports("color", s)) return null;
    ctx || (ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true }));
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  }
  var hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  var toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();
  function toHsl({ r, g, b }) {
    const [R, G, B] = [r / 255, g / 255, b / 255];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const l = (max + min) / 2;
    const d = max - min;
    let h2 = 0;
    let s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h2 = max === R ? (G - B) / d % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
      h2 = (h2 * 60 + 360) % 360;
    }
    return { h: h2, s: s * 100, l: l * 100 };
  }
  function fromHsl({ h: h2, s, l }) {
    const S = s / 100;
    const L = l / 100;
    const a = S * Math.min(L, 1 - L);
    const f = (n) => {
      const k = (n + h2 / 30) % 12;
      return 255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return { r: f(0), g: f(8), b: f(4) };
  }
  var lin = (c) => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  var gam = (c) => 255 * (c <= 31308e-7 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  function toOklch({ r, g, b }) {
    const [R, G, B] = [lin(r), lin(g), lin(b)];
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const Bv = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const C = Math.hypot(A, Bv);
    const h2 = (Math.atan2(Bv, A) * 180 / Math.PI + 360) % 360;
    return { l: L, c: C, h: C < 1e-4 ? 0 : h2 };
  }
  function oklchToLinear({ l: L, c, h: h2 }) {
    const hr = h2 * Math.PI / 180;
    const A = c * Math.cos(hr);
    const B = c * Math.sin(hr);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  }
  var fits = (rgb) => rgb.every((v2) => v2 >= -1e-4 && v2 <= 1 + 1e-4);
  function fromOklch({ l, c, h: h2 }) {
    const L = clamp(l, 0, 1);
    let rgb = oklchToLinear({ l: L, c, h: h2 });
    if (!fits(rgb)) {
      let lo = 0;
      let hi = c;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (fits(oklchToLinear({ l: L, c: mid, h: h2 }))) lo = mid;
        else hi = mid;
      }
      rgb = oklchToLinear({ l: L, c: lo, h: h2 });
    }
    const [r, g, b] = rgb.map((v2) => gam(clamp(v2, 0, 1)));
    return { r, g, b };
  }
  var luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  function contrast(a, b) {
    const x = parse(a);
    const y = parse(b);
    if (!x || !y) return null;
    const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
    return (hi + 0.05) / (lo + 0.05);
  }
  var readable = (c) => contrast(c, { r: 0, g: 0, b: 0 }) >= contrast(c, { r: 255, g: 255, b: 255 }) ? "#000000" : "#FFFFFF";
  var round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;
  var formats = {
    hex: (c) => toHex(c),
    rgb: (c) => `rgb(${round(c.r)}, ${round(c.g)}, ${round(c.b)})`,
    hsl: (c) => {
      const { h: h2, s, l } = toHsl(c);
      return `hsl(${round(h2)}, ${round(s)}%, ${round(l)}%)`;
    },
    oklch: (c) => {
      const { l, c: ch, h: h2 } = toOklch(c);
      return `oklch(${round(l * 100, 1)}% ${round(ch, 3)} ${round(h2, 1)})`;
    }
  };
  var STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  var LIGHT = [0.975, 0.94, 0.88, 0.8, 0.71, 0.62, 0.53, 0.45, 0.37, 0.29, 0.21];
  var CHROMA = [0.1, 0.22, 0.45, 0.7, 0.9, 1, 0.96, 0.86, 0.72, 0.58, 0.45];
  function shades(input, { hue } = {}) {
    const base = parse(input);
    if (!base) return [];
    const o = toOklch(base);
    const h2 = hue != null ? hue : o.h;
    const list = STEPS.map((step, i) => ({ step, color: fromOklch({ l: LIGHT[i], c: o.c * CHROMA[i], h: h2 }) }));
    if (hue === void 0 || Math.abs(hue - o.h) < 0.5) {
      let near = 0;
      LIGHT.forEach((L, i) => Math.abs(L - o.l) < Math.abs(LIGHT[near] - o.l) && (near = i));
      list[near] = { step: STEPS[near], color: base, base: true };
    }
    return list.map((s) => ({ ...s, hex: toHex(s.color) }));
  }
  var color = { parse, toHex, toHsl, fromHsl, toOklch, fromOklch, contrast, readable, formats, shades };
  var EYEDROPPER = '<svg class="xz-icon xz-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/></svg>';
  var details = (c) => ({ hex: toHex(c), rgb: formats.rgb(c), hsl: formats.hsl(c), oklch: formats.oklch(c), color: c });
  function initFields(root) {
    for (const el of $$("[data-xz-color]", root)) {
      if (ready(el, "Color")) continue;
      el.classList.add("xz-colorfield");
      const swatch = $('input[type="color"]', el);
      const text = $('input:not([type="color"])', el);
      const style = formats[el.getAttribute("data-xz-color")] || formats.hex;
      let current = parse(text == null ? void 0 : text.value) || parse(swatch == null ? void 0 : swatch.value) || { r: 0, g: 0, b: 0 };
      const emit = () => fire(el, "xz:color", details(current));
      const set = (c, { from, emit: send = true } = {}) => {
        current = c;
        if (swatch && from !== swatch) swatch.value = toHex(c).toLowerCase();
        if (text && from !== text) text.value = style(c);
        text == null ? void 0 : text.removeAttribute("aria-invalid");
        if (send) emit();
      };
      swatch == null ? void 0 : swatch.addEventListener("input", () => set(parse(swatch.value), { from: swatch }));
      text == null ? void 0 : text.addEventListener("input", () => {
        const c = parse(text.value);
        if (c) set(c, { from: text });
      });
      text == null ? void 0 : text.addEventListener("change", () => {
        const c = parse(text.value);
        if (c) set(c);
        else text.setAttribute("aria-invalid", "true");
      });
      if ("EyeDropper" in window && !$(".xz-colorfield__pick", el)) {
        const pick = Object.assign(document.createElement("button"), { type: "button", className: "xz-colorfield__pick", innerHTML: EYEDROPPER });
        pick.setAttribute("aria-label", "Pick a colour from the screen");
        pick.addEventListener("click", async () => {
          try {
            const { sRGBHex } = await new window.EyeDropper().open();
            const c = parse(sRGBHex);
            if (c) set(c);
          } catch {
          }
        });
        el.append(pick);
      }
      el.xzColor = { get: () => details(current), set: (v2) => parse(v2) && set(parse(v2)) };
      set(current, { emit: false });
    }
  }
  function initSwatches(root, init) {
    for (const sw of $$(".xz-swatch", root)) {
      if (ready(sw, "Swatch")) continue;
      const c = parse(sw.style.getPropertyValue("--xz-swatch")) || parse(getComputedStyle(sw).backgroundColor);
      if (!c) continue;
      sw.style.setProperty("--xz-swatch-text", readable(c));
      if (!sw.textContent.trim()) sw.innerHTML = `<span>${toHex(c)}</span>`;
      if (sw.tagName === "BUTTON" && !sw.hasAttribute("data-xz-copy")) {
        sw.setAttribute("data-xz-copy", toHex(c));
        init == null ? void 0 : init(sw.parentElement || sw);
      }
    }
  }
  function renderShades(list, steps, init) {
    list.textContent = "";
    for (const s of steps) {
      const li = document.createElement("li");
      const b = Object.assign(document.createElement("button"), { type: "button", className: `xz-swatch${s.base ? " is-base" : ""}` });
      b.style.setProperty("--xz-swatch", s.hex);
      b.setAttribute("data-xz-copy", s.hex);
      b.innerHTML = `<span class="xz-swatch__name">${s.step}</span><span>${s.hex}</span>`;
      li.append(b);
      list.append(li);
    }
    initSwatches(list);
    init == null ? void 0 : init(list);
  }
  function initShades(root, init) {
    for (const el of $$("[data-xz-shades]", root)) {
      if (ready(el, "Shades")) continue;
      el.classList.add("xz-shades");
      let list = $(".xz-swatches", el);
      if (!list) {
        list = Object.assign(document.createElement("ul"), { className: "xz-swatches xz-swatches--tall" });
        list.setAttribute("aria-label", el.getAttribute("aria-label") || "Shades");
        el.prepend(list);
      }
      const hueInput = $('input[type="range"][data-xz-shades-hue]', el);
      let base = el.getAttribute("data-xz-shades") || "#737373";
      let steps = [];
      const draw = (emit) => {
        const c = parse(base);
        if (!c) return;
        if (hueInput) hueInput.style.setProperty("--xz-fader-track", `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h2) => toHex(fromOklch({ l: 0.7, c: 0.14, h: h2 }))).join(", ")})`);
        steps = shades(c, hueInput ? { hue: Number(hueInput.value) } : {});
        renderShades(list, steps, init);
        if (emit) fire(el, "xz:shades", { shades: steps.map(({ step, hex }) => ({ step, hex })) });
      };
      let quiet = false;
      const setHue = (c) => {
        if (!hueInput || !c) return;
        hueInput.value = String(Math.round(toOklch(c).h));
        quiet = true;
        hueInput.dispatchEvent(new Event("input"));
        quiet = false;
      };
      if (hueInput) {
        if (!hueInput.hasAttribute("value")) setHue(parse(base));
        hueInput.addEventListener("input", () => !quiet && draw(true));
      }
      const source = el.dataset.xzShadesFor && document.querySelector(el.dataset.xzShadesFor);
      source == null ? void 0 : source.addEventListener("xz:color", (e) => {
        base = e.detail.hex;
        setHue(e.detail.color);
        draw(true);
      });
      el.xzShades = {
        set(v2) {
          if (!parse(v2)) return;
          base = v2;
          setHue(parse(v2));
          draw(true);
        },
        value: () => steps.map(({ step, hex }) => ({ step, hex }))
      };
      draw(false);
    }
  }
  function initContrasts(root) {
    for (const el of $$("[data-xz-contrast]", root)) {
      if (ready(el, "Contrast")) continue;
      const [fg, bg] = $$("[data-xz-color]", el);
      if (!fg || !bg) continue;
      const ratioEl = $(".xz-contrast__ratio strong", el) || $(".xz-contrast__ratio", el);
      const marks = $$("[data-level]", el);
      const status = Object.assign(document.createElement("p"), { className: "xz-sr-only" });
      status.setAttribute("role", "status");
      el.append(status);
      let timer = 0;
      const update = (announce) => {
        var _a, _b;
        const a = (_a = fg.xzColor) == null ? void 0 : _a.get().color;
        const b = (_b = bg.xzColor) == null ? void 0 : _b.get().color;
        if (!a || !b) return;
        const r = contrast(a, b);
        const shown = (Math.floor(r * 100) / 100).toFixed(2);
        el.style.setProperty("--xz-contrast-fg", toHex(a));
        el.style.setProperty("--xz-contrast-bg", toHex(b));
        if (ratioEl) ratioEl.textContent = shown;
        const passed = [];
        for (const m of marks) {
          const ok = r >= Number(m.dataset.level);
          m.classList.toggle("is-pass", ok);
          m.classList.toggle("is-fail", !ok);
          let sr = $(".xz-sr-only", m);
          if (!sr) m.append(sr = Object.assign(document.createElement("span"), { className: "xz-sr-only" }));
          sr.textContent = ok ? ": passes" : ": fails";
          if (ok) passed.push(m.firstChild.textContent.trim());
        }
        fire(el, "xz:contrast", { ratio: r, pass: passed });
        if (announce) {
          clearTimeout(timer);
          timer = setTimeout(() => status.textContent = `Contrast ${shown} to 1. ${passed.length ? `Passes ${passed.join(", ")}.` : "Fails every level."}`, 700);
        }
      };
      el.addEventListener("xz:color", () => update(true));
      el.xzContrast = { ratio: () => contrast(fg.xzColor.get().color, bg.xzColor.get().color) };
      update(false);
    }
  }
  var MODELS = {
    rgb: { name: "RGB", ch: [["Red", 255, 1], ["Green", 255, 1], ["Blue", 255, 1]], from: (c) => [c.r, c.g, c.b], to: ([r, g, b]) => ({ r, g, b }), unit: ["", "", ""] },
    hsl: { name: "HSL", ch: [["Hue", 360, 1], ["Saturation", 100, 1], ["Lightness", 100, 1]], from: (c) => Object.values(toHsl(c)), to: ([h2, s, l]) => fromHsl({ h: h2, s, l }), unit: ["\xB0", "%", "%"] },
    oklch: { name: "OKLCH", ch: [["Lightness", 100, 0.1], ["Chroma", 0.37, 1e-3], ["Hue", 360, 1]], from: (c) => {
      const o = toOklch(c);
      return [o.l * 100, o.c, o.h];
    }, to: ([l, c, h2]) => fromOklch({ l: l / 100, c, h: h2 }), unit: ["%", "", "\xB0"] }
  };
  function initPickers(root, { icon, init }) {
    for (const el of $$("[data-xz-colorpicker]", root)) {
      if (ready(el, "Colorpicker")) continue;
      el.classList.add("xz-colorpicker");
      let swatch = $('input[type="color"]', el);
      if (!swatch) {
        swatch = Object.assign(document.createElement("input"), { type: "color", value: "#737373" });
        swatch.setAttribute("aria-label", "Colour");
        el.prepend(swatch);
      }
      const id = nextId("picker");
      let model = MODELS[el.dataset.xzModel] ? el.dataset.xzModel : "oklch";
      let current = parse(el.dataset.value) || parse(swatch.value);
      let values = MODELS[model].from(current);
      const seg = Object.assign(document.createElement("div"), { className: "xz-segmented xz-segmented--cells" });
      seg.setAttribute("role", "radiogroup");
      seg.setAttribute("aria-label", "Colour model");
      seg.innerHTML = Object.entries(MODELS).map(([k, m]) => `<label><input type="radio" name="${id}-model" value="${k}"${k === model ? " checked" : ""}><span>${m.name}</span></label>`).join("");
      const rows = [0, 1, 2].map((i) => {
        const row = Object.assign(document.createElement("div"), { className: "xz-colorpicker__channel" });
        row.innerHTML = `<label for="${id}-r${i}"></label><input class="xz-slider xz-slider--fader" type="range" id="${id}-r${i}" min="0"><input class="xz-input" type="number" min="0" inputmode="decimal">`;
        return row;
      });
      const lines = Object.assign(document.createElement("div"), { className: "xz-colorpicker__values" });
      lines.innerHTML = ["hex", "rgb", "hsl", "oklch"].map((k) => `<div class="xz-valueline" data-format="${k}"><span class="xz-valueline__label">${k.toUpperCase()}</span><code class="xz-valueline__value"></code><button class="xz-btn xz-btn--ghost xz-btn--icon xz-btn--sm" type="button" data-xz-copy="" aria-label="Copy ${k.toUpperCase()} value">${icon("copy", { size: "sm" })}</button></div>`).join("");
      swatch.after(seg, ...rows, lines);
      const track = (i) => {
        const m = MODELS[model];
        const stops = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1].map((t) => {
          const v2 = [...values];
          v2[i] = t * m.ch[i][1];
          return toHex(m.to(v2));
        });
        return `linear-gradient(to right, ${stops.join(", ")})`;
      };
      const paint2 = () => {
        const m = MODELS[model];
        rows.forEach((row, i) => {
          const [name, max, stepSize] = m.ch[i];
          const [label, range, num] = row.children;
          label.textContent = name;
          for (const input of [range, num]) Object.assign(input, { max: String(max), step: String(stepSize) });
          const shown = stepSize < 1 ? Number(values[i]).toFixed(stepSize < 0.01 ? 3 : 1) : String(Math.round(values[i]));
          range.value = shown;
          if (document.activeElement !== num) num.value = shown;
          num.setAttribute("aria-label", `${name} value`);
          range.setAttribute("aria-valuetext", `${shown}${m.unit[i] === "\xB0" ? " degrees" : m.unit[i]}`);
          range.style.setProperty("--xz-fader-track", track(i));
        });
        swatch.value = toHex(current).toLowerCase();
        for (const line of lines.children) {
          const text = formats[line.dataset.format](current);
          line.querySelector("code").textContent = text;
          line.querySelector("[data-xz-copy]").setAttribute("data-xz-copy", text);
        }
      };
      const changed2 = () => {
        paint2();
        fire(el, "xz:color", details(current));
      };
      rows.forEach((row, i) => {
        const [, range, num] = row.children;
        const take = (input) => {
          const v2 = Number(input.value);
          if (!Number.isFinite(v2)) return;
          values[i] = clamp(v2, 0, MODELS[model].ch[i][1]);
          current = MODELS[model].to(values);
          changed2();
        };
        range.addEventListener("input", () => take(range));
        num.addEventListener("change", () => take(num));
      });
      seg.addEventListener("change", (e) => {
        model = e.target.value;
        values = MODELS[model].from(current);
        paint2();
      });
      swatch.addEventListener("input", () => {
        current = parse(swatch.value);
        values = MODELS[model].from(current);
        changed2();
      });
      el.xzColorpicker = {
        get: () => details(current),
        set(v2) {
          const c = parse(v2);
          if (!c) return;
          current = c;
          values = MODELS[model].from(c);
          changed2();
        }
      };
      paint2();
      init == null ? void 0 : init(el);
    }
  }
  function initColors(root, helpers) {
    initFields(root);
    initSwatches(root, helpers.init);
    initShades(root, helpers.init);
    initContrasts(root);
    initPickers(root, helpers);
  }

  // src/js/tools/math.js
  var GREEK = { alpha: "\u03B1", beta: "\u03B2", gamma: "\u03B3", delta: "\u03B4", epsilon: "\u03B5", theta: "\u03B8", lambda: "\u03BB", mu: "\u03BC", pi: "\u03C0", rho: "\u03C1", sigma: "\u03C3", tau: "\u03C4", phi: "\u03C6", omega: "\u03C9", Delta: "\u0394", Sigma: "\u03A3", Omega: "\u03A9", infinity: "\u221E", inf: "\u221E" };
  var FUNCS = /* @__PURE__ */ new Set(["sin", "cos", "tan", "sec", "csc", "cot", "asin", "acos", "atan", "sinh", "cosh", "tanh", "ln", "log", "exp", "min", "max", "gcd", "lcm", "floor", "ceil", "round", "det"]);
  var SPECIAL = /* @__PURE__ */ new Set(["sqrt", "cbrt", "root", "abs", "sum", "prod", "int", "lim", "diff", "ncr", "npr"]);
  var INVERSE = { asin: "sin", acos: "cos", atan: "tan" };
  var SYMBOLS = { "\xD7": "*", "\xB7": "*", "\xF7": "/", "\u2212": "-", "\u2264": "<=", "\u2265": ">=", "\u2260": "!=", "\u2192": "->", "\u221A": "sqrt", \u03C0: "pi", "\u221E": "inf" };
  var RELATIONS = { "=": "=", "<": "<", ">": ">", "<=": "\u2264", ">=": "\u2265", "!=": "\u2260", "\u2248": "\u2248", "->": "\u2192" };
  function tokenize(src) {
    const out = [];
    const s = String(src);
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) {
        i++;
        continue;
      }
      const num = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (num) {
        out.push({ t: "num", v: num[1] });
        i += num[1].length;
        continue;
      }
      const word = /^[A-Za-zͰ-Ͽ]+/.exec(s.slice(i));
      if (word) {
        out.push({ t: "name", v: word[0] });
        i += word[0].length;
        continue;
      }
      const two2 = s.slice(i, i + 2);
      if (["<=", ">=", "!=", "->"].includes(two2)) {
        out.push({ t: "op", v: two2 });
        i += 2;
        continue;
      }
      const mapped = SYMBOLS[c];
      if (mapped) out.push(/^[a-z]+$/.test(mapped) ? { t: "name", v: mapped } : { t: "op", v: mapped });
      else if ("+-*/^()_,=<>!|%\xB0\xB1\u2248".includes(c)) out.push({ t: "op", v: c });
      else throw new Error(`Unexpected \u201C${c}\u201D`);
      i++;
    }
    return out;
  }
  function splitNames(tokens) {
    const out = [];
    for (const tk of tokens) {
      if (tk.t !== "name" || FUNCS.has(tk.v) || SPECIAL.has(tk.v) || GREEK[tk.v] || tk.v === "mod") {
        out.push(tk);
        continue;
      }
      let rest = tk.v;
      while (rest) {
        const known = [...FUNCS, ...SPECIAL, ...Object.keys(GREEK)].filter((k) => rest.startsWith(k)).sort((a, b) => b.length - a.length)[0];
        const take = known || rest[0];
        out.push({ t: "name", v: take });
        rest = rest.slice(take.length);
      }
    }
    return out;
  }
  function parseMath(src) {
    const tokens = splitNames(tokenize(src));
    let p = 0;
    const peek = () => tokens[p];
    const isOp = (v2) => {
      var _a;
      return ((_a = peek()) == null ? void 0 : _a.t) === "op" && peek().v === v2;
    };
    const expect = (v2) => {
      if (!isOp(v2)) throw new Error(peek() ? `Expected \u201C${v2}\u201D before \u201C${peek().v}\u201D` : `Missing \u201C${v2}\u201D`);
      p++;
    };
    const startsAtom = () => {
      const tk = peek();
      return tk && (tk.t === "num" || tk.t === "name" || tk.t === "op" && (tk.v === "(" || tk.v === "|"));
    };
    const relation = () => {
      var _a;
      let left = additive();
      while (((_a = peek()) == null ? void 0 : _a.t) === "op" && RELATIONS[peek().v]) {
        const op = tokens[p++].v;
        left = { k: "bin", op: RELATIONS[op], a: left, b: additive() };
      }
      return left;
    };
    const additive = () => {
      let left = term();
      while (isOp("+") || isOp("-") || isOp("\xB1")) {
        const op = tokens[p++].v;
        left = { k: "bin", op: op === "-" ? "\u2212" : op, a: left, b: term() };
      }
      return left;
    };
    const term = () => {
      var _a;
      let left = unary();
      for (; ; ) {
        if (isOp("*")) {
          p++;
          left = { k: "mul", a: left, b: unary(), shown: true };
        } else if (isOp("/")) {
          p++;
          left = { k: "frac", a: left, b: unary() };
        } else if (((_a = peek()) == null ? void 0 : _a.t) === "name" && peek().v === "mod") {
          p++;
          left = { k: "bin", op: "mod", a: left, b: unary() };
        } else if (startsAtom() && !(isOp("|") && openBars > 0)) {
          left = { k: "mul", a: left, b: unary() };
        } else return left;
      }
    };
    const unary = () => {
      if (isOp("-") || isOp("+") || isOp("\xB1")) {
        const op = tokens[p++].v;
        return { k: "neg", op: op === "-" ? "\u2212" : op, a: unary() };
      }
      return power();
    };
    const power = () => {
      const base = postfix();
      if (isOp("^")) {
        p++;
        return { k: "sup", a: base, b: unary() };
      }
      return base;
    };
    const postfix = () => {
      let node = atom();
      for (; ; ) {
        if (isOp("!") || isOp("%") || isOp("\xB0")) node = { k: "post", a: node, op: tokens[p++].v };
        else if (isOp("_")) {
          p++;
          node = { k: "sub", a: node, b: atom() };
        } else return node;
      }
    };
    let openBars = 0;
    const args = () => {
      expect("(");
      const list = [relation()];
      while (isOp(",")) {
        p++;
        list.push(relation());
      }
      expect(")");
      return list;
    };
    const atom = () => {
      const tk = peek();
      if (!tk) throw new Error("Something is missing at the end");
      if (tk.t === "num") {
        p++;
        return { k: "num", v: tk.v };
      }
      if (tk.t === "op" && tk.v === "(") {
        p++;
        const inner = relation();
        expect(")");
        return { k: "group", a: inner };
      }
      if (tk.t === "op" && tk.v === "|") {
        p++;
        openBars++;
        const inner = relation();
        openBars--;
        expect("|");
        return { k: "abs", a: inner };
      }
      if (tk.t === "name") {
        p++;
        const v2 = tk.v;
        if (SPECIAL.has(v2) || FUNCS.has(v2)) {
          let sub = null;
          if (isOp("_")) {
            p++;
            sub = atom();
          }
          if (SPECIAL.has(v2)) {
            if (v2 === "sqrt" && !isOp("(")) return { k: "sqrt", a: postfix() };
            const list = args();
            if (v2 === "sqrt" || v2 === "abs") return { k: v2, a: list[0] };
            return { k: v2, args: list, sub };
          }
          const a = isOp("(") ? args() : [power()];
          return { k: "fn", name: v2, args: a, sub };
        }
        return { k: "id", v: GREEK[v2] || v2 };
      }
      throw new Error(`Unexpected \u201C${tk.v}\u201D`);
    };
    if (!tokens.length) return null;
    const tree = relation();
    if (p < tokens.length) throw new Error(`Unexpected \u201C${tokens[p].v}\u201D`);
    return tree;
  }
  var mo = (s) => `<mo>${esc(s)}</mo>`;
  var mrow = (s) => `<mrow>${s}</mrow>`;
  var strip = (n) => n && n.k === "group" ? n.a : n;
  var paren = (s) => mrow(`${mo("(")}${s}${mo(")")}`);
  var startsWithNumber = (n) => {
    while (n && ["mul", "bin", "frac", "sup", "sub", "post"].includes(n.k)) n = n.a;
    return (n == null ? void 0 : n.k) === "num" || (n == null ? void 0 : n.k) === "neg";
  };
  function ml(n) {
    if (!n) return "";
    switch (n.k) {
      case "num":
        return `<mn>${esc(n.v)}</mn>`;
      case "id":
        return `<mi>${esc(n.v)}</mi>`;
      case "group":
        return paren(ml(n.a));
      case "bin":
        return mrow(`${ml(n.a)}${mo(n.op)}${ml(n.b)}`);
      case "neg":
        return mrow(`${mo(n.op)}${ml(n.a)}`);
      case "mul":
        return mrow(`${ml(n.a)}${n.shown && startsWithNumber(n.b) ? mo("\xD7") : "<mo>&#x2062;</mo>"}${ml(n.b)}`);
      case "frac":
        return `<mfrac>${mrow(ml(strip(n.a)))}${mrow(ml(strip(n.b)))}</mfrac>`;
      case "sup": {
        const base = ["frac", "bin", "neg", "mul", "sup"].includes(n.a.k) ? paren(ml(n.a)) : ml(n.a);
        return `<msup>${mrow(base)}${mrow(ml(strip(n.b)))}</msup>`;
      }
      case "sub":
        return `<msub>${mrow(ml(n.a))}${mrow(ml(strip(n.b)))}</msub>`;
      case "post":
        return mrow(`${ml(n.a)}${mo(n.op)}`);
      case "abs":
        return mrow(`${mo("|")}${ml(n.a)}${mo("|")}`);
      case "sqrt":
        return `<msqrt>${ml(n.a)}</msqrt>`;
      case "cbrt":
        return `<mroot>${mrow(ml(n.args[0]))}<mn>3</mn></mroot>`;
      case "root":
        return n.args.length > 1 ? `<mroot>${mrow(ml(n.args[1]))}${mrow(ml(n.args[0]))}</mroot>` : `<msqrt>${ml(n.args[0])}</msqrt>`;
      case "fn": {
        const inv = INVERSE[n.name];
        let name = inv ? `<msup><mi>${inv}</mi><mrow><mo>\u2212</mo><mn>1</mn></mrow></msup>` : `<mi>${n.name}</mi>`;
        if (n.sub) name = `<msub>${name}${mrow(ml(strip(n.sub)))}</msub>`;
        const one = n.args.length === 1 && ["id", "num"].includes(n.args[0].k);
        const inner = n.args.map(ml).join(mo(","));
        return mrow(`${name}<mo>&#x2061;</mo>${one ? inner : paren(inner)}`);
      }
      case "sum":
      case "prod": {
        const [lo, hi, body] = n.args.length === 3 ? n.args : [null, null, n.args[0]];
        const sign = n.k === "sum" ? "\u2211" : "\u220F";
        const op = lo ? `<munderover>${mo(sign)}${mrow(ml(lo))}${mrow(ml(hi))}</munderover>` : mo(sign);
        return mrow(`${op}${ml(body)}`);
      }
      case "int": {
        const a = n.args;
        const [lo, hi, body, v2] = a.length >= 3 ? a : [null, null, a[0], a[1]];
        const sign = lo ? `<msubsup>${mo("\u222B")}${mrow(ml(lo))}${mrow(ml(hi))}</msubsup>` : mo("\u222B");
        return mrow(`${sign}${ml(body)}${v2 ? `<mo>&#x2062;</mo><mi>d</mi>${ml(v2)}` : ""}`);
      }
      case "lim": {
        const [under, body] = n.args;
        return mrow(`<munder><mi>lim</mi>${mrow(ml(under))}</munder>${ml(body)}`);
      }
      case "diff": {
        const [body, v2] = n.args;
        return mrow(`<mfrac><mi>d</mi>${mrow(`<mi>d</mi>${ml(v2 || { k: "id", v: "x" })}`)}</mfrac>${["group", "id", "num"].includes(body.k) ? ml(body) : paren(ml(body))}`);
      }
      case "ncr":
        return paren(`<mfrac linethickness="0">${mrow(ml(n.args[0]))}${mrow(ml(n.args[1]))}</mfrac>`);
      case "npr":
        return `<mmultiscripts><mi>P</mi>${mrow(ml(n.args[1]))}<none/><mprescripts/>${mrow(ml(n.args[0]))}<none/></mmultiscripts>`;
      default:
        return "";
    }
  }
  function toMathML(src, { block = false } = {}) {
    const tree = parseMath(src);
    return `<math${block ? ' display="block"' : ""} alttext="${esc(String(src).trim())}">${tree ? ml(tree) : ""}</math>`;
  }
  function initMathViews(root) {
    for (const el of $$("[data-xz-math]", root)) {
      if (ready(el, "Math")) continue;
      const src = el.getAttribute("data-xz-math") || el.textContent;
      el.classList.add("xz-math");
      try {
        el.innerHTML = toMathML(src, { block: el.classList.contains("xz-math--block") });
      } catch (err) {
        el.classList.add("is-error");
        el.title = err.message;
      }
    }
  }
  var KEYS = {
    "123": [
      ["7", "7"],
      ["8", "8"],
      ["9", "9"],
      ["\xF7", "/", "divide", "op"],
      ["(", "(", "open bracket", "op"],
      [")", ")", "close bracket", "op"],
      ["4", "4"],
      ["5", "5"],
      ["6", "6"],
      ["\xD7", "*", "times", "op"],
      ["x\xB2", "^2", "squared", "op"],
      ["x\u207F", "^(|)", "power", "op"],
      ["1", "1"],
      ["2", "2"],
      ["3", "3"],
      ["\u2212", "-", "minus", "op"],
      ["\u221A", "sqrt(|)", "square root", "op"],
      ["a/b", "(|)/()", "fraction", "op"],
      ["0", "0"],
      [".", ".", "point"],
      ["\u03C0", "pi", "pi"],
      ["+", "+", "plus", "op"],
      ["=", "=", "equals", "op"],
      ["x", "x", "x"]
    ],
    "f(x)": [
      ["sin", "sin(|)", "sine", "fn"],
      ["cos", "cos(|)", "cosine", "fn"],
      ["tan", "tan(|)", "tangent", "fn"],
      ["sin\u207B\xB9", "asin(|)", "inverse sine", "fn"],
      ["cos\u207B\xB9", "acos(|)", "inverse cosine", "fn"],
      ["tan\u207B\xB9", "atan(|)", "inverse tangent", "fn"],
      ["ln", "ln(|)", "natural log", "fn"],
      ["log", "log(|)", "log", "fn"],
      ["log\u2090", "log_(|)()", "log to a base", "fn"],
      ["e\u02E3", "e^(|)", "e to the power", "fn"],
      ["10\u02E3", "10^(|)", "10 to the power", "fn"],
      ["x\u207B\xB9", "^(-1)", "inverse", "fn"],
      ["|x|", "abs(|)", "absolute value", "fn"],
      ["n!", "!", "factorial", "fn"],
      ["\u221B", "cbrt(|)", "cube root", "fn"],
      ["\u207F\u221A", "root(|, )", "nth root", "fn"],
      ["%", "%", "per cent", "fn"],
      ["\xB0", "\xB0", "degrees", "fn"],
      ["x\u2099", "_(|)", "subscript", "fn"],
      ["min", "min(|, )", "minimum", "fn"],
      ["max", "max(|, )", "maximum", "fn"],
      ["round", "round(|)", "round", "fn"],
      ["gcd", "gcd(|, )", "greatest common divisor", "fn"],
      ["mod", " mod ", "modulo", "fn"]
    ],
    "\u2211": [
      ["\u2211", "sum(k=1, n, |)", "sum", "op"],
      ["\u220F", "prod(k=1, n, |)", "product", "op"],
      ["\u222B", "int(|, x)", "integral", "op"],
      ["\u222B\u2090\u1D47", "int(a, b, |, x)", "definite integral", "op"],
      ["lim", "lim(x->0, |)", "limit", "op"],
      ["d/dx", "diff(|, x)", "derivative", "op"],
      ["\u221E", "inf", "infinity"],
      ["\u2264", "<=", "less than or equal", "op"],
      ["\u2265", ">=", "greater than or equal", "op"],
      ["\u2260", "!=", "not equal", "op"],
      ["\u2248", "\u2248", "roughly equal", "op"],
      ["\xB1", "\xB1", "plus or minus", "op"],
      ["nCr", "ncr(|, )", "combinations", "fn"],
      ["nPr", "npr(|, )", "permutations", "fn"],
      ["<", "<", "less than", "op"],
      [">", ">", "greater than", "op"],
      ["\u2192", "->", "tends to", "op"],
      [",", ", ", "comma", "op"],
      ["\u03B8", "theta", "theta"],
      ["\u03B1", "alpha", "alpha"],
      ["\u03B2", "beta", "beta"],
      ["\u03BB", "lambda", "lambda"],
      ["\u03BC", "mu", "mu"],
      ["\u03C9", "omega", "omega"]
    ],
    abc: "xyztnkabcmpre".split("").map((l) => [l, l, l]).concat([["f(x)", "f(|)", "f of"], ["g(x)", "g(|)", "g of"], ["\u0394", "Delta", "delta"], ["\u03C3", "sigma", "sigma"], ["\u03C6", "phi", "phi"], ["i", "i", "i"], ["(", "(", "open bracket", "op"], [")", ")", "close bracket", "op"], [",", ", ", "comma", "op"], ["=", "=", "equals", "op"], ["+", "+", "plus", "op"]])
  };
  var EDIT = [["\u2190", "left", "Move left"], ["\u2192", "right", "Move right"], ["\u232B", "back", "Delete"], ["AC", "clear", "Clear all"], ["Done", "done", "Done"]];
  function insert(input, template) {
    var _a, _b;
    const start = (_a = input.selectionStart) != null ? _a : input.value.length;
    const end = (_b = input.selectionEnd) != null ? _b : start;
    const picked = input.value.slice(start, end);
    const at = template.indexOf("|");
    const text = at < 0 ? template : template.slice(0, at) + picked + template.slice(at + 1);
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const caret = start + (at < 0 ? text.length : at + picked.length);
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function initPads(root) {
    for (const pad of $$("[data-xz-mathpad]", root)) {
      if (ready(pad, "Mathpad")) continue;
      const input = document.getElementById(pad.getAttribute("data-xz-mathpad"));
      if (!input) continue;
      pad.classList.add("xz-mathpad");
      if (!pad.hasAttribute("aria-label")) pad.setAttribute("aria-label", "Maths keypad");
      pad.setAttribute("role", "group");
      const id = nextId("mathpad");
      const names = Object.keys(KEYS);
      const tabs = `<div class="xz-mathpad__tabs" role="tablist" aria-label="Key sets">${names.map((n, i) => `<button class="xz-mathpad__tab" type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(n)}</button>`).join("")}</div>`;
      const panels = names.map((n, i) => `<div class="xz-mathpad__keys" role="tabpanel" id="${id}-p${i}" aria-labelledby="${id}-t${i}"${i ? " hidden" : ""}>${KEYS[n].map(([label, value, spoken, kind]) => `<button class="xz-mathpad__key${kind ? ` xz-mathpad__key--${kind}` : ""}" type="button" data-insert="${esc(value)}"${spoken && spoken !== label ? ` aria-label="${esc(spoken)}"` : ""}>${esc(label)}</button>`).join("")}</div>`).join("");
      const edit = `<div class="xz-mathpad__keys" style="--xz-mathpad-cols: 6">${EDIT.map(([label, act, spoken]) => `<button class="xz-mathpad__key xz-mathpad__key--${act === "done" ? "done xz-mathpad__key--wide" : "edit"}" type="button" data-edit="${act}" aria-label="${spoken}">${label}</button>`).join("")}</div>`;
      pad.innerHTML = tabs + panels + edit;
      const tabEls = $$('[role="tab"]', pad);
      const choose = (tab, focus) => {
        tabEls.forEach((t, i) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(`${id}-p${i}`).hidden = !on;
        });
        if (focus) tab.focus();
      };
      $('[role="tablist"]', pad).addEventListener("keydown", (e) => {
        const i = tabEls.indexOf(document.activeElement);
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabEls.length - 1 }[e.key];
        if (to === void 0) return;
        e.preventDefault();
        choose(tabEls[(to + tabEls.length) % tabEls.length], true);
      });
      pad.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".xz-mathpad__key") && document.activeElement === input) e.preventDefault();
      });
      pad.addEventListener("click", (e) => {
        var _a, _b, _c;
        const tab = e.target.closest('[role="tab"]');
        if (tab) return choose(tab);
        const key = e.target.closest(".xz-mathpad__key");
        if (!key) return;
        const pos = (_a = input.selectionStart) != null ? _a : input.value.length;
        if (key.dataset.insert !== void 0) insert(input, key.dataset.insert);
        else if (key.dataset.edit === "left" || key.dataset.edit === "right") {
          const to = Math.max(0, Math.min(input.value.length, pos + (key.dataset.edit === "left" ? -1 : 1)));
          input.setSelectionRange(to, to);
        } else if (key.dataset.edit === "back") {
          const end = (_b = input.selectionEnd) != null ? _b : pos;
          const from = end > pos ? pos : Math.max(0, pos - 1);
          input.value = input.value.slice(0, from) + input.value.slice(end);
          input.setSelectionRange(from, from);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (key.dataset.edit === "clear") {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (key.dataset.edit === "done") {
          fire(pad, "xz:done", { value: input.value });
          (_c = pad.xzClose) == null ? void 0 : _c.call(pad);
          input.focus();
        }
      });
    }
  }
  function initFields2(root) {
    for (const el of $$("[data-xz-mathfield]", root)) {
      if (ready(el, "Mathfield")) continue;
      const input = $(".xz-mathfield__input", el) || $("input", el);
      const preview = $(".xz-mathfield__preview", el);
      const toggle = $("[data-xz-mathpad-toggle]", el);
      const pad = $("[data-xz-mathpad]", el);
      if (!input) continue;
      let frame = 0;
      const draw = () => {
        frame = 0;
        if (!preview) return;
        const text = input.value.trim();
        preview.classList.remove("is-error");
        if (!text) {
          preview.textContent = "";
          return;
        }
        try {
          preview.innerHTML = toMathML(text, { block: true });
          input.removeAttribute("aria-invalid");
        } catch (err) {
          preview.classList.add("is-error");
          preview.textContent = err.message;
        }
      };
      input.addEventListener("input", () => frame || (frame = requestAnimationFrame(draw)));
      input.addEventListener("change", () => {
        try {
          parseMath(input.value);
          input.removeAttribute("aria-invalid");
        } catch {
          if (input.value.trim()) input.setAttribute("aria-invalid", "true");
        }
      });
      if (toggle && pad) {
        const keyboard = input.getAttribute("inputmode");
        const show = (on) => {
          pad.hidden = !on;
          toggle.setAttribute("aria-expanded", String(on));
          if (on) input.setAttribute("inputmode", "none");
          else if (keyboard) input.setAttribute("inputmode", keyboard);
          else input.removeAttribute("inputmode");
        };
        pad.id || (pad.id = nextId("mathpad"));
        toggle.setAttribute("aria-controls", pad.id);
        pad.xzClose = () => show(false);
        toggle.addEventListener("click", () => show(pad.hidden));
        show(!pad.hidden);
      }
      el.xzMathfield = { value: () => input.value, set: (v2) => (input.value = v2, draw()) };
      draw();
    }
  }
  function initMath(root) {
    initMathViews(root);
    initPads(root);
    initFields2(root);
  }

  // src/js/tools/text.js
  var target = (btn, attr) => {
    var _a;
    return document.querySelector(btn.getAttribute(attr) || "") || ((_a = btn.closest(".xz-textbox")) == null ? void 0 : _a.querySelector("textarea, input"));
  };
  var segmenter = (granularity) => typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(void 0, { granularity }) : null;
  var graphemes = segmenter("grapheme");
  var letters = (s) => graphemes ? [...graphemes.segment(s)].map((x) => x.segment) : [...s];
  var wordCount = (s) => (s.trim().match(/\S+/g) || []).length;
  var plural = (n, one) => `${n.toLocaleString("en-IN")} ${one}${n === 1 ? "" : "s"}`;
  function changed(field) {
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function initText(root, { toast }) {
    var _a;
    for (const btn of $$("[data-xz-paste]", root)) {
      if (ready(btn, "Paste")) continue;
      if (!((_a = navigator.clipboard) == null ? void 0 : _a.readText)) {
        btn.hidden = true;
        continue;
      }
      btn.addEventListener("click", async () => {
        var _a2, _b, _c;
        const field = target(btn, "data-xz-paste");
        if (!field) return;
        try {
          const text = await navigator.clipboard.readText();
          const start = (_a2 = field.selectionStart) != null ? _a2 : field.value.length;
          const end = (_b = field.selectionEnd) != null ? _b : start;
          field.value = field.value.slice(0, start) + text + field.value.slice(end);
          field.focus();
          (_c = field.setSelectionRange) == null ? void 0 : _c.call(field, start + text.length, start + text.length);
          changed(field);
        } catch {
          toast == null ? void 0 : toast({ message: "The browser kept the clipboard closed. Click in the box and press Ctrl+V to paste.", variant: "info" });
          field.focus();
        }
      });
    }
    for (const btn of $$("[data-xz-clear]", root)) {
      if (ready(btn, "Clear")) continue;
      btn.addEventListener("click", () => {
        const field = target(btn, "data-xz-clear");
        if (!field) return;
        field.value = "";
        field.focus();
        changed(field);
      });
    }
    for (const btn of $$("[data-xz-share]", root)) {
      if (ready(btn, "Share") || !navigator.share) continue;
      btn.addEventListener("click", async () => {
        const src = document.querySelector(btn.getAttribute("data-xz-share") || "");
        const text = src ? "value" in src && typeof src.value === "string" ? src.value : src.textContent.trim() : "";
        try {
          await navigator.share({ title: btn.dataset.xzShareTitle || document.title, text, ...btn.dataset.xzShareUrl ? { url: btn.dataset.xzShareUrl } : {} });
        } catch {
        }
      });
    }
    for (const out of $$("[data-xz-count]", root)) {
      if (ready(out, "Count")) continue;
      const field = document.querySelector(out.getAttribute("data-xz-count"));
      if (!field) continue;
      const max = Number(out.dataset.xzMax || field.maxLength) || 0;
      const update = () => {
        const n = letters(field.value).length;
        out.textContent = `${plural(n, "character")}${max > 0 ? ` of ${max.toLocaleString("en-IN")}` : ""} \xB7 ${plural(wordCount(field.value), "word")}`;
        out.classList.toggle("xz-text-danger", max > 0 && n > max);
      };
      field.addEventListener("input", update);
      update();
    }
    for (const el of $$("[data-xz-glyphs]", root)) {
      if (ready(el, "Glyphs")) continue;
      el.classList.add("xz-glyphs");
      const source = el.getAttribute("data-xz-glyphs") ? document.querySelector(el.getAttribute("data-xz-glyphs")) : null;
      const max = Number(el.dataset.xzMax || 40);
      const sr = Object.assign(document.createElement("span"), { className: "xz-sr-only" });
      const draw = (text) => {
        el.textContent = "";
        const list = letters(text).slice(0, max);
        for (const ch of list) {
          const tile = Object.assign(document.createElement("span"), { className: `xz-glyphs__tile${/\s/.test(ch) ? " xz-glyphs__tile--space" : ""}`, textContent: /\s/.test(ch) ? "" : ch });
          tile.setAttribute("aria-hidden", "true");
          el.append(tile);
        }
        sr.textContent = text;
        if (!source) el.append(sr);
        fire(el, "xz:glyphs", { letters: list });
      };
      if (source) {
        el.setAttribute("aria-hidden", "true");
        source.addEventListener("input", () => draw(source.value));
        draw(source.value);
      } else draw(el.textContent.trim());
    }
    for (const el of $$("[data-xz-filefield]", root)) {
      const input = $('input[type="file"]', el);
      if (!input || ready(el, "Filefield")) continue;
      const name = $(".xz-filefield__name", el);
      const empty = (name == null ? void 0 : name.textContent.trim()) || "None";
      const show = () => {
        const files = [...input.files];
        if (name) name.textContent = !files.length ? empty : files.length === 1 ? files[0].name : `${files.length} files`;
        el.classList.toggle("has-file", files.length > 0);
      };
      input.addEventListener("change", show);
      show();
    }
  }

  // src/js/tools/index.js
  var plugin = {
    name: "tools",
    init(root, helpers) {
      initSplits(root, helpers);
      initMenubars(root, helpers);
      initDuallists(root, helpers);
      initReadouts(root, helpers);
      initTimers(root, helpers);
      initPapers(root, helpers);
      initBeforeAfter(root, helpers);
      initColors(root, helpers);
      initMath(root, helpers);
      initText(root, helpers);
    },
    api: { color, math: { toMathML, parse: parseMath }, letters }
  };
  var index_default = plugin;
  if (typeof window !== "undefined") {
    if (window.Xsenze && typeof window.Xsenze.use === "function") window.Xsenze.use(plugin);
    else (window.XsenzePlugins = window.XsenzePlugins || []).push(plugin);
  }
  return __toCommonJS(index_exports);
})();
