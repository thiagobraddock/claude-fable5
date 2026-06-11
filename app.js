// ---------- Notas e teclado ----------
const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PT_NAMES = {
  C: "Dó", "C#": "Dó#", D: "Ré", "D#": "Ré#", E: "Mi", F: "Fá",
  "F#": "Fá#", G: "Sol", "G#": "Sol#", A: "Lá", "A#": "Lá#", B: "Si",
};

// Teclado virtual de Dó3 a Dó6 — espaço para mão esquerda (graves) e direita
const FIRST_NOTE = { name: "C", octave: 3 };
const LAST_NOTE = { name: "C", octave: 6 };

// Mapeamento do teclado do computador (duas oitavas principais)
const KEY_MAP = {
  z: "C4", s: "C#4", x: "D4", d: "D#4", c: "E4", v: "F4", g: "F#4",
  b: "G4", h: "G#4", n: "A4", j: "A#4", m: "B4",
  q: "C5", "2": "C#5", w: "D5", "3": "D#5", e: "E5", r: "F5", "5": "F#5",
  t: "G5", "6": "G#5", y: "A5", "7": "A#5", u: "B5", i: "C6",
};

function noteToMidi(note) {
  const name = note.slice(0, -1);
  const octave = parseInt(note.slice(-1), 10);
  return (octave + 1) * 12 + NOTE_ORDER.indexOf(name);
}

function midiToNote(midi) {
  return NOTE_ORDER[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function buildNoteList() {
  const notes = [];
  let midi = noteToMidi(FIRST_NOTE.name + FIRST_NOTE.octave);
  const last = noteToMidi(LAST_NOTE.name + LAST_NOTE.octave);
  while (midi <= last) {
    const name = NOTE_ORDER[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    notes.push({ id: name + octave, name, octave, midi });
    midi++;
  }
  return notes;
}

// ---------- Áudio (Web Audio API) ----------
let audioCtx = null;
let compressor = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // evita estouro/distorção quando várias notas soam juntas
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 6;
    compressor.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Som de piano sintetizado: cordas levemente desafinadas entre si, harmônicos
// que decaem mais rápido que a fundamental e filtro que escurece o som ao
// longo da nota (ataque brilhante do martelo → ressonância suave da corda)
function playNote(noteId, duration = null, when = 0) {
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + when;
  const midi = noteToMidi(noteId);
  const freq = midiToFreq(midi);
  // notas graves ressoam por mais tempo, como num piano real
  const decay = duration || Math.max(1.2, 2.8 - (midi - 55) * 0.05);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.35, t0 + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0008, t0 + decay);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.4;
  filter.frequency.setValueAtTime(Math.min(freq * 9, 9000), t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.8, 600), t0 + decay * 0.6);

  master.connect(filter).connect(compressor);

  const partials = [
    { mult: 1, gain: 1.0, detune: 0, type: "triangle" },
    { mult: 1, gain: 0.45, detune: 4, type: "triangle" },
    { mult: 2, gain: 0.3, detune: 0, type: "sine" },
    { mult: 3, gain: 0.12, detune: 0, type: "sine" },
    { mult: 4, gain: 0.06, detune: 0, type: "sine" },
    { mult: 5, gain: 0.03, detune: 0, type: "sine" },
  ];

  partials.forEach(({ mult, gain, detune, type }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * mult, t0);
    osc.detune.setValueAtTime(detune, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(gain * 0.01 + 0.0001, t0 + decay / (1 + (mult - 1) * 0.6));
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + decay + 0.1);
  });

  // controle para silenciar a nota antes da hora (usado pelo botão Parar)
  return { stop() { try { master.disconnect(); } catch { /* já desconectado */ } } };
}

// ---------- Construção do teclado na tela ----------
const keyboardEl = document.getElementById("keyboard");
const keyEls = {}; // noteId -> elemento
const NOTES = buildNoteList();

