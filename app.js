const qs = (s) => document.querySelector(s);
const el = (t, p = {}) => {
  const n = document.createElement(t);
  Object.entries(p).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  });
  return n;
};

const safeStr = (x) => (x == null ? "" : String(x));
const joinClass = (...parts) => parts.filter(Boolean).join(" ");
let SCHEMA = null;
let MEM_AUTH = null;
const STORE = {
  get auth() {
    try {
      const ss = JSON.parse(sessionStorage.getItem("ekg_auth") || "null");
      return ss || MEM_AUTH;
    } catch { return MEM_AUTH; }
  },
  set auth(v) {
    MEM_AUTH = v || { ok: true };
    try { sessionStorage.setItem("ekg_auth", JSON.stringify(MEM_AUTH)); } catch {}
  }
};
const DEMO_CREDS = { password: "Curso2026!" };
const checkCredentials = (u, p) => {
  // Usuario especial Creador
  if (u === "Creador" && p === "12345678") return true;

  if (p !== DEMO_CREDS.password) return false;
  const match = u.match(/^LatidoAsistido(\d+)$/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  return num >= 1 && num <= 100;
};
const resolveHref = (href) => {
  if (!href) return "#";
  if (href.startsWith("/")) return `#${href}`;
  if (href.startsWith("#")) return href;
  return href;
};

const renderText = (v) => el("p", { text: safeStr(v) });
const renderHeading = (v, level = 2) => el(`h${Math.min(6, Math.max(1, level))}`, { text: safeStr(v) });
const renderImage = (v) => el("img", { src: safeStr(v.src || v.url || v), alt: safeStr(v.alt || ""), class: "img" });
const renderVideo = (v) => {
  const src = v.src || v.url || v;
  const iframe = el("iframe", { src, class: "video", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowfullscreen: "true" });
  return iframe;
};
const renderList = (arr) => {
  const ul = el("ul", { class: "list" });
  arr.forEach((item) => ul.appendChild(renderNode(item)));
  return ul;
};
const renderGrid = (arr) => {
  const g = el("div", { class: "grid" });
  arr.forEach((item) => g.appendChild(renderCard(item)));
  return g;
};
const renderCard = (obj) => {
  const c = el("div", { class: "card" });
  c.appendChild(renderNode(obj));
  return c;
};

const renderKeyValue = (obj) => {
  const wrap = el("div", { class: "card" });
  Object.entries(obj).forEach(([k, v]) => {
    const row = el("div");
    const label = el("strong", { text: k + ": " });
    row.appendChild(label);
    row.appendChild(renderNode(v));
    wrap.appendChild(row);
  });
  return wrap;
};

const renderSection = (section) => {
  const frag = document.createDocumentFragment();
  if (section.title) frag.appendChild(renderHeading(section.title, 2));
  if (section.description) frag.appendChild(renderText(section.description));

  if (Array.isArray(section.items)) frag.appendChild(renderList(section.items));
  if (Array.isArray(section.cards)) frag.appendChild(renderGrid(section.cards));
  if (section.content != null) frag.appendChild(renderNode(section.content));
  return frag;
};

const renderLoginForm = (auth) => {
  const form = el("form", { class: "card" });
  (auth.fields || []).forEach((f) => {
    const w = el("div", { class: "form-row" });
    w.appendChild(el("label", { for: f.name, text: safeStr(f.label || f.name) }));
    const input = el("input", { id: f.name, name: f.name, type: f.type || "text", required: f.required ? "true" : undefined, minlength: f.minLength || undefined, placeholder: f.placeholder || "" });
    w.appendChild(input);
    form.appendChild(w);
  });
  const btn = el("button", { type: "submit", class: "btn btn-primary", text: "Ingresar" });
  const err = el("p", { class: "muted", text: "" });
  err.style.color = "#8b1d1d";
  form.appendChild(btn);
  form.appendChild(err);
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const u = form.querySelector("#username")?.value || form.querySelector("#email")?.value || "";
    const p = form.querySelector("#password")?.value || "";
    if (checkCredentials(u, p)) {
      STORE.auth = { ok: true, user: u };
      const pr = SCHEMA?.auth?.protectedRoute;
      if (pr) navigateTo(pr);
    } else {
      err.textContent = "Usuario o contraseña inválidos";
    }
  });
  return form;
};

const renderHeroV2 = (node) => {
  const h = el("section", { class: joinClass("hero", node.wrapperClass) });
  if (node.title) h.appendChild(renderHeading(node.title, 2));
  if (node.subtitle) h.appendChild(el("p", { class: "muted", text: safeStr(node.subtitle) }));
  if (Array.isArray(node.bulletPoints)) h.appendChild(renderList(node.bulletPoints));
  if (node.ctaPrimary) h.appendChild(el("a", { href: resolveHref(node.ctaPrimary.href), class: joinClass("btn btn-primary", node.ctaPrimary.class), text: safeStr(node.ctaPrimary.label || "Ver más") }));
  if (node.ctaSecondary) h.appendChild(el("a", { href: resolveHref(node.ctaSecondary.href), target: node.ctaSecondary.target || undefined, class: joinClass("btn btn-outline-secondary", node.ctaSecondary.class), text: safeStr(node.ctaSecondary.label || "Acción") }));
  return h;
};

const renderCardsRow = (node) => {
  const row = el("div", { class: joinClass("row", node.rowClass) });
  (node.cards || []).forEach((c) => {
    const col = el("div", { class: joinClass("col", c.class) });
    const card = el("div", { class: "card" });
    const ph = el("div", { class: "img-ph" });
    card.appendChild(ph);
    if (c.title) card.appendChild(renderHeading(c.title, 3));
    if (c.text) card.appendChild(renderText(c.text));
    col.appendChild(card);
    row.appendChild(col);
  });
  return row;
};

const renderModulesOverview = (node) => {
  const container = el("div", { class: joinClass("row", node.rowClass) });
  const modules = SCHEMA?.modules || [];
  modules.forEach((m, idx) => {
    const col = el("div", { class: joinClass("col", node.moduleCardClass) });
    const card = el("div", { class: "card" });
    card.appendChild(renderHeading(`${node.showIndex ? `${idx + 1}. ` : ""}${m.title}`, 4));
    if (m.tagline) card.appendChild(el("p", { class: "muted", text: m.tagline }));
    col.appendChild(card);
    container.appendChild(col);
  });
  return container;
};

