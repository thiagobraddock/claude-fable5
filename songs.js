// Melodias de domínio público.
// Cada nota: { n: nome científico (ex: "C4"), d: duração em tempos (1 = semínima) }
const SONGS = {
  parabens: {
    title: "Parabéns pra Você",
    bpm: 110,
    notes: [
      { n: "G4", d: 0.75 }, { n: "G4", d: 0.25 }, { n: "A4", d: 1 }, { n: "G4", d: 1 }, { n: "C5", d: 1 }, { n: "B4", d: 2 },
      { n: "G4", d: 0.75 }, { n: "G4", d: 0.25 }, { n: "A4", d: 1 }, { n: "G4", d: 1 }, { n: "D5", d: 1 }, { n: "C5", d: 2 },
      { n: "G4", d: 0.75 }, { n: "G4", d: 0.25 }, { n: "G5", d: 1 }, { n: "E5", d: 1 }, { n: "C5", d: 1 }, { n: "B4", d: 1 }, { n: "A4", d: 2 },
      { n: "F5", d: 0.75 }, { n: "F5", d: 0.25 }, { n: "E5", d: 1 }, { n: "C5", d: 1 }, { n: "D5", d: 1 }, { n: "C5", d: 2 },
    ],
  },

  odeAlegria: {
    title: "Ode à Alegria (9ª Sinfonia de Beethoven)",
    bpm: 120,
    notes: [
      { n: "E4", d: 1 }, { n: "E4", d: 1 }, { n: "F4", d: 1 }, { n: "G4", d: 1 },
      { n: "G4", d: 1 }, { n: "F4", d: 1 }, { n: "E4", d: 1 }, { n: "D4", d: 1 },
      { n: "C4", d: 1 }, { n: "C4", d: 1 }, { n: "D4", d: 1 }, { n: "E4", d: 1 },
      { n: "E4", d: 1.5 }, { n: "D4", d: 0.5 }, { n: "D4", d: 2 },
      { n: "E4", d: 1 }, { n: "E4", d: 1 }, { n: "F4", d: 1 }, { n: "G4", d: 1 },
      { n: "G4", d: 1 }, { n: "F4", d: 1 }, { n: "E4", d: 1 }, { n: "D4", d: 1 },
      { n: "C4", d: 1 }, { n: "C4", d: 1 }, { n: "D4", d: 1 }, { n: "E4", d: 1 },
      { n: "D4", d: 1.5 }, { n: "C4", d: 0.5 }, { n: "C4", d: 2 },
    ],
  },

  brilha: {
    title: "Brilha Brilha Estrelinha",
    bpm: 100,
    notes: [
      { n: "C4", d: 1 }, { n: "C4", d: 1 }, { n: "G4", d: 1 }, { n: "G4", d: 1 },
      { n: "A4", d: 1 }, { n: "A4", d: 1 }, { n: "G4", d: 2 },
      { n: "F4", d: 1 }, { n: "F4", d: 1 }, { n: "E4", d: 1 }, { n: "E4", d: 1 },
      { n: "D4", d: 1 }, { n: "D4", d: 1 }, { n: "C4", d: 2 },
      { n: "G4", d: 1 }, { n: "G4", d: 1 }, { n: "F4", d: 1 }, { n: "F4", d: 1 },
      { n: "E4", d: 1 }, { n: "E4", d: 1 }, { n: "D4", d: 2 },
      { n: "G4", d: 1 }, { n: "G4", d: 1 }, { n: "F4", d: 1 }, { n: "F4", d: 1 },
      { n: "E4", d: 1 }, { n: "E4", d: 1 }, { n: "D4", d: 2 },
      { n: "C4", d: 1 }, { n: "C4", d: 1 }, { n: "G4", d: 1 }, { n: "G4", d: 1 },
      { n: "A4", d: 1 }, { n: "A4", d: 1 }, { n: "G4", d: 2 },
      { n: "F4", d: 1 }, { n: "F4", d: 1 }, { n: "E4", d: 1 }, { n: "E4", d: 1 },
      { n: "D4", d: 1 }, { n: "D4", d: 1 }, { n: "C4", d: 2 },
    ],
  },

  frere: {
    title: "Frère Jacques",
    bpm: 110,
    notes: [
      { n: "C4", d: 1 }, { n: "D4", d: 1 }, { n: "E4", d: 1 }, { n: "C4", d: 1 },
      { n: "C4", d: 1 }, { n: "D4", d: 1 }, { n: "E4", d: 1 }, { n: "C4", d: 1 },
      { n: "E4", d: 1 }, { n: "F4", d: 1 }, { n: "G4", d: 2 },
      { n: "E4", d: 1 }, { n: "F4", d: 1 }, { n: "G4", d: 2 },
      { n: "G4", d: 0.5 }, { n: "A4", d: 0.5 }, { n: "G4", d: 0.5 }, { n: "F4", d: 0.5 }, { n: "E4", d: 1 }, { n: "C4", d: 1 },
      { n: "G4", d: 0.5 }, { n: "A4", d: 0.5 }, { n: "G4", d: 0.5 }, { n: "F4", d: 0.5 }, { n: "E4", d: 1 }, { n: "C4", d: 1 },
      { n: "C4", d: 1 }, { n: "G3", d: 1 }, { n: "C4", d: 2 },
      { n: "C4", d: 1 }, { n: "G3", d: 1 }, { n: "C4", d: 2 },
    ],
  },
};