const KEY_LABELS = {}; // noteId -> tecla do computador
Object.entries(KEY_MAP).forEach(([key, note]) => { KEY_LABELS[note] = key.toUpperCase(); });

function buildKeyboard() {
  NOTES.forEach((note) => {
    const isBlack = note.name.includes("#");
    const el = document.createElement("div");
    el.className = "key " + (isBlack ? "black" : "white");
    el.dataset.note = note.id;

    const label = document.createElement("span");
    label.className = "note-label";
    el.appendChild(label);

    if (KEY_LABELS[note.id]) {
      const kbd = document.createElement("span");
      kbd.className = "kbd-label";
      kbd.textContent = KEY_LABELS[note.id];
      el.appendChild(kbd);
    }

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handleInput(note.id);
    });

    keyboardEl.appendChild(el);
    keyEls[note.id] = el;
  });
  updateNoteLabels();
}

function noteDisplayName(noteId, style) {
  const name = noteId.slice(0, -1);
  const octave = noteId.slice(-1);
  if (style === "pt") return PT_NAMES[name] + octave;
  return noteId;
}

function updateNoteLabels() {
  const style = document.getElementById("note-names").value;
  NOTES.forEach((note) => {
    const labelEl = keyEls[note.id].querySelector(".note-label");
    labelEl.textContent = style === "off" ? "" : noteDisplayName(note.id, style);
  });
}

function flashKey(noteId, cls, ms = 250) {
  const el = keyEls[noteId];
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), ms);
}

// ---------- Melodias do usuário (localStorage) ----------
const LS_KEY = "pianoTutor.customSongs";

function loadCustomSongs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCustomSongs(customs) {
  localStorage.setItem(LS_KEY, JSON.stringify(customs));
}

function getSong(key) {
  if (key.startsWith("custom:")) return loadCustomSongs()[key.slice(7)];
  return SONGS[key];
}

// ---------- Importação de melodias ----------
const CLAUDE_PROMPT = `Converta a música que vou te passar (foto de partitura, PDF ou apenas o nome da música) para o formato JSON do app Piano Tutor:

{"title":"Nome da Música","bpm":100,"notes":[{"n":"G4","d":0.75},{"n":"G4","d":0.25},{"n":["C3","E3","A4"],"d":1},{"n":"G4","d":1}]}

Regras:
- "n" pode ser UMA nota ("C4") ou um ACORDE: lista de notas tocadas ao mesmo tempo (["C3","E3","G3"]). Use acordes para juntar mão esquerda (graves) e mão direita (melodia) que soam no mesmo tempo.
- Notas em notação científica americana (C, C#, D, D#, E, F, F#, G, G#, A, A#, B + número da oitava). O Dó central é C4. Mão esquerda costuma ficar na oitava 3, melodia nas oitavas 4 e 5.
- "d" é a duração em tempos: 1 = semínima, 0.5 = colcheia, 2 = mínima, 4 = semibreve.
- Para iniciantes, prefira a melodia simples; se eu pedir "com as duas mãos", adicione baixo/acordes simples (no máximo 3 notas juntas).
- Todas as notas devem ficar entre C3 e C6; transponha a música se for preciso.
- "bpm" é o andamento em batidas por minuto.
- Responda SOMENTE com o JSON, sem nenhum texto antes ou depois.`;

const PT_TO_LETTER = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };

