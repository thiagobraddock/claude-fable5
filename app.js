// ---------- Notas e teclado ----------
const NOTE_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PT_NAMES = {
  C: "Dó", "C#": "Dó#", D: "Ré", "D#": "Ré#", E: "Mi", F: "Fá",
  "F#": "Fá#", G: "Sol", "G#": "Sol#", A: "Lá", "A#": "Lá#", B: "Si",
};

// Teclado virtual de Sol3 a Dó6 (cobre todas as melodias incluídas)
const FIRST_NOTE = { name: "G", octave: 3 };
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

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Som de piano simplificado: fundamental + harmônicos com decaimento exponencial
function playNote(noteId, duration = 1.4, when = 0) {
  const ctx = getAudioCtx();
  const t0 = ctx.currentTime + when;
  const freq = midiToFreq(noteToMidi(noteId));

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.5, t0 + 0.01);
  master.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  master.connect(ctx.destination);

  const harmonics = [
    { mult: 1, gain: 1.0, type: "triangle" },
    { mult: 2, gain: 0.35, type: "sine" },
    { mult: 3, gain: 0.12, type: "sine" },
    { mult: 4, gain: 0.06, type: "sine" },
  ];

  harmonics.forEach(({ mult, gain, type }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * mult, t0);
    g.gain.setValueAtTime(gain, t0);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  });
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

// ---------- Estado de aprendizado ----------
const state = {
  mode: "free",
  song: null,
  index: 0,
  hits: 0,
  errors: 0,
  active: false,      // sessão de prática em andamento
  demoPlaying: false,
};

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
};

function populateSongs() {
  Object.entries(SONGS).forEach(([key, song]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = song.title;
    els.songSelect.appendChild(opt);
  });
}

function setMode(mode) {
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
  return SONGS[els.songSelect.value];
}

function startPractice() {
  state.song = currentSong();
  state.index = 0;
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
  state.song.notes.forEach((note, i) => {
    const chip = document.createElement("span");
    chip.className = "note-chip";
    chip.dataset.index = i;
    chip.textContent = noteDisplayName(note.n, nameStyle);
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
  const target = state.song.notes[state.index].n;
  keyEls[target]?.classList.add("target");
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

  const expected = state.song.notes[state.index].n;
  if (noteId === expected) {
    state.hits++;
    state.index++;
    flashKey(noteId, "flash-ok");
    hideFeedback();
    updateStats();
    updateStrip();
    if (state.index >= state.song.notes.length) finishPractice();
    else highlightTarget();
  } else {
    state.errors++;
    flashKey(noteId, "flash-err");
    const chip = els.noteStrip.children[state.index];
    if (chip) chip.classList.add("wrong-once");
    const style = document.getElementById("note-names").value;
    const nameStyle = style === "off" ? "pt" : style;
    showFeedback(
      `✗ Você tocou ${noteDisplayName(noteId, nameStyle)}, mas a nota certa é ${noteDisplayName(expected, nameStyle)}. Tente outra vez!`,
      "err"
    );
    updateStats();
  }
}

// Teclado do computador
const heldKeys = new Set();
document.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  if (KEY_MAP[key] && !heldKeys.has(key)) {
    heldKeys.add(key);
    handleInput(KEY_MAP[key]);
  }
});
document.addEventListener("keyup", (e) => heldKeys.delete(e.key.toLowerCase()));

// ---------- Demonstração da melodia ----------
function playDemo() {
  if (state.demoPlaying) return;
  const song = currentSong();
  state.demoPlaying = true;
  els.btnListen.disabled = true;
  clearTarget();

  const beat = 60 / song.bpm;
  let when = 0.2;
  song.notes.forEach((note) => {
    const dur = note.d * beat;
    playNote(note.n, Math.max(dur * 0.95, 0.3), when);
    const delay = when * 1000;
    setTimeout(() => {
      flashKey(note.n, "pressed", dur * 900);
    }, delay);
    when += dur;
  });

  setTimeout(() => {
    state.demoPlaying = false;
    els.btnListen.disabled = false;
    if (state.active) highlightTarget();
  }, when * 1000 + 300);
}

// ---------- Eventos ----------
els.modeSelect.addEventListener("change", () => setMode(els.modeSelect.value));
els.songSelect.addEventListener("change", () => startPractice());
els.btnStart.addEventListener("click", () => startPractice());
els.btnListen.addEventListener("click", () => playDemo());
document.getElementById("note-names").addEventListener("change", () => {
  updateNoteLabels();
  if (state.mode === "learn" && state.song) buildNoteStrip();
});

// ---------- Inicialização ----------
buildKeyboard();
populateSongs();
setMode("free");
