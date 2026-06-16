import { tokenize } from '../lexer.js';
import { parse } from '../parser.js';

const btn = document.getElementById('btnTranspilar');
const btnExecutar = document.getElementById('btnExecutar');

btn.addEventListener('click', transpilar);
btnExecutar.addEventListener('click', executar);

function transpilar() {

    const codigo = document.getElementById('codigo').value;

    const areaTokens = document.getElementById('tokens');
    const areaPython = document.getElementById('python');

    try {

        const tokens = tokenize(codigo);

        areaTokens.textContent =
            JSON.stringify(tokens, null, 2);

        const python = parse(tokens);

        areaPython.textContent = python;

    } catch (erro) {

        areaPython.textContent = erro.message;
    }
}

// guarda o pyodide pra nao carregar de novo
let pyodide = null;

async function executar() {

    const areaSaida = document.getElementById('saida');

    // transpila pra pegar o Python
    let python;
    try {
        const tokens = tokenize(document.getElementById('codigo').value);
        python = parse(tokens);
        document.getElementById('python').textContent = python;
    } catch (erro) {
        areaSaida.textContent = erro.message;
        return;
    }

    // carrega o pyodide so na primeira vez
    if (!pyodide) {
        areaSaida.textContent = 'Carregando o Python... (so na primeira vez)';
        pyodide = await loadPyodide();
    }

    // cada input() le uma linha do campo de entrada
    const linhasEntrada = document.getElementById('entrada').value.split('\n');
    let idxEntrada = 0;
    pyodide.setStdin({
        stdin: () => idxEntrada < linhasEntrada.length ? linhasEntrada[idxEntrada++] : ''
    });

    // junta o que o programa imprimir
    let resultado = '';
    pyodide.setStdout({ batched: (texto) => { resultado += texto + '\n'; } });
    pyodide.setStderr({ batched: (texto) => { resultado += texto + '\n'; } });

    try {
        await pyodide.runPythonAsync(python);
        areaSaida.textContent = resultado || '(o programa nao imprimiu nada)';
    } catch (erro) {
        areaSaida.textContent = resultado + erro.message;
    }
}