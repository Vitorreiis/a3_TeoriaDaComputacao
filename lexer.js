// Lexer: le o codigo em Kiswahili e quebra em tokens

const TK = {
  INT: 'INT', FLOAT: 'FLOAT', STRING: 'STRING', BOOL: 'BOOL',
  ID: 'ID', NUM_INT: 'NUM_INT', NUM_FLOAT: 'NUM_FLOAT',
  STR_LIT: 'STR_LIT', BOOL_LIT: 'BOOL_LIT',
  ASSIGN: 'ASSIGN', EQ: 'EQ', NEQ: 'NEQ',
  LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
  PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH', MOD: 'MOD',
  AND: 'AND', OR: 'OR', NOT: 'NOT',
  LPAREN: 'LPAREN', RPAREN: 'RPAREN', LBRACE: 'LBRACE', RBRACE: 'RBRACE',
  SEMI: 'SEMI', COMMA: 'COMMA',
  IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', DO: 'DO', FOR: 'FOR',
  PRINT: 'PRINT', INPUT: 'INPUT', INPUT_INT: 'INPUT_INT', INPUT_FLOAT: 'INPUT_FLOAT',
  EOF: 'EOF'
};

const KEYWORDS = {
  'nambari':       TK.INT,
  'desimali':      TK.FLOAT,
  'maneno':        TK.STRING,
  'kweli_uongo':   TK.BOOL,
  'kweli':         TK.BOOL_LIT,
  'uongo':         TK.BOOL_LIT,
  'kama':          TK.IF,
  'sivyo':         TK.ELSE,
  'wakati':        TK.WHILE,
  'fanya':         TK.DO,
  'kwa':           TK.FOR,
  'chapisha':      TK.PRINT,
  'soma':          TK.INPUT,
  'soma_nambari':  TK.INPUT_INT,
  'soma_desimali': TK.INPUT_FLOAT,
  'na':            TK.AND,
  'au':            TK.OR,
  'si':            TK.NOT
};

function tokenize(src) {
  const tokens = [];
  let i = 0;
  let line = 1;
  const len = src.length;

  while (i < len) {
    // pula espaco em branco
    if (/\s/.test(src[i])) {
      if (src[i] === '\n') line++;
      i++;
      continue;
    }

    // comentario com //
    if (src[i] === '/' && src[i + 1] === '/') {
      while (i < len && src[i] !== '\n') i++;
      continue;
    }

    // string entre aspas
    if (src[i] === '"') {
      let s = '';
      i++;
      while (i < len && src[i] !== '"') {
        if (src[i] === '\n') throw new Error(`[Linha ${line}] String não fechada.`);
        s += src[i];
        i++;
      }
      if (i >= len) throw new Error(`[Linha ${line}] String não fechada.`);
      i++;
      tokens.push({ type: TK.STR_LIT, val: s, line });
      continue;
    }

    // numeros (int ou com ponto)
    if (/\d/.test(src[i])) {
      let s = '';
      while (i < len && /\d/.test(src[i])) { s += src[i]; i++; }
      if (i < len && src[i] === '.' && i + 1 < len && /\d/.test(src[i + 1])) {
        s += '.'; i++;
        while (i < len && /\d/.test(src[i])) { s += src[i]; i++; }
        tokens.push({ type: TK.NUM_FLOAT, val: parseFloat(s), line });
      } else {
        tokens.push({ type: TK.NUM_INT, val: parseInt(s), line });
      }
      continue;
    }

    // nome de variavel ou palavra-chave
    if (/[a-zA-Z_]/.test(src[i])) {
      let s = '';
      while (i < len && /[a-zA-Z0-9_]/.test(src[i])) { s += src[i]; i++; }
      const kw = KEYWORDS[s];
      tokens.push(kw ? { type: kw, val: s, line } : { type: TK.ID, val: s, line });
      continue;
    }

    // operadores de dois caracteres (==, !=, <=, >=)
    const two = src.slice(i, i + 2);
    if (two === '==') { tokens.push({ type: TK.EQ,  line }); i += 2; continue; }
    if (two === '!=') { tokens.push({ type: TK.NEQ, line }); i += 2; continue; }
    if (two === '<=') { tokens.push({ type: TK.LTE, line }); i += 2; continue; }
    if (two === '>=') { tokens.push({ type: TK.GTE, line }); i += 2; continue; }

    // operadores e simbolos de um caractere
    const single = {
      '=': TK.ASSIGN, '<': TK.LT,    '>': TK.GT,
      '+': TK.PLUS,   '-': TK.MINUS, '*': TK.STAR, '/': TK.SLASH, '%': TK.MOD,
      '(': TK.LPAREN, ')': TK.RPAREN,
      '{': TK.LBRACE, '}': TK.RBRACE,
      ';': TK.SEMI,   ',': TK.COMMA
    };
    if (single[src[i]]) { tokens.push({ type: single[src[i]], line }); i++; continue; }

    throw new Error(`[Linha ${line}] Caractere desconhecido: '${src[i]}'`);
  }

  tokens.push({ type: TK.EOF, line });
  return tokens;
}

export { TK, tokenize };