// Aceita "C4", "c#4", "Dó4", "sol3", "Bb4"… e devolve o id canônico ("C4")
function normalizeNoteName(raw) {
  const s = String(raw).trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const m = s.match(/^(do|re|mi|fa|sol|la|si|[a-g])(#|b)?(\d)$/);
  if (!m) return null;
  const letter = PT_TO_LETTER[m[1]] || m[1].toUpperCase();
  const accidental = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  const midi = (parseInt(m[3], 10) + 1) * 12 + NOTE_ORDER.indexOf(letter) + accidental;
  return midiToNote(midi);
}

// Formato simples alternativo: linhas "titulo:"/"bpm:" e notas "C4 D4:0.5 Mi4"
function parseCompact(text) {
  const song = { title: "", bpm: 100, notes: [] };
  text.split(/\n+/).forEach((line) => {
    const l = line.trim();
    if (!l) return;
    const title = l.match(/^(t[ií]tulo|title|nome)\s*[:=]\s*(.+)$/i);
    if (title) { song.title = title[2].trim(); return; }
    const bpm = l.match(/^bpm\s*[:=]\s*(\d+)/i);
    if (bpm) { song.bpm = +bpm[1]; return; }
    l.split(/[\s,;]+/).forEach((tok) => {
      if (!tok) return;
      const [names, d] = tok.split(":");
      // "Dó3+Mi3+Sol3" = acorde (notas simultâneas)
      const parts = names.split("+");
      song.notes.push({
        n: parts.length > 1 ? parts : parts[0],
        d: d ? parseFloat(d.replace(",", ".")) : 1,
      });
    });
  });
  return song;
}

function parseImport(text) {
  // remove cercas de markdown que o Claude às vezes inclui
  const t = text.trim().replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
  if (!t) throw new Error("O campo está vazio. Cole o código da melodia.");

  let song;
  if (t.startsWith("{")) {
    let obj;
    try {
      obj = JSON.parse(t);
    } catch {
      throw new Error("O código está incompleto ou com erro. Copie a resposta inteira do Claude e cole de novo.");
    }
    song = { title: obj.title, bpm: obj.bpm, notes: obj.notes };
  } else {
    song = parseCompact(t);
  }

  if (!Array.isArray(song.notes) || !song.notes.length) {
    throw new Error("Não encontrei nenhuma nota na melodia.");
  }

  const notes = song.notes.map((nt, i) => {
    const raw = typeof nt === "string" ? { n: nt, d: 1 } : nt || {};
    const names = Array.isArray(raw.n) ? raw.n : [raw.n];
    if (!names.length) throw new Error(`A nota nº ${i + 1} está vazia.`);
    if (names.length > 6) throw new Error(`O acorde nº ${i + 1} tem notas demais (máximo 6).`);
    const ids = [...new Set(names.map((name) => {
      const id = normalizeNoteName(name);
      if (!id) throw new Error(`Nota nº ${i + 1} inválida: "${name}". Use o formato C4, G#4, Dó4…`);
      return id;
    }))];
    const d = Number(raw.d) || 1;
    return { n: ids.length === 1 ? ids[0] : ids, d: Math.min(8, Math.max(0.125, d)) };
  });

  // encaixa no alcance do teclado (C3–C6), transpondo oitavas inteiras se necessário
  const lo = noteToMidi("C3");
  const hi = noteToMidi("C6");
  const allMidis = notes.flatMap((nt) => (Array.isArray(nt.n) ? nt.n : [nt.n]).map(noteToMidi));
  const min = Math.min(...allMidis);
  const max = Math.max(...allMidis);
  let shift = null;
  for (const s of [0, 12, -12, 24, -24]) {
    if (min + s >= lo && max + s <= hi) { shift = s; break; }
  }
  if (shift === null) {
    throw new Error("A música usa notas além do alcance do teclado (Dó3 a Dó6), mesmo transpondo. Peça ao Claude uma versão simplificada em uma região média.");
  }
  if (shift !== 0) {
    notes.forEach((nt) => {
      nt.n = Array.isArray(nt.n)
        ? nt.n.map((n) => midiToNote(noteToMidi(n) + shift))
        : midiToNote(noteToMidi(nt.n) + shift);
    });
  }

  return {
    title: String(song.title || "Minha melodia").slice(0, 60),
    bpm: Math.min(240, Math.max(30, Number(song.bpm) || 100)),
    notes,
    shifted: shift !== 0,
  };
}

// ---------- Estado de aprendizado ----------
const state = {
  mode: "free",
  song: null,
  index: 0,
  remaining: new Set(), // notas do passo atual que faltam tocar (acorde = várias)
  hits: 0,
  errors: 0,
  active: false,      // sessão de prática em andamento
  demoPlaying: false,
};

// Um passo da música pode ser uma nota ("C4") ou um acorde (["C3","E3","G3"])
function chordOf(step) {
  return Array.isArray(step.n) ? step.n : [step.n];
}

const els = {
  modeSelect: document.getElementById("mode-select"),
  songGroup: document.getElementById("song-group"),
  songSelect: document.getElementById("song-select"),
  learnButtons: document.getElementById("learn-buttons"),
  practicePanel: document.getElementById("practice-panel"),
  noteStrip: document.getElementById("note-strip"),
  progress: document.getElementById("stat-progress"),
  hits: document.getElementById("stat-hits"),
  errors: document.getElementById("stat-errors"),
  accuracy: document.getElementById("stat-accuracy"),
  progressFill: document.getElementById("progress-fill"),
  feedback: document.getElementById("feedback"),
  btnListen: document.getElementById("btn-listen"),
  btnStart: document.getElementById("btn-start"),
  btnAdd: document.getElementById("btn-add"),
  btnDel: document.getElementById("btn-del"),
  importDialog: document.getElementById("import-dialog"),
  importText: document.getElementById("import-text"),
  importError: document.getElementById("import-error"),
  btnCopyPrompt: document.getElementById("btn-copy-prompt"),
};

function populateSongs(selectKey) {
  els.songSelect.innerHTML = "";

  const builtin = document.createElement("optgroup");
  builtin.label = "Incluídas";
  Object.entries(SONGS).forEach(([key, song]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = song.title;
    builtin.appendChild(opt);
  });
  els.songSelect.appendChild(builtin);

  const customs = loadCustomSongs();
  const ids = Object.keys(customs);
  if (ids.length) {
    const og = document.createElement("optgroup");
    og.label = "Minhas melodias";
    ids.forEach((id) => {
      const opt = document.createElement("option");
      opt.value = "custom:" + id;
      opt.textContent = customs[id].title;
      og.appendChild(opt);
    });
    els.songSelect.appendChild(og);
  }

  if (selectKey && getSong(selectKey)) els.songSelect.value = selectKey;
  updateDeleteButton();
}

function updateDeleteButton() {
  els.btnDel.hidden = !els.songSelect.value.startsWith("custom:");
}

function setMode(mode) {
  stopDemo();
  state.mode = mode;
  const learn = mode === "learn";
  els.songGroup.hidden = !learn;
  els.learnButtons.hidden = !learn;
  els.practicePanel.hidden = !learn;
  hideFeedback();
  clearTarget();
  if (learn) startPractice();
  else state.active = false;
}

function currentSong() {
  return getSong(els.songSelect.value);
}

function startPractice() {
  stopDemo();
  state.song = currentSong();
  if (!state.song) return;
  state.index = 0;
  state.remaining = new Set(state.song.notes.length ? chordOf(state.song.notes[0]) : []);
  state.hits = 0;
  state.errors = 0;
  state.active = true;
  hideFeedback();
  buildNoteStrip();
  updateStats();
  highlightTarget();
}

function buildNoteStrip() {
  els.noteStrip.innerHTML = "";
  const style = document.getElementById("note-names").value;
  const nameStyle = style === "off" ? "pt" : style;
  state.song.notes.forEach((step, i) => {
    const chip = document.createElement("span");
    chip.className = "note-chip";
    chip.dataset.index = i;
    chip.textContent = chordOf(step).map((n) => noteDisplayName(n, nameStyle)).join("+");
    els.noteStrip.appendChild(chip);
  });
  updateStrip();
}

function updateStrip() {
  [...els.noteStrip.children].forEach((chip, i) => {
    chip.classList.toggle("done", i < state.index);
    chip.classList.toggle("current", i === state.index);
    if (i === state.index) chip.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });
}

function clearTarget() {
  Object.values(keyEls).forEach((el) => el.classList.remove("target"));
}

function highlightTarget() {
  clearTarget();
  if (!state.active || state.index >= state.song.notes.length) return;
  state.remaining.forEach((n) => keyEls[n]?.classList.add("target"));
}

function updateStats() {
  const total = state.song ? state.song.notes.length : 0;
  els.progress.textContent = `${state.index} / ${total}`;
  els.hits.textContent = state.hits;
  els.errors.textContent = state.errors;
  const attempts = state.hits + state.errors;
  els.accuracy.textContent = attempts ? Math.round((state.hits / attempts) * 100) + "%" : "—";
  els.progressFill.style.width = total ? (state.index / total) * 100 + "%" : "0";
}

function showFeedback(msg, cls) {
  els.feedback.textContent = msg;
  els.feedback.className = "feedback " + cls;
  els.feedback.hidden = false;
}

function hideFeedback() {
  els.feedback.hidden = true;
}

function finishPractice() {
  state.active = false;
  clearTarget();
  const attempts = state.hits + state.errors;
  const accuracy = attempts ? Math.round((state.hits / attempts) * 100) : 100;
  let msg = `🎉 Você completou "${state.song.title}" com ${accuracy}% de precisão`;
  if (state.errors === 0) msg += " — perfeito, sem nenhum erro!";
  else msg += ` (${state.errors} erro${state.errors > 1 ? "s" : ""}). Tente de novo para melhorar!`;
  showFeedback(msg, "end");
}

// ---------- Entrada do usuário ----------
function handleInput(noteId) {
  playNote(noteId);
  flashKey(noteId, "pressed", 150);

  if (state.mode !== "learn" || !state.active || state.demoPlaying) return;

  if (state.remaining.has(noteId)) {
    state.hits++;
    state.remaining.delete(noteId);
    flashKey(noteId, "flash-ok");
    keyEls[noteId]?.classList.remove("target");
    hideFeedback();
    if (state.remaining.size === 0) {
      state.index++;
      updateStats();
      updateStrip();
      if (state.index >= state.song.notes.length) {
        finishPractice();
      } else {
        state.remaining = new Set(chordOf(state.song.notes[state.index]));
        highlightTarget();
      }
    } else {
      updateStats();
    }
  } else {
    state.errors++;
    flashKey(noteId, "flash-err");
    const chip = els.noteStrip.children[state.index];
    if (chip) chip.classList.add("wrong-once");
    const style = document.getElementById("note-names").value;
    const nameStyle = style === "off" ? "pt" : style;
    const expected = [...state.remaining].map((n) => noteDisplayName(n, nameStyle)).join(" + ");
    const plural = state.remaining.size > 1 ? "as notas certas são" : "a nota certa é";
    showFeedback(
      `✗ Você tocou ${noteDisplayName(noteId, nameStyle)}, mas ${plural} ${expected}. Tente outra vez!`,
      "err"
    );
    updateStats();
  }
}

// Teclado do computador
const heldKeys = new Set();
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  // não toca notas enquanto o usuário digita em campos ou no diálogo
  if (e.target.matches("input, textarea, select") || els.importDialog.open) return;
  const key = e.key.toLowerCase();
  if (KEY_MAP[key] && !heldKeys.has(key)) {
    heldKeys.add(key);
    handleInput(KEY_MAP[key]);
  }
});
document.addEventListener("keyup", (e) => heldKeys.delete(e.key.toLowerCase()));

