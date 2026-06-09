#!/usr/bin/env node
// ─── TRANSPILADOR KISWAHILI → PYTHON ─────────────────────────────────────────
// Uso:
//   node transpilador.js <arquivo.swh>              → imprime Python no terminal
//   node transpilador.js <arquivo.swh> -o <saida.py> → salva em arquivo

const fs   = require('fs');
const path = require('path');
const { tokenize } = require('./lexer');
const { parse }    = require('./parser');

// ── Lê argumentos ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
╔══════════════════════════════════════════════════════╗
║       Transpilador Kiswahili → Python  v1.0          ║
╚══════════════════════════════════════════════════════╝

Uso:
  node transpilador.js <arquivo.swh>
  node transpilador.js <arquivo.swh> -o <saida.py>

Exemplos:
  node transpilador.js programa.swh
  node transpilador.js fatorial.swh -o fatorial.py
  node transpilador.js programa.swh -o saida.py && python saida.py
`);
  process.exit(0);
}

const inputFile = args[0];
const outFlag   = args.indexOf('-o');
const outputFile = outFlag !== -1 ? args[outFlag + 1] : null;

// ── Verifica se o arquivo existe ─────────────────────────────────────────────
if (!fs.existsSync(inputFile)) {
  console.error(`\n❌  Arquivo não encontrado: "${inputFile}"\n`);
  process.exit(1);
}

// ── Lê o código-fonte ────────────────────────────────────────────────────────
const source = fs.readFileSync(inputFile, 'utf8');

console.log(`\n🔤  Transpilando: ${path.resolve(inputFile)}`);

// ── Pipeline: Lexer → Parser → Gerador ───────────────────────────────────────
let pythonCode;
try {
  const tokens = tokenize(source);
  pythonCode   = parse(tokens);
} catch (err) {
  console.error(`\n❌  ${err.message}\n`);
  process.exit(1);
}

// ── Cabeçalho no código gerado ───────────────────────────────────────────────
const header = [
  `# Gerado pelo Transpilador Kiswahili → Python`,
  `# Fonte: ${path.basename(inputFile)}`,
  `# ─────────────────────────────────────────────`,
  ''
].join('\n');

const finalCode = header + pythonCode + '\n';

// ── Saída ─────────────────────────────────────────────────────────────────────
if (outputFile) {
  fs.writeFileSync(outputFile, finalCode, 'utf8');
  console.log(`✅  Python gerado em: ${path.resolve(outputFile)}`);
  console.log(`▶️   Execute com:  python ${outputFile}\n`);
} else {
  console.log(`\n${'─'.repeat(50)}\n`);
  console.log(finalCode);
  console.log('─'.repeat(50));
  console.log('\n💡  Use  -o saida.py  para salvar em arquivo.\n');
}
