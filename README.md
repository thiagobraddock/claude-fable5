# 🎹 Piano Tutor

Aplicação web para quem está aprendendo a tocar piano. Tem um teclado virtual que
emite o som das notas e um modo de aprendizado que acompanha pequenas melodias,
mostrando nota a nota o que tocar e apontando os erros em tempo real.

## Como usar

Não precisa instalar nada — é HTML/CSS/JavaScript puro (Web Audio API):

```bash
# opção 1: abrir direto
abra o arquivo index.html no navegador

# opção 2: servir localmente
python3 -m http.server 8000
# e acesse http://localhost:8000
```

## Funcionalidades

- **Teclado virtual** de Sol3 a Dó6, tocável com o mouse/toque ou com o teclado
  do computador (`Z X C V B N M` para a oitava grave, `Q W E R T Y U I` para a
  aguda; teclas pretas em `S D G H J` e `2 3 5 6 7`).
- **Som sintetizado** das notas via Web Audio API (sem arquivos de áudio).
- **Modo "Aprender melodia"**:
  - A próxima nota a tocar fica destacada em azul (pulsando) no teclado.
  - A sequência completa da música aparece acima do teclado, com a posição atual marcada.
  - Acertou → a tecla pisca verde e você avança.
  - Errou → a tecla pisca vermelho, o erro é contado e a aplicação informa qual era a nota certa.
  - Estatísticas em tempo real: progresso, acertos, erros e precisão.
- **Botão "Ouvir melodia"** que toca a música inteira destacando as teclas, para você memorizar antes de praticar.
- **Nomes das notas** em Dó-Ré-Mi ou C-D-E (ou ocultos, para treinar de ouvido).

## Melodias incluídas (domínio público)

- Parabéns pra Você
- Ode à Alegria (9ª Sinfonia de Beethoven)
- Brilha Brilha Estrelinha
- Frère Jacques

## Adicionando novas melodias

Edite `songs.js` e acrescente uma entrada no objeto `SONGS`:

```js
minhaMusica: {
  title: "Minha Música",
  bpm: 100,
  notes: [
    { n: "C4", d: 1 },   // n = nota (notação científica), d = duração em tempos
    { n: "D4", d: 0.5 },
  ],
},
```

As notas devem estar dentro do intervalo do teclado (G3 a C6).
