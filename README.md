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

## Adicionando novas melodias (sem programar!)

No modo "Aprender melodia", clique em **➕ Nova melodia**. O fluxo é pensado
para quem não programa:

1. O botão **Copiar instruções para o Claude** copia um prompt pronto.
2. Cole o prompt no [claude.ai](https://claude.ai) junto com uma **foto da
   partitura, um PDF ou só o nome da música** — o Claude faz o parse e devolve
   o código da melodia.
3. Cole o código no campo de importação e pronto: a melodia entra na lista
   "Minhas melodias", fica salva no navegador (localStorage) e já abre em modo
   de prática.

O importador aceita:

```json
{"title":"Minha Música","bpm":100,"notes":[{"n":"C4","d":1},{"n":"D4","d":0.5}]}
```

ou um formato simples digitado à mão (nomes em português valem!):

```
titulo: Minha Música
bpm: 100
Dó4 Ré4:0.5 Mi4 Fá4:2
```

Se a melodia não couber no teclado (G3 a C6), o importador tenta transpor por
oitavas automaticamente. Melodias fixas do app continuam em `songs.js`, no
mesmo formato.
