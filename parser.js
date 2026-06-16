// Parser (analise sintatica) + checagem de variaveis + geracao do Python
// usa descida recursiva, sem recursao a esquerda

import { TK } from './lexer.js';

function parse(tokens) {
  let pos = 0;

  // tabela de simbolos = pilha de escopos. cada escopo guarda nome -> tipo da var
  const symtable = [{}];

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

  // funcoes pra mexer nos tokens
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
    return tokens[pos++].type; // so chamar quando ja sabe que e um tipo
  }

  function typeToPy(t) {
    return { INT: 'int', FLOAT: 'float', STRING: 'str', BOOL: 'bool' }[t];
  }

  // expressoes. a ordem das funcoes ja da a precedencia dos operadores:
  // or > and > not > comparacao > +/- > * / % > unario > primario
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

  // bloco entre chaves { ... }
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
    // se o bloco ficou vazio precisa de um pass senao o Python da erro
    if (lines.length === 0) lines.push('    '.repeat(indent) + 'pass');
    return lines.join('\n');
  }

  // comandos (statements)
  function stmt(indent) {
    const pad = '    '.repeat(indent);
    const t = cur();

    // declaracao de variavel: tipo ID [ = expr ]
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

    // atribuicao: ID = expr
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

    // chapisha vira print
    if (t.type === TK.PRINT) {
      pos++;
      eat(TK.LPAREN);
      const e = expr();
      eat(TK.RPAREN);
      eatOpt(TK.SEMI);
      return `${pad}print(${e})`;
    }

    // soma / soma_nambari / soma_desimali viram input()
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

    // kama vira if (e sivyo vira else)
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
          // sivyo kama vira elif
          const elseif = stmt(indent);
          out += `\n${pad}el${elseif.trimStart()}`;
        } else {
          const eb = block(indent + 1);
          out += `\n${pad}else:\n${eb}`;
        }
      }
      return out;
    }

    // wakati vira while
    if (t.type === TK.WHILE) {
      pos++;
      eat(TK.LPAREN);
      const cond = expr();
      eat(TK.RPAREN);
      const body = block(indent + 1);
      return `${pad}while ${cond}:\n${body}`;
    }

    // fanya...wakati e o do-while. Python nao tem entao faco com while True + break
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

    // kwa e o for. Python nao tem for desse jeito entao transformo num while
    if (t.type === TK.FOR) {
      pos++;
      eat(TK.LPAREN);
      pushScope();

      // parte de inicio: pode ser "tipo ID = expr" ou so "ID = expr"
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

      // parte do incremento: ID = expr
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

    // ponto e virgula sozinho, so ignora
    if (t.type === TK.SEMI) { pos++; return ''; }

    throw new Error(`[Linha ${t.line}] Erro sintático: instrução inesperada '${t.type}'${t.val !== undefined ? ` ('${t.val}')` : ''}`);
  }

  // le o programa inteiro, um comando atras do outro
  const output = [];
  while (cur().type !== TK.EOF) {
    const s = stmt(0);
    if (s && s.trim()) output.push(s);
  }
  return output.join('\n');
}

export { parse };
