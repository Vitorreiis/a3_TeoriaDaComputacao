// ─── PARSER + ANÁLISE SEMÂNTICA + GERADOR DE CÓDIGO ──────────────────────────
// Parser descendente recursivo sem recursão à esquerda.
// A análise semântica (escopo, declarações) é feita embutida.
// O código Python é emitido diretamente durante a análise.

import { TK } from '../lexer.js';

function parse(tokens) {
  let pos = 0;

  // ── Tabela de símbolos: pilha de escopos ──────────────────────────────────
  const symtable = [{}]; // cada elemento: { nomVar: 'INT'|'FLOAT'|'STRING'|'BOOL' }

  function pushScope() { symtable.push({}); }
  function popScope()  { symtable.pop(); }

  function declareVar(name, type) {
    symtable[symtable.length - 1][name] = type;
  }

  function lookupVar(name) {
    for (let i = symtable.length - 1; i >= 0; i--) {
      if (symtable[i][name]) return symtable[i][name];
    }
    return null;
  }

  // ── Utilitários de token ──────────────────────────────────────────────────
  function cur()  { return tokens[pos]; }
  function peek(offset = 0) { return tokens[pos + offset]; }

  function eat(type) {
    const t = cur();
    if (t.type !== type) {
      throw new Error(
        `[Linha ${t.line}] Erro sintático: esperado '${type}', encontrado '${t.type}'` +
        (t.val !== undefined ? ` ('${t.val}')` : '')
      );
    }
    return tokens[pos++];
  }

  function eatOpt(type) {
    if (cur().type === type) { pos++; return true; }
    return false;
  }

  function isTypeKw() {
    return [TK.INT, TK.FLOAT, TK.STRING, TK.BOOL].includes(cur().type);
  }

  function consumeTypeKw() {
    return tokens[pos++].type; // garante que é tipo antes de chamar
  }

  function typeToPy(t) {
    return { INT: 'int', FLOAT: 'float', STRING: 'str', BOOL: 'bool' }[t];
  }

  // ── Expressões (precedência via hierarquia de funções) ────────────────────
  //  exprOr > exprAnd > exprNot > exprCmp > exprAdd > exprMul > exprUnary > exprPrimary

  function expr()      { return exprOr(); }

  function exprOr() {
    let l = exprAnd();
    while (cur().type === TK.OR) { pos++; l = `${l} or ${exprAnd()}`; }
    return l;
  }

  function exprAnd() {
    let l = exprNot();
    while (cur().type === TK.AND) { pos++; l = `${l} and ${exprNot()}`; }
    return l;
  }

  function exprNot() {
    if (cur().type === TK.NOT) { pos++; return `not ${exprNot()}`; }
    return exprCmp();
  }

  function exprCmp() {
    let l = exprAdd();
    const ops = { EQ: '==', NEQ: '!=', LT: '<', GT: '>', LTE: '<=', GTE: '>=' };
    while (ops[cur().type]) {
      const op = ops[cur().type]; pos++;
      l = `${l} ${op} ${exprAdd()}`;
    }
    return l;
  }

  function exprAdd() {
    let l = exprMul();
    while (cur().type === TK.PLUS || cur().type === TK.MINUS) {
      const op = cur().type === TK.PLUS ? '+' : '-'; pos++;
      l = `${l} ${op} ${exprMul()}`;
    }
    return l;
  }

  function exprMul() {
    let l = exprUnary();
    while ([TK.STAR, TK.SLASH, TK.MOD].includes(cur().type)) {
      const op = { STAR: '*', SLASH: '/', MOD: '%' }[cur().type]; pos++;
      l = `${l} ${op} ${exprUnary()}`;
    }
    return l;
  }

  function exprUnary() {
    if (cur().type === TK.MINUS) { pos++; return `-${exprPrimary()}`; }
    return exprPrimary();
  }

  function exprPrimary() {
    const t = cur();
    if (t.type === TK.NUM_INT)  { pos++; return String(t.val); }
    if (t.type === TK.NUM_FLOAT){ pos++; return String(t.val); }
    if (t.type === TK.STR_LIT)  { pos++; return `"${t.val}"`; }
    if (t.type === TK.BOOL_LIT) { pos++; return t.val === 'kweli' ? 'True' : 'False'; }
    if (t.type === TK.ID) {
      const name = t.val; pos++;
      if (!lookupVar(name))
        throw new Error(`[Linha ${t.line}] Erro semântico: variável não declarada: '${name}'`);
      return name;
    }
    if (t.type === TK.LPAREN) {
      pos++;
      const e = expr();
      eat(TK.RPAREN);
      return `(${e})`;
    }
    throw new Error(`[Linha ${t.line}] Erro sintático: expressão inválida perto de '${t.type}'${t.val !== undefined ? ` ('${t.val}')` : ''}`);
  }

  // ── Bloco { stmts } ───────────────────────────────────────────────────────
  function block(indent) {
    eat(TK.LBRACE);
    pushScope();
    const lines = [];
    while (cur().type !== TK.RBRACE && cur().type !== TK.EOF) {
      const s = stmt(indent);
      if (s && s.trim()) lines.push(s);
    }
    popScope();
    eat(TK.RBRACE);
    // Se o bloco ficou vazio, emite pass para Python válido
    if (lines.length === 0) lines.push('    '.repeat(indent) + 'pass');
    return lines.join('\n');
  }

  // ── Statements ────────────────────────────────────────────────────────────
  function stmt(indent) {
    const pad = '    '.repeat(indent);
    const t = cur();

    // ── Declaração de variável: tipo ID [ = expr ] ──────────────────────────
    if (isTypeKw()) {
      const declType = consumeTypeKw();
      const name = eat(TK.ID).val;
      const pyType = typeToPy(declType);
      const defaults = { INT: '0', FLOAT: '0.0', STRING: '""', BOOL: 'False' };

      if (cur().type === TK.ASSIGN) {
        pos++;
        const e = expr();
        declareVar(name, declType);
        eatOpt(TK.SEMI);
        return `${pad}${name}: ${pyType} = ${e}`;
      } else {
        declareVar(name, declType);
        eatOpt(TK.SEMI);
        return `${pad}${name}: ${pyType} = ${defaults[declType]}`;
      }
    }

    // ── Atribuição: ID = expr ───────────────────────────────────────────────
    if (t.type === TK.ID) {
      const name = t.val;
      if (!lookupVar(name))
        throw new Error(`[Linha ${t.line}] Erro semântico: variável não declarada: '${name}'`);
      pos++;
      eat(TK.ASSIGN);
      const e = expr();
      eatOpt(TK.SEMI);
      return `${pad}${name} = ${e}`;
    }

    // ── chapisha (print) ────────────────────────────────────────────────────
    if (t.type === TK.PRINT) {
      pos++;
      eat(TK.LPAREN);
      const e = expr();
      eat(TK.RPAREN);
      eatOpt(TK.SEMI);
      return `${pad}print(${e})`;
    }

    // ── soma / soma_nambari / soma_desimali (input) ─────────────────────────
    if (t.type === TK.INPUT || t.type === TK.INPUT_INT || t.type === TK.INPUT_FLOAT) {
      const kind = tokens[pos++].type;
      eat(TK.LPAREN);
      const name = eat(TK.ID).val;
      if (!lookupVar(name))
        throw new Error(`[Linha ${t.line}] Erro semântico: variável não declarada: '${name}'`);
      eat(TK.RPAREN);
      eatOpt(TK.SEMI);
      if (kind === TK.INPUT_INT)   return `${pad}${name} = int(input())`;
      if (kind === TK.INPUT_FLOAT) return `${pad}${name} = float(input())`;
      return `${pad}${name} = input()`;
    }

    // ── kama (if) ───────────────────────────────────────────────────────────
    if (t.type === TK.IF) {
      pos++;
      eat(TK.LPAREN);
      const cond = expr();
      eat(TK.RPAREN);
      const body = block(indent + 1);
      let out = `${pad}if ${cond}:\n${body}`;
      if (cur().type === TK.ELSE) {
        pos++;
        if (cur().type === TK.IF) {
          // elif encadeado
          const elseif = stmt(indent);
          out += `\n${pad}el${elseif.trimStart()}`;
        } else {
          const eb = block(indent + 1);
          out += `\n${pad}else:\n${eb}`;
        }
      }
      return out;
    }

    // ── wakati (while) ──────────────────────────────────────────────────────
    if (t.type === TK.WHILE) {
      pos++;
      eat(TK.LPAREN);
      const cond = expr();
      eat(TK.RPAREN);
      const body = block(indent + 1);
      return `${pad}while ${cond}:\n${body}`;
    }

    // ── fanya...wakati (do-while) ───────────────────────────────────────────
    if (t.type === TK.DO) {
      pos++;
      const body = block(indent + 1);
      eat(TK.WHILE);
      eat(TK.LPAREN);
      const cond = expr();
      eat(TK.RPAREN);
      eatOpt(TK.SEMI);
      const brk = '    '.repeat(indent + 2);
      return (
        `${pad}while True:\n${body}\n` +
        `${'    '.repeat(indent + 1)}if not (${cond}):\n` +
        `${brk}break`
      );
    }

    // ── kwa (for) ───────────────────────────────────────────────────────────
    if (t.type === TK.FOR) {
      pos++;
      eat(TK.LPAREN);
      pushScope();

      // init: tipo ID = expr  |  ID = expr
      let initCode = '';
      if (isTypeKw()) {
        const initType = consumeTypeKw();
        const iname = eat(TK.ID).val;
        eat(TK.ASSIGN);
        const iv = expr();
        declareVar(iname, initType);
        initCode = `${pad}${iname} = ${iv}`;
      } else {
        const iname = eat(TK.ID).val;
        if (!lookupVar(iname))
          throw new Error(`[Linha ${cur().line}] Erro semântico: variável não declarada: '${iname}'`);
        eat(TK.ASSIGN);
        const iv = expr();
        initCode = `${pad}${iname} = ${iv}`;
      }
      eat(TK.SEMI);

      const cond = expr();
      eat(TK.SEMI);

      // update: ID = expr
      const uname = eat(TK.ID).val;
      if (!lookupVar(uname))
        throw new Error(`[Linha ${cur().line}] Erro semântico: variável não declarada: '${uname}'`);
      eat(TK.ASSIGN);
      const uval = expr();
      eat(TK.RPAREN);

      const body = block(indent + 1);
      popScope();

      const upd = `${'    '.repeat(indent + 1)}${uname} = ${uval}`;
      return `${initCode}\n${pad}while ${cond}:\n${body}\n${upd}`;
    }

    // Ponto-e-vírgula solto → ignora
    if (t.type === TK.SEMI) { pos++; return ''; }

    throw new Error(`[Linha ${t.line}] Erro sintático: instrução inesperada '${t.type}'${t.val !== undefined ? ` ('${t.val}')` : ''}`);
  }

  // ── Programa principal ───────────────────────────────────────────────────
  const output = [];
  while (cur().type !== TK.EOF) {
    const s = stmt(0);
    if (s && s.trim()) output.push(s);
  }
  return output.join('\n');
}

export { parse };
