# Transpilador Kiswahili → Python

Transpila programas escritos na linguagem **Kiswahili** para **Python 3**.

## Estrutura do projeto

```
transpilador/
├── transpilador.js   ← ponto de entrada (CLI)
├── lexer.js          ← análise léxica
├── parser.js         ← análise sintática, semântica e geração de código
├── README.md
└── exemplos/
    ├── ola_mundo.swh
    ├── fatorial.swh
    ├── fibonacci.swh
    ├── dowhile.swh
    └── par_impar.swh
```

## Requisitos

- [Node.js](https://nodejs.org/) (qualquer versão ≥ 14)
- Não precisa instalar nenhum pacote (`npm install`)

## Como usar

### 1. Imprimir Python no terminal
```bash
node transpilador.js exemplos/fatorial.swh
```

### 2. Salvar em arquivo e executar
```bash
node transpilador.js exemplos/fatorial.swh -o saida.py
python saida.py
```

### 3. Rodar todos os exemplos de uma vez
```bash
for f in exemplos/*.swh; do
  echo "=== $f ===";
  node transpilador.js "$f";
done
```

---

## Linguagem Kiswahili — Referência rápida

### Tipos
| Kiswahili      | Tipo    | Exemplo                        |
|----------------|---------|--------------------------------|
| `nambari`      | int     | `nambari x = 10`               |
| `desimali`     | float   | `desimali pi = 3.14`           |
| `maneno`       | string  | `maneno s = "Jambo"`           |
| `kweli_uongo`  | bool    | `kweli_uongo b = kweli`        |

### Booleanos
- `kweli` → `True`
- `uongo` → `False`

### Estruturas de controle
```
kama (cond) { ... } sivyo { ... }
wakati (cond) { ... }
fanya { ... } wakati (cond)
kwa (nambari i = 0; i < 10; i = i + 1) { ... }
```

### E/S
```
chapisha(x)            → print(x)
soma(x)                → x = input()
soma_nambari(x)        → x = int(input())
soma_desimali(x)       → x = float(input())
```

### Operadores
- Aritméticos: `+ - * / %`
- Relacionais: `== != < > <= >=`
- Lógicos: `na` (and), `au` (or), `si` (not)
- Comentários: `// texto`

---

## Exemplo completo

**fatorial.swh**
```
nambari n = 5
nambari fat = 1
kwa (nambari i = 1; i <= n; i = i + 1) {
  fat = fat * i
}
chapisha(fat)
```

**Python gerado**
```python
n: int = 5
fat: int = 1
i = 1
while i <= n:
    fat = fat * i
    i = i + 1
print(fat)
```