// ---------- Demonstração da melodia ----------
let demo = null; // { handles: [], timeouts: [] } enquanto a demonstração toca

function stopDemo() {
  if (!demo) return;
  demo.handles.forEach((h) => h.stop());
  demo.timeouts.forEach(clearTimeout);
  demo = null;
  state.demoPlaying = false;
  Object.values(keyEls).forEach((el) => el.classList.remove("pressed"));
  els.btnListen.textContent = "▶ Ouvir melodia";
  if (state.active) highlightTarget();
}

function playDemo() {
  if (state.demoPlaying) {
    stopDemo();
    return;
  }
  const song = currentSong();
  if (!song) return;
  state.demoPlaying = true;
  els.btnListen.textContent = "⏹ Parar";
  clearTarget();
  demo = { handles: [], timeouts: [] };

  const beat = 60 / song.bpm;
  let when = 0.2;
  song.notes.forEach((step) => {
    const dur = step.d * beat;
    const chord = chordOf(step);
    chord.forEach((n) => demo.handles.push(playNote(n, Math.max(dur * 1.1, 0.45), when)));
    const delay = when * 1000;
    demo.timeouts.push(setTimeout(() => {
      chord.forEach((n) => flashKey(n, "pressed", dur * 900));
    }, delay));
    when += dur;
  });

  demo.timeouts.push(setTimeout(() => stopDemo(), when * 1000 + 300));
}

