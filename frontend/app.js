import { tokenize } from '../lexer.js';
import { parse } from '../parser.js';

const btn = document.getElementById('btnTranspilar');

btn.addEventListener('click', transpilar);

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