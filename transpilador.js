#!/usr/bin/env node
// programa principal do transpilador de Kiswahili pra Python
// uso: node transpilador.js arquivo.swh        (mostra no terminal)
//      node transpilador.js arquivo.swh -o saida.py   (salva em arquivo)

const fs   = require('fs');
const path = require('path');
const { tokenize } = require('./lexer');
const { parse }    = require('./parser');

// pega os argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Transpilador Kiswahili -> Python

Uso:
  node transpilador.js <arquivo.swh>
  node transpilador.js <arquivo.swh> -o <saida.py>

Exemplos:
  node transpilador.js programa.swh
  node transpilador.js fatorial.swh -o fatorial.py
`);
  process.exit(0);
}

const inputFile = args[0];
const outFlag   = args.indexOf('-o');
const outputFile = outFlag !== -1 ? args[outFlag + 1] : null;

// confere se o arquivo existe
if (!fs.existsSync(inputFile)) {
  console.error(`Arquivo nao encontrado: "${inputFile}"`);
  process.exit(1);
}

// le o codigo fonte
const source = fs.readFileSync(inputFile, 'utf8');

console.log(`Transpilando: ${path.resolve(inputFile)}`);

// roda o lexer e depois o parser
let pythonCode;
try {
  const tokens = tokenize(source);
  pythonCode   = parse(tokens);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// coloca um cabecalho no Python gerado
const header = [
  `# Gerado pelo transpilador Kiswahili -> Python`,
  `# Fonte: ${path.basename(inputFile)}`,
  ''
].join('\n');

const finalCode = header + pythonCode + '\n';

// imprime na tela ou salva no arquivo
if (outputFile) {
  fs.writeFileSync(outputFile, finalCode, 'utf8');
  console.log(`Python gerado em: ${path.resolve(outputFile)}`);
  console.log(`Execute com: python ${outputFile}`);
} else {
  console.log('');
  console.log(finalCode);
}