// ---------- Importar / remover melodias ----------
function importSong() {
  els.importError.hidden = true;
  try {
    const parsed = parseImport(els.importText.value);
    const customs = loadCustomSongs();
    const id = "s" + Date.now();
    customs[id] = { title: parsed.title, bpm: parsed.bpm, notes: parsed.notes };
    saveCustomSongs(customs);
    populateSongs("custom:" + id);
    els.modeSelect.value = "learn";
    setMode("learn");
    els.importDialog.close();
    els.importText.value = "";
    if (parsed.shifted) {
      showFeedback(`ℹ️ "${parsed.title}" foi importada (transposta de oitava para caber no teclado). Boa prática!`, "end");
    } else {
      showFeedback(`✅ "${parsed.title}" foi importada! A primeira nota já está destacada no teclado.`, "end");
    }
  } catch (err) {
    els.importError.textContent = "⚠️ " + err.message;
    els.importError.hidden = false;
  }
}

function deleteCurrentSong() {
  const key = els.songSelect.value;
  if (!key.startsWith("custom:")) return;
  const customs = loadCustomSongs();
  const id = key.slice(7);
  const title = customs[id] ? customs[id].title : "";
  if (!confirm(`Remover a melodia "${title}"?`)) return;
  delete customs[id];
  saveCustomSongs(customs);
  populateSongs();
  setMode("learn");
}