const renderHeaderBlock = (node) => {
  const wrap = el("div", { class: "card" });
  if (node.title) wrap.appendChild(renderHeading(node.title, 2));
  if (node.subtitle) wrap.appendChild(el("p", { class: "muted", text: safeStr(node.subtitle) }));
  if (Array.isArray(node.breadcrumb)) wrap.appendChild(renderList(node.breadcrumb.map(b => b.label)));
  return wrap;
};

const renderAccordion = (node) => {
  const acc = el("div", { class: joinClass("accordion", node.accordionClass), id: node.accordionId || "acc" });
  const list = node.source ? (SCHEMA?.[node.source] || []) : (SCHEMA?.modules || []);
  list.forEach((m) => {
    const item = el("div", { class: "accordion-item" });
    const header = el("div", { class: "accordion-header" });
    const titleField = node.itemTitleField || "title";
    const btn = el("button", { class: "accordion-button", text: `${m[titleField]}` });
    header.appendChild(btn);
    const panel = el("div", { class: "accordion-body" });
    const hasSegments = Array.isArray(m.segments) && m.segments.length;
    const hasSyllabus = Array.isArray(m.contents);
    if (hasSegments) {
      m.segments.forEach((seg) => {
        const segCard = el("div", { class: "card" });
        segCard.appendChild(renderHeading(seg.label || seg.type, 4));
        if (seg.description) segCard.appendChild(renderText(seg.description));
        panel.appendChild(segCard);
      });
    }
    if (hasSyllabus) panel.appendChild(renderList(m.contents));
    if (m.objective) panel.appendChild(el("p", { class: "muted", text: `Objetivo: ${m.objective}` }));
    btn.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      if (open) panel.style.display = "block"; else panel.style.display = "none";
    });
    item.appendChild(header);
    item.appendChild(panel);
    if (node.initialOpenId && m.id === node.initialOpenId) {
      item.classList.add("open");
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
    acc.appendChild(item);
  });
  return acc;
};

const renderTyped = (node) => {
  const type = node.type || node.kind;
  if (!type) return null;
  if (type === "text") return renderText(node.text || node.value);
  if (type === "heading") return renderHeading(node.text || node.value, node.level || 2);
  if (type === "image") return renderImage(node);
  if (type === "video") return renderVideo(node);
  if (type === "list") return renderList(node.items || []);
  if (type === "grid") return renderGrid(node.items || []);
  if (type === "card") return renderCard(node.content || node);
  if (type === "section") return renderSection(node);
  if (type === "hero") return renderHeroV2(node);
  if (type === "cardsRow") return renderCardsRow(node);
  if (type === "modulesOverview") return renderModulesOverview(node);
  if (type === "loginPanel") {
    const row = el("div", { class: joinClass("row", node.wrapperClass) });
    if (Array.isArray(node.columns) && node.columns.length) {
      (node.columns || []).forEach(col => {
        const c = el("div", { class: joinClass("col", col.class) });
        if (col.contentType === "text") {
          if (col.title) c.appendChild(renderHeading(col.title, 3));
          if (col.text) c.appendChild(renderText(col.text));
          if (Array.isArray(col.bullets)) c.appendChild(renderList(col.bullets));
        } else if (col.contentType === "embeddedForm" && col.formRef === "auth") {
          c.appendChild(renderLoginForm(SCHEMA.auth || {}));
        }
        row.appendChild(c);
      });
      return row;
    }
    row.appendChild(renderLoginForm(SCHEMA.auth || {}));
    return row;
  }
  if (type === "header") return renderHeaderBlock(node);
  if (type === "accordion") return renderAccordion(node);
  if (type === "html") {
    const d = el("div");
    d.innerHTML = node.html || "";
    return d;
  }
  return null;
};

const renderNode = (node) => {
  if (node == null) return el("span");
  if (typeof node === "string" || typeof node === "number") return renderText(node);
  if (Array.isArray(node)) return renderList(node);
  const typed = renderTyped(node);
  if (typed) return typed;
  return renderKeyValue(node);
};

const renderNav = (schema) => {
  const nav = qs("#site-nav");
  nav.innerHTML = "";
  const pages = schema.pages || [];
  pages.forEach((p, i) => {
    const route = p.route || `#/p-${i}`;
    const a = el("a", { href: `#${route.replace(/^#?/, "")}`, text: safeStr(p.title || `Sección ${i + 1}`) });
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      navigateTo(route);
      nav.querySelectorAll("a").forEach((n) => n.classList.remove("active"));
      a.classList.add("active");
    });
    nav.appendChild(a);
  });
};

// Nuevo: comportamiento genérico de acordeones
const setupAccordions = () => {
  document.querySelectorAll('.accordion-item .accordion-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const body = item?.querySelector('.accordion-body');
      if (!item || !body) return;
      const acc = item.closest('.accordion');
      if (!acc) return;

      const items = Array.from(acc.querySelectorAll('.accordion-item'));
      const isGrid = acc.classList.contains('accordion-grid');
      
      // Comportamiento exclusivo: cerrar todos los demás
      items.forEach((it) => { 
        if (it !== item) {
          it.classList.remove('open');
          if (isGrid) it.classList.remove('expanded');
        }
      });

      const willOpen = !item.classList.contains('open');
      item.classList.toggle('open', willOpen);
      if (isGrid) item.classList.toggle('expanded', willOpen);
      
      // Track Module Open
      if (willOpen && typeof ProgressTracker !== 'undefined') {
        // Use title as ID or index
        const title = item.querySelector('.accordion-btn-title')?.textContent || 'module_' + items.indexOf(item);
        ProgressTracker.track('modules', title);
      }

      const anyOpen = acc.querySelectorAll('.accordion-item.open').length > 0;
      const nav = document.querySelector('.site-nav');
      if (nav) {
        if (anyOpen) nav.classList.add('accent'); else nav.classList.remove('accent');
      }
    });
  });
};

