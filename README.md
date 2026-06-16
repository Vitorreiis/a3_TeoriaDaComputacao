# Transpilador Kiswahili → Python

Projeto desenvolvido para a disciplina de **Teoria da Computação e Compiladores**, com o objetivo de criar uma linguagem fictícia baseada no idioma **Suaíli (Kiswahili)** e transpilar seu código para Python.

## Funcionalidades

* Análise Léxica (Lexer)
* Análise Sintática (Parser)
* Análise Semântica
* Tabela de Símbolos
* Geração de Código Python
* Interface Web para testes
* Execução do código Python no navegador utilizando Pyodide

## Estrutura do Projeto

```text
.
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── lexer.js
├── parser.js
├── transpilador.js
└── README.md
```

## Como Executar

### Interface Web

1. Abra o projeto no VS Code.
2. Instale a extensão **Live Server**.
3. Abra o arquivo:

```text
frontend/index.html
```

4. Clique com o botão direito e selecione:

```text
Open with Live Server
```

5. Digite um código em Kiswahili e clique em **TRANSPILAR E EXECUTAR**.

### Terminal (Node.js)

Executar exibindo o Python gerado:

```bash
node transpilador.js programa.swh
```

Gerar um arquivo Python:

```bash
node transpilador.js programa.swh -o programa.py
```

Executar o Python gerado:

```bash
python programa.py
```

## Exemplo

Código Kiswahili:

```swahili
chapisha("Olá Mundo");
```

Python gerado:

```python
print("Olá Mundo")
```

Saída:

```text
Olá Mundo
```

## Tecnologias

* JavaScript
* HTML5
* CSS3
* Node.js
* Pyodide


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

## Autor

**Vitor Reis**, **Rodrigo Balthazar**, **Samuel Peixoto**
Ciência da Computação – UNIFACS