// ---------- Eventos ----------
els.modeSelect.addEventListener("change", () => setMode(els.modeSelect.value));
els.songSelect.addEventListener("change", () => { updateDeleteButton(); startPractice(); });
els.btnStart.addEventListener("click", () => startPractice());
els.btnListen.addEventListener("click", () => playDemo());
els.btnAdd.addEventListener("click", () => {
  els.importError.hidden = true;
  els.importDialog.showModal();
});
els.btnDel.addEventListener("click", () => deleteCurrentSong());
document.getElementById("btn-import-ok").addEventListener("click", () => importSong());
document.getElementById("btn-import-cancel").addEventListener("click", () => els.importDialog.close());
els.btnCopyPrompt.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CLAUDE_PROMPT);
    els.btnCopyPrompt.textContent = "✅ Copiado! Agora cole no claude.ai junto com a música";
  } catch {
    document.querySelector(".prompt-details").open = true;
    els.btnCopyPrompt.textContent = "Copie manualmente o texto abaixo ⬇";
  }
  setTimeout(() => { els.btnCopyPrompt.textContent = "📋 Copiar instruções para o Claude"; }, 4000);
});
document.getElementById("note-names").addEventListener("change", () => {
  updateNoteLabels();
  if (state.mode === "learn" && state.song) buildNoteStrip();
});

// ---------- Inicialização ----------
document.getElementById("prompt-text").textContent =
  CLAUDE_PROMPT +
  "\n\n— Formato simples também aceito (digitado à mão):\ntitulo: Minha Música\nbpm: 100\nC4 D4:0.5 Mi4 Fá4:2 Dó3+Mi3+Sol3:2\n(nota:duração — sem duração vale 1 tempo; '+' junta notas num acorde)";
buildKeyboard();
populateSongs();
setMode("free");