// Nuevo: manejo de login en landing y curso
const setupAuth = () => {
  const handleSubmit = (form, onSuccess) => {
    const err = form.querySelector('.auth-error') || el('p', { class: 'muted' });
    if (!err.parentElement) form.appendChild(err);
    err.textContent = '';
    const process = () => {
      err.textContent = '';
      const u = (form.querySelector('#username')?.value || form.querySelector('#email')?.value || '').trim();
      const p = (form.querySelector('#password')?.value || '').trim();
      if (checkCredentials(u, p)) {
        STORE.auth = { ok: true, user: u };
        onSuccess?.();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        Array.from(form.querySelectorAll('input')).forEach(i => i.readOnly = true);
      } else {
        err.textContent = 'Usuario o contraseña inválidos';
      }
    };
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      process();
    });
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); process(); });
  };
  const landingForm = document.querySelector('form#landing-auth-form');
  if (landingForm) handleSubmit(landingForm, () => { try { landingForm.submit(); } catch { window.location.assign('curso.html'); } });
  const courseForm = document.querySelector('form#auth-form');
  if (courseForm) handleSubmit(courseForm, () => {
    updateProtectedViews();
    // Iniciar tracker de progreso inmediatamente tras login
    if (typeof ProgressTracker !== 'undefined') ProgressTracker.init();
    
    const loginArea = qs('#login-area');
    const ok = document.querySelector('#login-area .auth-ok') || el('p', { class: 'muted auth-ok', text: 'Acceso concedido' });
    ok.style.color = '#1368ff';
    if (loginArea && !ok.parentElement) loginArea.appendChild(ok);
    const content = qs('#course-content');
    if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

// Nuevo: alterna visibilidad según autenticación
const updateProtectedViews = () => {
  const requires = document.body.getAttribute('data-requires-auth') === 'true';
  if (!requires) return;
  const logged = !!STORE.auth;
  const loginArea = qs('#login-area');
  const courseContent = qs('#course-content');
  if (loginArea) loginArea.style.display = logged ? 'none' : 'block';
  if (courseContent) courseContent.style.display = logged ? 'block' : 'none';
};

const renderFooter = () => {
  const f = el("div", { class: "footer" });
  const icons = el("div", { class: "footer-icons" });
  
  const links = [
    {
      url: "https://latidoasistido.wixsite.com/lav1",
      svg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1368ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2c3 3 3 17 0 20"/><path d="M12 2c-3 3-3 17 0 20"/></svg>'
    },
    {
      url: "https://www.instagram.com/latidoasistido/",
      svg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1368ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/><path d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/><circle cx="17.5" cy="6.5" r="1.5" fill="#1368ff"/></svg>'
    },
    {
      url: "https://wa.me/+573508956163",
      svg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#1368ff" xmlns="http://www.w3.org/2000/svg"><path d="M12.048 2C6.6 2 2 6.603 2 12.053c0 2.122.571 4.127 1.651 5.894L2 22l4.168-1.093a10.028 10.028 0 0 0 5.88 1.897c5.446 0 10.048-4.603 10.048-10.053S17.494 2 12.048 2zm0 18.366a8.314 8.314 0 0 1-4.229-1.159l-.303-.18-2.519.66.67-2.465-.196-.314a8.316 8.316 0 0 1-1.266-4.42c0-4.602 3.741-8.344 8.338-8.344 4.597 0 8.338 3.742 8.338 8.344 0 4.602-3.741 8.344-8.333 8.344zm4.564-6.216c-.247-.123-1.461-.722-1.688-.804-.226-.083-.392-.123-.558.123-.165.247-.64.804-.784.968-.144.165-.289.185-.536.062-.247-.123-1.04-.383-1.98-1.22-.73-.65-1.224-1.453-1.368-1.7-.144-.247-.015-.38.108-.503.112-.111.247-.289.371-.433.123-.144.165-.247.247-.412.083-.165.042-.309-.02-.433-.062-.123-.557-1.343-.763-1.834-.201-.483-.404-.419-.558-.427l-.476-.01c-.165 0-.433.062-.66.309-.226.247-.86.842-.86 2.056s.88 2.383 1.004 2.549c.123.165 1.737 2.652 4.208 3.711.588.253 1.048.404 1.407.516.59.188 1.129.162 1.553.098.474-.071 1.461-.595 1.669-1.17.206-.575.206-1.068.144-1.17-.062-.103-.226-.165-.474-.288z"/></svg>'
    }
  ];

  links.forEach(link => {
    const a = el("a", { 
      href: link.url, 
      class: "footer-icon", 
      target: "_blank", 
      rel: "noopener noreferrer",
      html: link.svg 
    });
    icons.appendChild(a);
  });

  f.appendChild(icons);
  f.appendChild(el("p", { class: "footer-text", text: "Una plataforma de Latido Asistido" }));
  f.appendChild(el("p", { class: "footer-text", text: "Contenido educativo — No sustituye evaluación clínica. Autor: Dr. Luis Ángel Rueda Cuervo." }));
  return f;
};

const renderPage = (schema, index = 0) => {
  const root = qs("#app");
  root.innerHTML = "";
  const pages = schema.pages || [];
  const page = pages[index] || {};
  const needsAuth = !!page.requiresAuth && !!(schema.auth && schema.auth.enabled);
  if (needsAuth && !STORE.auth) {
    const warn = el("div", { class: "card" });
    warn.appendChild(renderHeading("Acceso restringido", 3));
    warn.appendChild(renderText("Inicia sesión para continuar."));
    const cont = el("div", { class: "container page-container" });
    cont.appendChild(warn);
    cont.appendChild(renderLoginForm(schema.auth));
    root.appendChild(cont);
    root.appendChild(renderFooter());
    return;
  }
  if (page.layout && Array.isArray(page.layout.sections)) {
    const cont = el("div", { class: joinClass(page.layout.containerClass || "container") });
    if (page.title) cont.appendChild(renderHeading(page.title, 2));
    page.layout.sections.forEach((s) => cont.appendChild(renderNode(s)));
    root.appendChild(cont);
    root.appendChild(renderFooter());
    return;
  }
  if (page.hero) root.appendChild(renderNode(page.hero));
  if (page.title) root.appendChild(renderHeading(page.title, 2));
  if (page.description) root.appendChild(renderText(page.description));
  if (Array.isArray(page.blocks)) page.blocks.forEach((b) => root.appendChild(renderNode(b)));
  if (page.content) root.appendChild(renderNode(page.content));
  if (!page.hero && !page.title && !page.description && !page.blocks && !page.content) root.appendChild(renderKeyValue(page));
  root.appendChild(renderFooter());
};

const routeIndex = (schema) => {
  const map = new Map();
  (schema.pages || []).forEach((p, i) => { if (p.route) map.set(p.route, i); });
  return map;
};

const navigateTo = (routeOrHash) => {
  const hash = routeOrHash.startsWith("#") ? routeOrHash : `#${routeOrHash}`;
  location.hash = hash;
  renderByHash();
};

const renderByHash = () => {
  const root = qs("#app");
  if (!SCHEMA) return;
  const map = routeIndex(SCHEMA);
  const h = location.hash || "";
  const route = h.replace(/^#/, "");
  let idx = 0;
  if (map.has(`/${route}`)) idx = map.get(`/${route}`);
  else if (map.has(`#/${route}`)) idx = map.get(`#/${route}`);
  else if (map.has(route)) idx = map.get(route);
  root.innerHTML = "";
  renderPage(SCHEMA, idx);
};

const applyMeta = (schema) => {
  const title = safeStr(schema.appName || schema.title || "Curso EKG-LA");
  const description = safeStr(schema.description || "");
  const footer = safeStr(schema.footer || "");
  document.title = title;
  const st = qs("#site-title"); if (st) st.textContent = title;
  const sd = qs("#site-description"); if (sd) sd.textContent = description;
  const sf = qs("#site-footer-text"); if (sf) sf.textContent = footer;
};

// Eliminado: carga de JSON. Trabajamos 100% con HTML.

// --- QUIZ LOGIC ---
const QUIZ_DATA = {
  "modulo_3": {
    "title": "Autoevaluación – Módulo 3: Desmenuzando el Trazado EKG",
    "instructions": "Responda las siguientes preguntas. Esta autoevaluación no tiene fines punitivos; su objetivo es reforzar conceptos clave del análisis del electrocardiograma. Tiempo estimado: 10–15 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. ¿Qué evento eléctrico representa la onda P?",
        "options": [
          { "text": "a) Despolarización ventricular", "isCorrect": false },
          { "text": "b) Repolarización ventricular", "isCorrect": false },
          { "text": "c) Despolarización auricular", "isCorrect": true },
          { "text": "d) Retraso auriculoventricular", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La onda P representa la despolarización auricular."
      },
      {
        "id": 2,
        "text": "2. El intervalo PR mide:",
        "options": [
          { "text": "a) Solo la conducción ventricular", "isCorrect": false },
          { "text": "b) El tiempo entre despolarización auricular y ventricular", "isCorrect": true },
          { "text": "c) La repolarización auricular", "isCorrect": false },
          { "text": "d) El tiempo total del ciclo cardíaco", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Incluye conducción auricular, nodo AV y sistema His."
      },
      {
        "id": 3,
        "text": "3. ¿Cuál es la diferencia principal entre segmento e intervalo?",
        "options": [
          { "text": "a) No hay diferencia", "isCorrect": false },
          { "text": "b) El segmento incluye ondas, el intervalo no", "isCorrect": false },
          { "text": "c) El intervalo incluye ondas y segmentos", "isCorrect": true },
          { "text": "d) El segmento mide frecuencia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El intervalo incluye ondas y segmentos."
      },
      {
        "id": 4,
        "text": "4. ¿Qué componente del EKG refleja mayor masa muscular?",
        "options": [
          { "text": "a) Onda P", "isCorrect": false },
          { "text": "b) Segmento ST", "isCorrect": false },
          { "text": "c) Complejo QRS", "isCorrect": true },
          { "text": "d) Onda T", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El QRS refleja la despolarización ventricular."
      },
      {
        "id": 5,
        "text": "5. El segmento ST normalmente debe ser:",
        "options": [
          { "text": "a) Elevado", "isCorrect": false },
          { "text": "b) Depresivo", "isCorrect": false },
          { "text": "c) Isoeléctrico", "isCorrect": true },
          { "text": "d) Variable", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El ST normal es isoeléctrico."
      },
      {
        "id": 6,
        "text": "6. Un QT prolongado se asocia principalmente a:",
        "options": [
          { "text": "a) Bradicardia sinusal", "isCorrect": false },
          { "text": "b) Riesgo de arritmias ventriculares", "isCorrect": true },
          { "text": "c) Bloqueo AV", "isCorrect": false },
          { "text": "d) Infarto posterior", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) El QT prolongado aumenta riesgo arrítmico."
      },
      {
        "id": 7,
        "text": "7. Identificar correctamente intervalos y segmentos es importante porque:",
        "options": [
          { "text": "a) Permite medir la frecuencia", "isCorrect": false },
          { "text": "b) Facilita diagnósticos precisos", "isCorrect": false },
          { "text": "c) Reduce errores de interpretación", "isCorrect": false },
          { "text": "d) Todas las anteriores", "isCorrect": true }
        ],
        "feedback": "Respuesta correcta: d) Todas las anteriores."
      },
      {
        "id": 8,
        "text": "8. Antes de interpretar un diagnóstico en el EKG, el primer paso debe ser:",
        "options": [
          { "text": "a) Buscar elevación del ST", "isCorrect": false },
          { "text": "b) Medir la frecuencia", "isCorrect": false },
          { "text": "c) Reconocer ondas, segmentos e intervalos", "isCorrect": true },
          { "text": "d) Identificar la arritmia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La base es reconocer correctamente el trazado."
      }
    ]
  },
  "modulo_4": {
    "title": "Autoevaluación – Módulo 4: Ritmos Cardíacos Bajo la Lupa",
    "instructions": "Responda las siguientes preguntas para reforzar el análisis sistemático del ritmo cardíaco en el EKG. Tiempo estimado: 10–15 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. El primer paso para analizar un ritmo en el EKG es:",
        "options": [
          { "text": "a) Identificar la arritmia", "isCorrect": false },
          { "text": "b) Medir la frecuencia", "isCorrect": false },
          { "text": "c) Evaluar si el ritmo es regular", "isCorrect": true },
          { "text": "d) Buscar elevación del ST", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Siempre se inicia evaluando la regularidad del ritmo."
      },
      {
        "id": 2,
        "text": "2. Un ritmo regular se caracteriza por:",
        "options": [
          { "text": "a) Intervalos R–R variables", "isCorrect": false },
          { "text": "b) Intervalos R–R constantes", "isCorrect": true },
          { "text": "c) Ausencia de onda P", "isCorrect": false },
          { "text": "d) QRS ancho", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Los intervalos R–R son constantes."
      },
      {
        "id": 3,
        "text": "3. Para considerar un ritmo como sinusal debe existir:",
        "options": [
          { "text": "a) QRS ancho", "isCorrect": false },
          { "text": "b) Onda P después del QRS", "isCorrect": false },
          { "text": "c) Onda P antes de cada QRS", "isCorrect": true },
          { "text": "d) Intervalo QT corto", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La onda P debe preceder a cada QRS."
      },
      {
        "id": 4,
        "text": "4. ¿Cuál es el rango normal de frecuencia cardíaca en un adulto en reposo?",
        "options": [
          { "text": "a) 40–60 lpm", "isCorrect": false },
          { "text": "b) 60–100 lpm", "isCorrect": true },
          { "text": "c) 100–140 lpm", "isCorrect": false },
          { "text": "d) >140 lpm", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) El rango normal es 60–100 lpm."
      },
      {
        "id": 5,
        "text": "5. Un ritmo irregular sin ondas P visibles sugiere principalmente:",
        "options": [
          { "text": "a) Ritmo sinusal", "isCorrect": false },
          { "text": "b) Taquicardia ventricular", "isCorrect": false },
          { "text": "c) Fibrilación auricular", "isCorrect": true },
          { "text": "d) Bloqueo AV", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La fibrilación auricular es irregular y sin onda P."
      },
      {
        "id": 6,
        "text": "6. El análisis del ritmo debe realizarse:",
        "options": [
          { "text": "a) Solo una vez", "isCorrect": false },
          { "text": "b) Solo en derivación II", "isCorrect": false },
          { "text": "c) De forma sistemática en todo EKG", "isCorrect": true },
          { "text": "d) Solo si hay síntomas", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Todo EKG requiere análisis sistemático del ritmo."
      },
      {
        "id": 7,
        "text": "7. La presencia de onda P con morfología constante indica:",
        "options": [
          { "text": "a) Ritmo ventricular", "isCorrect": false },
          { "text": "b) Ritmo auricular organizado", "isCorrect": true },
          { "text": "c) Ritmo caótico", "isCorrect": false },
          { "text": "d) Isquemia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Indica activación auricular organizada."
      },
      {
        "id": 8,
        "text": "8. Antes de nombrar una arritmia, es más importante:",
        "options": [
          { "text": "a) Confirmar el diagnóstico exacto", "isCorrect": false },
          { "text": "b) Evaluar estabilidad clínica", "isCorrect": true },
          { "text": "c) Medir el QT", "isCorrect": false },
          { "text": "d) Calcular el eje", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) La estabilidad clínica define la conducta."
      }
    ]
  },
  "modulo_5": {
    "title": "Autoevaluación – Módulo 5: Comprendiendo las Arritmias",
    "instructions": "Esta autoevaluación tiene como objetivo reforzar el reconocimiento y la clasificación inicial de las arritmias desde un enfoque clínico. No es punitiva. Tiempo estimado: 10–15 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. Ante una taquicardia, el primer criterio que debe evaluarse en el EKG es:",
        "options": [
          { "text": "a) La morfología de la onda T", "isCorrect": false },
          { "text": "b) El eje eléctrico", "isCorrect": false },
          { "text": "c) El ancho del QRS", "isCorrect": true },
          { "text": "d) El intervalo QT", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El ancho del QRS define el primer gran grupo de arritmias."
      },
      {
        "id": 2,
        "text": "2. Un QRS estrecho sugiere que el origen de la arritmia es:",
        "options": [
          { "text": "a) Ventricular", "isCorrect": false },
          { "text": "b) Supraventricular", "isCorrect": true },
          { "text": "c) Mixto", "isCorrect": false },
          { "text": "d) Desconocido", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Las arritmias supraventriculares suelen tener QRS estrecho."
      },
      {
        "id": 3,
        "text": "3. Una taquicardia regular, QRS estrecho y sin ondas P visibles sugiere principalmente:",
        "options": [
          { "text": "a) Fibrilación auricular", "isCorrect": false },
          { "text": "b) Taquicardia ventricular", "isCorrect": false },
          { "text": "c) Taquicardia supraventricular", "isCorrect": true },
          { "text": "d) Bloqueo AV", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Es característica de una TSV."
      },
      {
        "id": 4,
        "text": "4. ¿Cuál de las siguientes arritmias es siempre potencialmente mortal?",
        "options": [
          { "text": "a) Fibrilación auricular", "isCorrect": false },
          { "text": "b) Taquicardia supraventricular", "isCorrect": false },
          { "text": "c) Taquicardia ventricular", "isCorrect": true },
          { "text": "d) Extrasístoles auriculares", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La taquicardia ventricular requiere evaluación urgente."
      },
      {
        "id": 5,
        "text": "5. Una taquicardia irregular sin onda P definida corresponde a:",
        "options": [
          { "text": "a) TSV", "isCorrect": false },
          { "text": "b) TV", "isCorrect": false },
          { "text": "c) Flutter auricular", "isCorrect": false },
          { "text": "d) Fibrilación auricular", "isCorrect": true }
        ],
        "feedback": "Respuesta correcta: d) La FA es irregular y sin onda P organizada."
      },
      {
        "id": 6,
        "text": "6. En toda arritmia, antes de decidir tratamiento, es indispensable evaluar:",
        "options": [
          { "text": "a) El diagnóstico exacto", "isCorrect": false },
          { "text": "b) La estabilidad hemodinámica", "isCorrect": true },
          { "text": "c) El eje eléctrico", "isCorrect": false },
          { "text": "d) El QT corregido", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) La estabilidad clínica define la conducta."
      },
      {
        "id": 7,
        "text": "7. Un QRS ancho en una taquicardia debe considerarse inicialmente como:",
        "options": [
          { "text": "a) Supraventricular hasta demostrar lo contrario", "isCorrect": false },
          { "text": "b) Ventricular hasta demostrar lo contrario", "isCorrect": true },
          { "text": "c) Benigno", "isCorrect": false },
          { "text": "d) Error técnico", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Por seguridad, toda taquicardia de QRS ancho es TV hasta demostrar lo contrario."
      },
      {
        "id": 8,
        "text": "8. El error más peligroso al interpretar arritmias es:",
        "options": [
          { "text": "a) No medir la frecuencia", "isCorrect": false },
          { "text": "b) No calcular el eje", "isCorrect": false },
          { "text": "c) Subestimar una arritmia grave", "isCorrect": true },
          { "text": "d) No identificar la onda T", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Subestimar arritmias puede poner en riesgo la vida."
      },
      {
        "id": 9,
        "text": "9. El objetivo principal del análisis inicial de una arritmia es:",
        "options": [
          { "text": "a) Ponerle nombre", "isCorrect": false },
          { "text": "b) Decidir si es peligrosa", "isCorrect": true },
          { "text": "c) Medir todos los intervalos", "isCorrect": false },
          { "text": "d) Comparar con EKG previos", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) La prioridad es identificar riesgo inmediato."
      },
      {
        "id": 10,
        "text": "10. Una arritmia potencialmente inestable debe tratarse:",
        "options": [
          { "text": "a) Solo con medicamentos", "isCorrect": false },
          { "text": "b) Después de confirmar diagnóstico", "isCorrect": false },
          { "text": "c) De forma inmediata", "isCorrect": true },
          { "text": "d) En consulta externa", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La intervención no debe retrasarse."
      }
    ]
  },
  "modulo_6": {
    "title": "Autoevaluación – Módulo 6: EKG en el Síndrome Coronario Agudo",
    "instructions": "Esta autoevaluación tiene como objetivo reforzar el reconocimiento temprano de cambios isquémicos en el EKG y la toma de decisiones clínicas oportunas. No es punitiva. Tiempo estimado: 10–15 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. El hallazgo electrocardiográfico más importante a identificar en un SCA es:",
        "options": [
          { "text": "a) Onda P anormal", "isCorrect": false },
          { "text": "b) Alteraciones del segmento ST", "isCorrect": true },
          { "text": "c) Intervalo QT prolongado", "isCorrect": false },
          { "text": "d) Eje eléctrico desviado", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) El ST orienta a isquemia, lesión o infarto."
      },
      {
        "id": 2,
        "text": "2. La elevación del ST debe considerarse significativa cuando:",
        "options": [
          { "text": "a) Aparece en una sola derivación", "isCorrect": false },
          { "text": "b) Es menor a 0.5 mm", "isCorrect": false },
          { "text": "c) Aparece en derivaciones contiguas", "isCorrect": true },
          { "text": "d) Se asocia a bradicardia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La elevación debe verse en derivaciones contiguas."
      },
      {
        "id": 3,
        "text": "3. La depresión del ST suele indicar:",
        "options": [
          { "text": "a) Necrosis transmural", "isCorrect": false },
          { "text": "b) Isquemia subendocárdica", "isCorrect": true },
          { "text": "c) Ritmo sinusal", "isCorrect": false },
          { "text": "d) Error técnico", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) La depresión del ST se asocia a isquemia subendocárdica."
      },
      {
        "id": 4,
        "text": "4. Una onda T negativa y simétrica sugiere:",
        "options": [
          { "text": "a) Ritmo normal", "isCorrect": false },
          { "text": "b) Hipertrofia ventricular", "isCorrect": false },
          { "text": "c) Isquemia miocárdica", "isCorrect": true },
          { "text": "d) Bloqueo AV", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Es un signo frecuente de isquemia."
      },
      {
        "id": 5,
        "text": "5. El EKG en el SCA debe realizarse:",
        "options": [
          { "text": "a) Solo si hay dolor típico", "isCorrect": false },
          { "text": "b) Después de biomarcadores", "isCorrect": false },
          { "text": "c) De forma inmediata al ingreso", "isCorrect": true },
          { "text": "d) Solo una vez", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El EKG debe realizarse de inmediato."
      },
      {
        "id": 6,
        "text": "6. Un EKG normal no descarta SCA porque:",
        "options": [
          { "text": "a) El equipo puede fallar", "isCorrect": false },
          { "text": "b) Los cambios pueden ser dinámicos", "isCorrect": true },
          { "text": "c) El paciente puede estar ansioso", "isCorrect": false },
          { "text": "d) El ST siempre cambia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Los cambios pueden aparecer con el tiempo."
      },
      {
        "id": 7,
        "text": "7. La localización del infarto permite:",
        "options": [
          { "text": "a) Calcular la frecuencia", "isCorrect": false },
          { "text": "b) Predecir el territorio coronario", "isCorrect": true },
          { "text": "c) Identificar el eje", "isCorrect": false },
          { "text": "d) Medir el QT", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Ayuda a identificar la arteria comprometida."
      },
      {
        "id": 8,
        "text": "8. El infarto inferior se asocia a cambios en:",
        "options": [
          { "text": "a) V1–V4", "isCorrect": false },
          { "text": "b) I y aVL", "isCorrect": false },
          { "text": "c) II, III y aVF", "isCorrect": true },
          { "text": "d) V5–V6", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Son las derivaciones inferiores."
      },
      {
        "id": 9,
        "text": "9. El error más grave ante un STEMI es:",
        "options": [
          { "text": "a) No medir el QT", "isCorrect": false },
          { "text": "b) Esperar biomarcadores", "isCorrect": true },
          { "text": "c) Repetir el EKG", "isCorrect": false },
          { "text": "d) Identificar la arteria", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Retrasar la reperfusión pone en riesgo la vida."
      },
      {
        "id": 10,
        "text": "10. Ante elevación del ST con clínica compatible, la conducta correcta es:",
        "options": [
          { "text": "a) Observación", "isCorrect": false },
          { "text": "b) Analgesia y alta", "isCorrect": false },
          { "text": "c) Activar reperfusión inmediata", "isCorrect": true },
          { "text": "d) Solicitar Holter", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El tiempo es músculo."
      }
    ]
  },
  "modulo_7": {
    "title": "Autoevaluación – Módulo 7: Trastornos del Sistema de Conducción",
    "instructions": "Esta autoevaluación tiene como objetivo reforzar la identificación y el análisis clínico de los trastornos del sistema de conducción, con énfasis en bloqueos AV y bloqueos de rama. Tiempo estimado: 10–15 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. El dato electrocardiográfico clave para sospechar un bloqueo AV es:",
        "options": [
          { "text": "a) Ancho del QRS", "isCorrect": false },
          { "text": "b) Intervalo QT", "isCorrect": false },
          { "text": "c) Intervalo PR", "isCorrect": true },
          { "text": "d) Onda T", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El intervalo PR es fundamental para evaluar conducción AV."
      },
      {
        "id": 2,
        "text": "2. Un intervalo PR mayor de 200 ms corresponde a:",
        "options": [
          { "text": "a) Bloqueo AV de segundo grado", "isCorrect": false },
          { "text": "b) Bloqueo AV completo", "isCorrect": false },
          { "text": "c) Bloqueo AV de primer grado", "isCorrect": true },
          { "text": "d) Ritmo sinusal normal", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) PR prolongado con conducción 1:1 define BAV de primer grado."
      },
      {
        "id": 3,
        "text": "3. En un bloqueo AV de segundo grado tipo Mobitz I se observa:",
        "options": [
          { "text": "a) PR constante con latidos bloqueados", "isCorrect": false },
          { "text": "b) Alargamiento progresivo del PR", "isCorrect": true },
          { "text": "c) Disociación AV completa", "isCorrect": false },
          { "text": "d) QRS ancho", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) El PR se prolonga progresivamente hasta que cae un QRS."
      },
      {
        "id": 4,
        "text": "4. El bloqueo AV de segundo grado tipo Mobitz II se caracteriza por:",
        "options": [
          { "text": "a) PR variable", "isCorrect": false },
          { "text": "b) PR normal o constante con QRS bloqueados", "isCorrect": true },
          { "text": "c) Ritmo irregular sin P", "isCorrect": false },
          { "text": "d) QRS estrecho siempre", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Es más peligroso y puede progresar a bloqueo completo."
      },
      {
        "id": 5,
        "text": "5. El bloqueo AV completo se define por:",
        "options": [
          { "text": "a) PR prolongado", "isCorrect": false },
          { "text": "b) PR progresivo", "isCorrect": false },
          { "text": "c) Disociación entre ondas P y QRS", "isCorrect": true },
          { "text": "d) QRS estrecho", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) No hay relación entre actividad auricular y ventricular."
      },
      {
        "id": 6,
        "text": "6. El bloqueo de rama derecha se asocia a:",
        "options": [
          { "text": "a) QRS <120 ms", "isCorrect": false },
          { "text": "b) QRS ancho con patrón en V1", "isCorrect": true },
          { "text": "c) PR prolongado", "isCorrect": false },
          { "text": "d) Onda T negativa difusa", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) El BRD presenta QRS ancho con patrón característico en V1."
      },
      {
        "id": 7,
        "text": "7. El bloqueo de rama izquierda es clínicamente relevante porque:",
        "options": [
          { "text": "a) Siempre es benigno", "isCorrect": false },
          { "text": "b) Dificulta el diagnóstico de infarto", "isCorrect": true },
          { "text": "c) No altera el QRS", "isCorrect": false },
          { "text": "d) Es exclusivo de jóvenes", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Puede enmascarar cambios isquémicos."
      },
      {
        "id": 8,
        "text": "8. Ante un bloqueo AV completo sintomático, la conducta inicial es:",
        "options": [
          { "text": "a) Observación", "isCorrect": false },
          { "text": "b) Alta", "isCorrect": false },
          { "text": "c) Marcapasos", "isCorrect": true },
          { "text": "d) Betabloqueador", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Requiere estimulación cardíaca."
      },
      {
        "id": 9,
        "text": "9. El error más peligroso al interpretar bloqueos es:",
        "options": [
          { "text": "a) No medir el QT", "isCorrect": false },
          { "text": "b) Confundir bloqueo benigno con grave", "isCorrect": true },
          { "text": "c) No calcular el eje", "isCorrect": false },
          { "text": "d) No medir frecuencia", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) Subestimar bloqueos graves puede ser fatal."
      },
      {
        "id": 10,
        "text": "10. En trastornos de conducción, lo más importante es siempre evaluar:",
        "options": [
          { "text": "a) Diagnóstico exacto", "isCorrect": false },
          { "text": "b) Estabilidad clínica del paciente", "isCorrect": true },
          { "text": "c) Tipo de onda T", "isCorrect": false },
          { "text": "d) Eje eléctrico", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: b) La clínica define la urgencia."
      }
    ]
  },
  "modulo_8": {
    "title": "Autoevaluación – Módulo 8: EKG Ninja – Lee en 10 Segundos o Menos",
    "instructions": "Esta autoevaluación busca reforzar la lectura rápida y segura del electrocardiograma en escenarios de urgencia. El objetivo no es el diagnóstico perfecto, sino identificar lo peligroso a tiempo. Tiempo estimado: 10 minutos.",
    "questions": [
      {
        "id": 1,
        "text": "1. En una situación de urgencias, el objetivo principal al ver un EKG es:",
        "options": [
          { "text": "a) Nombrar el ritmo exacto", "isCorrect": false },
          { "text": "b) Medir todos los intervalos", "isCorrect": false },
          { "text": "c) Identificar si es potencialmente mortal", "isCorrect": true },
          { "text": "d) Calcular el eje eléctrico", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) En urgencias, lo primero es reconocer peligro vital."
      },
      {
        "id": 2,
        "text": "2. Un EKG que muestra actividad eléctrica caótica, sin QRS definidos, corresponde a:",
        "options": [
          { "text": "a) Taquicardia supraventricular", "isCorrect": false },
          { "text": "b) Fibrilación auricular", "isCorrect": false },
          { "text": "c) Fibrilación ventricular", "isCorrect": true },
          { "text": "d) Ritmo sinusal", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La fibrilación ventricular es una emergencia vital."
      },
      {
        "id": 3,
        "text": "3. Una taquicardia de QRS ancho debe considerarse inicialmente como:",
        "options": [
          { "text": "a) Supraventricular", "isCorrect": false },
          { "text": "b) Benigna", "isCorrect": false },
          { "text": "c) Ventricular", "isCorrect": true },
          { "text": "d) Error técnico", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Por seguridad, se asume ventricular."
      },
      {
        "id": 4,
        "text": "4. ¿Cuál de los siguientes es una bandera roja inmediata?",
        "options": [
          { "text": "a) Ritmo sinusal a 55 lpm", "isCorrect": false },
          { "text": "b) QT corto", "isCorrect": false },
          { "text": "c) Bloqueo AV completo", "isCorrect": true },
          { "text": "d) Extrasístoles aisladas", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El bloqueo AV completo puede causar colapso hemodinámico."
      },
      {
        "id": 5,
        "text": "5. Un EKG con elevación del ST y clínica compatible indica:",
        "options": [
          { "text": "a) Observación", "isCorrect": false },
          { "text": "b) Alta", "isCorrect": false },
          { "text": "c) Emergencia médica", "isCorrect": true },
          { "text": "d) Repetir EKG en 24 h", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Requiere acción inmediata."
      },
      {
        "id": 6,
        "text": "6. En la lectura rápida del EKG, el orden correcto es:",
        "options": [
          { "text": "a) Diagnóstico → clínica → conducta", "isCorrect": false },
          { "text": "b) Ritmo → eje → QT", "isCorrect": false },
          { "text": "c) ¿Peligroso? → ¿estable? → actuar", "isCorrect": true },
          { "text": "d) Medición completa del trazo", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Este enfoque prioriza la vida."
      },
      {
        "id": 7,
        "text": "7. Un ritmo lento (<40 lpm) con síntomas se considera:",
        "options": [
          { "text": "a) Normal", "isCorrect": false },
          { "text": "b) Hallazgo incidental", "isCorrect": false },
          { "text": "c) Potencialmente inestable", "isCorrect": true },
          { "text": "d) Variante fisiológica", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) Puede comprometer la perfusión."
      },
      {
        "id": 8,
        "text": "8. El mayor error en la lectura rápida del EKG es:",
        "options": [
          { "text": "a) No medir el eje", "isCorrect": false },
          { "text": "b) No identificar ondas P", "isCorrect": false },
          { "text": "c) Demorar la decisión", "isCorrect": true },
          { "text": "d) No calcular la frecuencia exacta", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) El retraso puede ser fatal."
      },
      {
        "id": 9,
        "text": "9. La lectura rápida del EKG se basa principalmente en:",
        "options": [
          { "text": "a) Experiencia clínica y patrones", "isCorrect": true },
          { "text": "b) Memorización de diagnósticos", "isCorrect": false },
          { "text": "c) Cálculos exactos", "isCorrect": false },
          { "text": "d) Comparación con guías", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: a) Se apoya en patrones y banderas rojas."
      },
      {
        "id": 10,
        "text": "10. El concepto central del EKG Ninja es:",
        "options": [
          { "text": "a) Interpretar todo en detalle", "isCorrect": false },
          { "text": "b) Leer más rápido que otros", "isCorrect": false },
          { "text": "c) Priorizar decisiones seguras", "isCorrect": true },
          { "text": "d) Evitar usar clínica", "isCorrect": false }
        ],
        "feedback": "Respuesta correcta: c) La seguridad del paciente es lo principal."
      }
    ]
  }
};

window.loadQuiz = (moduleId) => {
  const container = document.getElementById(`quiz-${moduleId.replace('_', '-')}`);
  const data = QUIZ_DATA[moduleId];
  
  if (!container) return;
  
  if (!data) {
    const btn = container.querySelector("button");
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = "Próximamente";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
    return;
  }

  container.innerHTML = ""; 

  let score = 0;
  let answeredCount = 0;
  const totalQuestions = data.questions.length;

  // Header
  const header = el("div", { class: "quiz-header" });
  header.appendChild(el("h5", { text: data.title }));
  header.appendChild(el("p", { text: data.instructions }));
  container.appendChild(header);

  const showResults = () => {
    const resultDiv = el("div", { class: "quiz-result", style: "margin-top: 24px; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid var(--border);" });
    
    const scorePercent = Math.round((score / totalQuestions) * 100);
    const scoreText = el("h4", { text: `Tu puntaje: ${score} / ${totalQuestions} (${scorePercent}%)` });
    scoreText.style.color = "var(--primary)";
    scoreText.style.marginBottom = "16px";
    
    let feedbackMsg = "¡Sigue practicando!";
    if (scorePercent === 100) feedbackMsg = "¡Excelente! Dominas este tema.";
    else if (scorePercent >= 80) feedbackMsg = "¡Muy bien! Casi perfecto.";
    else if (scorePercent >= 60) feedbackMsg = "Vas por buen camino.";
    
    resultDiv.appendChild(scoreText);
    resultDiv.appendChild(el("p", { text: feedbackMsg, style: "margin-bottom: 20px; color: var(--text);" }));
    
    const restartBtn = el("button", { 
      class: "btn btn-primary", 
      text: "Reiniciar autoevaluación" 
    });
    restartBtn.onclick = () => loadQuiz(moduleId);
    
    resultDiv.appendChild(restartBtn);
    container.appendChild(resultDiv);
    
    setTimeout(() => resultDiv.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  // Questions
  data.questions.forEach((q, idx) => {
    const qDiv = el("div", { class: "quiz-question" });
    qDiv.appendChild(el("h6", { text: q.text }));

    const optsDiv = el("div", { class: "quiz-options" });
    const feedbackDiv = el("div", { class: "quiz-feedback" });

    q.options.forEach((opt) => {
      const btn = el("button", { class: "quiz-option", text: opt.text });
      btn.onclick = () => {
        Array.from(optsDiv.children).forEach(b => b.disabled = true);
        btn.classList.add("selected");

        if (opt.isCorrect) {
          score++;
          btn.classList.add("correct");
          feedbackDiv.classList.add("show", "success");
          feedbackDiv.textContent = "¡Correcto! " + q.feedback;
        } else {
          btn.classList.add("incorrect");
          feedbackDiv.classList.add("show", "error");
          feedbackDiv.textContent = "Incorrecto. " + q.feedback;
          Array.from(optsDiv.children).forEach((b, i) => {
             if (q.options[i].isCorrect) b.classList.add("correct");
          });
        }
        
        answeredCount++;
        if (answeredCount === totalQuestions) {
          showResults();
        }
      };
      optsDiv.appendChild(btn);
    });

    qDiv.appendChild(optsDiv);
    qDiv.appendChild(feedbackDiv);
    container.appendChild(qDiv);
  });
};

const start = () => {
  const init = () => { 
    setupAccordions(); 
    setupAuth(); 
    updateProtectedViews();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
};

start();
