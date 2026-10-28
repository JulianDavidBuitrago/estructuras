/* =========================================================
   Bosque de Datos — Banco de niveles y ejercicios
   ---------------------------------------------------------
   Tipos de ejercicio disponibles:
   - mc        : opción múltiple            (options, answer)
   - fill      : completar código           (code con "____", answers)
   - order     : ordenar líneas de código   (lines en orden correcto, alts opcional)
   - select    : seleccionar nodos          (tree, answer: [valores])
   - traverse  : recorrido interactivo      (tree, order: pre | in | post | level)
   - bstbuild  : construir un BST           (start: [valores], values: [a insertar])
   - sim       : simulador de pila/cola     (kind: pila | cola, ops)
   Todos admiten: q, hints[], explain, topic (para el reporte final).
   ========================================================= */

const T = (v, l = null, r = null) => ({ v, l, r });

/* Árboles de referencia */
const ARBOL_A = T(8, T(3, T(1), T(6, T(4), T(7))), T(10, null, T(14, T(13))));
const ARBOL_B = T('F', T('B', T('A'), T('D', T('C'), T('E'))), T('G', null, T('I', T('H'))));
const ARBOL_C = T(25, T(15, T(10, T(4)), T(22, T(18))), T(50, T(35, null, T(44)), T(70)));
const ARBOL_BST = T(50, T(30, T(20), T(40)), T(70, T(60), T(80)));

const LEVELS = [
  /* ------------------------------------------------ NIVEL 1 */
  {
    id: 1, icon: '🔗', title: 'Nodos y enlaces',
    desc: 'La pieza básica: un dato y una referencia.',
    brief: `<ul>
      <li>Un <b>nodo</b> guarda un <b>dato</b> y una <b>referencia</b> al siguiente nodo.</li>
      <li>Una lista enlazada se maneja desde su <b>cabeza</b>; el último nodo apunta a <code>None</code>.</li>
      <li>Para recorrerla se usa un puntero auxiliar que avanza con <code>actual = actual.siguiente</code>.</li>
    </ul>`,
    snippet: `class Nodo:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None`,
    exercises: [
      {
        type: 'mc', topic: 'Nodos',
        q: 'Observa la clase. ¿Qué guarda el atributo <code>siguiente</code>?',
        code: `class Nodo:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None`,
        options: [
          'El valor numérico del nodo',
          'Una referencia (enlace) al próximo nodo de la cadena',
          'La posición del nodo dentro de una lista de Python',
          'La cantidad de nodos que hay después'
        ],
        answer: 1,
        hints: ['Piensa en un tren: cada vagón sabe cuál vagón viene después.', 'El dato ya está guardado en <code>self.dato</code>.'],
        explain: '<code>siguiente</code> apunta al próximo nodo. Cuando vale <code>None</code>, ese nodo es el último de la cadena.'
      },
      {
        type: 'fill', topic: 'Nodos',
        q: 'Completa el constructor: un nodo recién creado todavía no está enlazado a ningún otro.',
        code: `class Nodo:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = ____`,
        answers: ['None'],
        hints: ['En Python, “ningún objeto” se escribe con una palabra reservada que empieza por mayúscula.'],
        explain: 'Se inicializa en <code>None</code> porque aún no existe un nodo siguiente.'
      },
      {
        type: 'mc', topic: 'Nodos',
        q: '¿Qué imprime este programa?',
        code: `a = Nodo(3)
b = Nodo(7)
c = Nodo(9)
a.siguiente = b
b.siguiente = c
print(a.siguiente.siguiente.dato)`,
        options: ['3', '7', '9', 'AttributeError'],
        answer: 2,
        hints: ['Avanza un salto a la vez: <code>a.siguiente</code> es <code>b</code>.', '¿A quién apunta <code>b.siguiente</code>?'],
        explain: 'La cadena es a → b → c. Dos saltos desde <code>a</code> llegan a <code>c</code>, cuyo dato es 9.'
      },
      {
        type: 'order', topic: 'Nodos',
        q: 'Ordena los bloques para recorrer una lista enlazada e imprimir cada dato.',
        lines: [
          'def recorrer(cabeza):',
          '    actual = cabeza',
          '    while actual is not None:',
          '        print(actual.dato)',
          '        actual = actual.siguiente'
        ],
        hints: ['Primero se define la función y se crea un puntero auxiliar.', 'Dentro del ciclo: primero usas el dato y después avanzas.'],
        explain: 'El puntero <code>actual</code> avanza nodo a nodo hasta encontrar <code>None</code>. Si avanzaras antes de imprimir, te saltarías la cabeza.'
      },
      {
        type: 'fill', topic: 'Nodos',
        q: 'Completa la función que inserta un nuevo nodo al <b>inicio</b> de la lista y retorna la nueva cabeza.',
        code: `def insertar_inicio(cabeza, dato):
    nuevo = Nodo(dato)
    nuevo.siguiente = ____
    return nuevo`,
        answers: ['cabeza'],
        hints: ['El nuevo nodo debe quedar ANTES de la cabeza actual.'],
        explain: 'El nuevo nodo apunta a la antigua cabeza y se convierte en la nueva cabeza. Es una operación O(1).'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 2 */
  {
    id: 2, icon: '📚', title: 'Pilas (LIFO)',
    desc: 'El último en entrar es el primero en salir.',
    brief: `<ul>
      <li>Una <b>pila</b> sigue el principio <b>LIFO</b>: <i>Last In, First Out</i>.</li>
      <li>Operaciones: <b>apilar</b> (<code>append</code>), <b>desapilar</b> (<code>pop</code>) y <b>ver el tope</b> (<code>pila[-1]</code>). Todas son O(1).</li>
      <li>Usos reales: botón Deshacer, llamadas recursivas, validar paréntesis.</li>
    </ul>`,
    snippet: `pila = []
pila.append(5)    # apilar
pila.append(8)
tope = pila[-1]   # 8
pila.pop()        # saca el 8`,
    exercises: [
      {
        type: 'mc', topic: 'Pilas',
        q: '¿Qué principio sigue una pila?',
        options: [
          'FIFO: el primero en entrar es el primero en salir',
          'LIFO: el último en entrar es el primero en salir',
          'Siempre sale el elemento menor',
          'Se puede sacar cualquier elemento'
        ],
        answer: 1,
        hints: ['Piensa en una pila de platos: ¿cuál retiras primero?'],
        explain: 'LIFO: solo se trabaja sobre el <b>tope</b>. El último elemento apilado es el primero que sale.'
      },
      {
        type: 'sim', topic: 'Pilas', kind: 'pila',
        q: 'Ejecuta las operaciones sobre la pila. Cada vez que aparezca <code>pila.pop()</code>, haz clic en el elemento que sale.',
        ops: [['in', 4], ['in', 9], ['in', 1], ['out'], ['in', 6], ['out'], ['out']],
        hints: ['Solo puede salir el elemento que está en el <b>tope</b> (arriba).'],
        explain: 'Salen en orden 1, 6 y 9. Al final, la pila queda con <code>[4]</code>.'
      },
      {
        type: 'mc', topic: 'Pilas',
        q: '¿Qué imprime este código?',
        code: `pila = []
pila.append(10)
pila.append(20)
pila.append(30)
pila.pop()
print(pila[-1])`,
        options: ['10', '20', '30', 'IndexError'],
        answer: 1,
        hints: ['<code>pop()</code> saca el último elemento agregado.', '<code>pila[-1]</code> es el nuevo tope.'],
        explain: '<code>pop()</code> saca el 30. El nuevo tope, <code>pila[-1]</code>, es 20.'
      },
      {
        type: 'fill', topic: 'Pilas',
        q: 'Completa el método que consulta el tope <b>sin sacarlo</b>.',
        code: `class Pila:
    def __init__(self):
        self.items = []

    def ver_tope(self):
        return self.items[____]`,
        answers: ['-1', 'len(self.items)-1'],
        hints: ['En Python los índices negativos cuentan desde el final de la lista.'],
        explain: '<code>self.items[-1]</code> devuelve el último elemento, es decir, el tope de la pila.'
      },
      {
        type: 'order', topic: 'Pilas',
        q: 'La pila está implementada con nodos (<code>self.tope</code> apunta al nodo de arriba). Ordena el método <code>desapilar</code>.',
        lines: [
          'def desapilar(self):',
          '    if self.tope is None:',
          '        raise IndexError("Pila vacía")',
          '    dato = self.tope.dato',
          '    self.tope = self.tope.siguiente',
          '    return dato'
        ],
        hints: ['Lo primero es protegerte de una pila vacía.', 'Guarda el dato ANTES de mover el tope.'],
        explain: 'Se valida la pila vacía, se guarda el dato del tope, el tope pasa al nodo de abajo y se retorna el dato guardado.'
      },
      {
        type: 'mc', topic: 'Pilas',
        q: '¿Cuál de estas situaciones se modela de forma natural con una pila?',
        options: [
          'La fila de un banco',
          'El botón Deshacer (Ctrl + Z) de un editor',
          'La cola de impresión de una oficina',
          'Los turnos de un call center'
        ],
        answer: 1,
        hints: ['¿Qué acción se deshace primero: la más reciente o la más antigua?'],
        explain: 'Deshacer revierte primero la última acción realizada: comportamiento LIFO. Los demás casos son colas (FIFO).'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 3 */
  {
    id: 3, icon: '🚶', title: 'Colas (FIFO)',
    desc: 'El primero en llegar es el primero en ser atendido.',
    brief: `<ul>
      <li>Una <b>cola</b> sigue el principio <b>FIFO</b>: <i>First In, First Out</i>.</li>
      <li>Se inserta por el <b>final</b> y se retira por el <b>frente</b>.</li>
      <li>En Python se usa <code>collections.deque</code>: <code>append</code> para encolar y <code>popleft</code> para desencolar, ambas O(1).</li>
    </ul>`,
    snippet: `from collections import deque

cola = deque()
cola.append("Ana")     # encolar
cola.append("Luis")
cola.popleft()         # sale "Ana"`,
    exercises: [
      {
        type: 'mc', topic: 'Colas',
        q: '¿Qué principio sigue una cola?',
        options: ['LIFO', 'FIFO', 'Por prioridad aleatoria', 'Por tamaño del dato'],
        answer: 1,
        hints: ['Piensa en la fila de un supermercado.'],
        explain: 'FIFO: el primero que entra es el primero que sale, como una fila de personas.'
      },
      {
        type: 'sim', topic: 'Colas', kind: 'cola',
        q: 'Ejecuta las operaciones sobre la cola. Cada vez que aparezca <code>cola.popleft()</code>, haz clic en el elemento que sale.',
        ops: [['in', 5], ['in', 2], ['in', 8], ['out'], ['in', 3], ['out'], ['out']],
        hints: ['Siempre sale el elemento del <b>frente</b> (a la izquierda).'],
        explain: 'Salen en orden 5, 2 y 8. Al final, la cola queda con <code>[3]</code>.'
      },
      {
        type: 'mc', topic: 'Colas',
        q: '¿Por qué se prefiere <code>collections.deque</code> sobre una lista para implementar una cola?',
        options: [
          'Porque deque ordena los elementos automáticamente',
          'Porque popleft() es O(1), mientras que lista.pop(0) es O(n)',
          'Porque las listas no pueden almacenar números',
          'Porque deque siempre ocupa menos memoria'
        ],
        answer: 1,
        hints: ['¿Qué le pasa a los demás elementos de una lista cuando eliminas el primero?'],
        explain: '<code>lista.pop(0)</code> desplaza todos los elementos una posición (O(n)); <code>deque.popleft()</code> es O(1).'
      },
      {
        type: 'fill', topic: 'Colas',
        q: 'Completa el método para atender (sacar) a la primera persona de la cola.',
        code: `from collections import deque

cola = deque()
cola.append("Ana")
cola.append("Luis")
atendido = cola.____()
print(atendido)   # Ana`,
        answers: ['popleft'],
        hints: ['Es <code>pop</code> + el lado por donde se retira en una cola.'],
        explain: '<code>popleft()</code> retira y retorna el elemento del frente de la cola.'
      },
      {
        type: 'mc', topic: 'Colas',
        q: '¿Qué imprime este código?',
        code: `from collections import deque

cola = deque()
for x in [1, 2, 3, 4]:
    cola.append(x)
cola.popleft()
cola.append(cola.popleft())
print(list(cola))`,
        options: ['[2, 3, 4]', '[3, 4, 2]', '[4, 2, 3]', '[3, 4]'],
        answer: 1,
        hints: ['Después del ciclo la cola es [1, 2, 3, 4].', 'La última instrucción saca el del frente y lo vuelve a poner al final.'],
        explain: '[1,2,3,4] → sale 1 → [2,3,4] → sale 2 y se encola de nuevo → [3, 4, 2].'
      },
      {
        type: 'order', topic: 'Colas',
        q: 'La cola está implementada con nodos (<code>self.frente</code> y <code>self.final</code>). Ordena el método <code>encolar</code>.',
        lines: [
          'def encolar(self, dato):',
          '    nuevo = Nodo(dato)',
          '    if self.final is None:',
          '        self.frente = nuevo',
          '    else:',
          '        self.final.siguiente = nuevo',
          '    self.final = nuevo'
        ],
        hints: ['Si la cola está vacía, el nuevo nodo también es el frente.', 'Pase lo que pase, el nuevo nodo termina siendo el final.'],
        explain: 'Si la cola está vacía, el nuevo nodo es frente y final; si no, se enlaza detrás del final actual. En ambos casos se actualiza <code>self.final</code>.'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 4 */
  {
    id: 4, icon: '🌱', title: 'Anatomía de un árbol',
    desc: 'Raíz, hojas, niveles, altura y ancestros.',
    brief: `<ul>
      <li>La <b>raíz</b> es el nodo superior; una <b>hoja</b> es un nodo sin hijos.</li>
      <li>El <b>nivel</b> de la raíz es 0; sus hijos están en el nivel 1, y así sucesivamente.</li>
      <li>La <b>altura</b> se mide en <b>aristas</b> desde la raíz hasta la hoja más profunda.</li>
      <li>En un <b>árbol binario</b> cada nodo tiene, como máximo, un hijo izquierdo y un hijo derecho.</li>
    </ul>`,
    snippet: `class NodoArbol:
    def __init__(self, valor):
        self.valor = valor
        self.izquierdo = None
        self.derecho = None`,
    exercises: [
      {
        type: 'select', topic: 'Árboles: conceptos', tree: ARBOL_A,
        q: 'Haz clic en <b>todas las hojas</b> del árbol y luego presiona Comprobar.',
        answer: [1, 4, 7, 13],
        hints: ['Una hoja es un nodo que no tiene hijos.', 'Hay cuatro hojas.'],
        explain: 'Las hojas son 1, 4, 7 y 13: ninguno tiene hijo izquierdo ni derecho.'
      },
      {
        type: 'mc', topic: 'Árboles: conceptos', tree: ARBOL_A,
        q: '¿Cuál es la <b>altura</b> de este árbol (en aristas)?',
        options: ['2', '3', '4', '9'],
        answer: 1,
        hints: ['Cuenta las líneas (aristas), no los nodos, desde la raíz hasta la hoja más lejana.'],
        explain: 'El camino más largo es 8 → 3 → 6 → 4 (o 8 → 10 → 14 → 13): 3 aristas.'
      },
      {
        type: 'select', topic: 'Árboles: conceptos', tree: ARBOL_A,
        q: 'Selecciona <b>todos los ancestros</b> del nodo <b>13</b>.',
        answer: [14, 10, 8],
        hints: ['Sube desde 13 hasta llegar a la raíz.', 'El nodo 13 no es ancestro de sí mismo.'],
        explain: 'Subiendo desde 13: 14, luego 10, luego 8 (la raíz).'
      },
      {
        type: 'fill', topic: 'Árboles: conceptos',
        q: 'Completa la clase del nodo de un árbol binario.',
        code: `class NodoArbol:
    def __init__(self, valor):
        self.valor = valor
        self.izquierdo = None
        self.____ = None`,
        answers: ['derecho'],
        hints: ['Si hay un hijo izquierdo, ¿cuál es el otro?'],
        explain: 'Cada nodo de un árbol binario tiene referencia a su hijo <code>izquierdo</code> y a su hijo <code>derecho</code>.'
      },
      {
        type: 'select', topic: 'Árboles: conceptos', tree: ARBOL_A,
        q: 'Selecciona todos los nodos del <b>subárbol izquierdo</b> de la raíz.',
        answer: [3, 1, 6, 4, 7],
        hints: ['El subárbol izquierdo empieza en el hijo izquierdo de 8 e incluye a todos sus descendientes.'],
        explain: 'El subárbol izquierdo tiene raíz en 3 e incluye 1, 6, 4 y 7.'
      },
      {
        type: 'mc', topic: 'Árboles: conceptos',
        q: 'Un árbol binario de altura 3 (en aristas), ¿cuántos nodos puede tener <b>como máximo</b>?',
        options: ['8', '9', '15', '16'],
        answer: 2,
        hints: ['El nivel 0 tiene 1 nodo, el nivel 1 tiene 2, el nivel 2 tiene 4…', 'Suma los niveles 0, 1, 2 y 3.'],
        explain: '1 + 2 + 4 + 8 = 15. En general: 2<sup>h+1</sup> − 1.'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 5 */
  {
    id: 5, icon: '🧭', title: 'Recorridos',
    desc: 'Preorden, inorden, postorden y por niveles.',
    brief: `<ul>
      <li><b>Preorden</b>: Raíz → Izquierdo → Derecho.</li>
      <li><b>Inorden</b>: Izquierdo → Raíz → Derecho.</li>
      <li><b>Postorden</b>: Izquierdo → Derecho → Raíz.</li>
      <li><b>Por niveles</b> (BFS): de arriba hacia abajo y de izquierda a derecha, usando una cola.</li>
    </ul>`,
    snippet: `def preorden(nodo):
    if nodo is None:
        return
    print(nodo.valor)        # Raíz
    preorden(nodo.izquierdo)  # Izquierdo
    preorden(nodo.derecho)    # Derecho`,
    exercises: [
      {
        type: 'traverse', topic: 'Recorridos', tree: ARBOL_B, order: 'pre',
        q: 'Haz clic en los nodos en el orden del recorrido <b>preorden</b>.',
        hints: ['Preorden = Raíz → Izquierdo → Derecho. Empieza por la raíz.', 'Termina todo el subárbol izquierdo (B y sus descendientes) antes de pasar a G.'],
        explain: 'En preorden se visita el nodo apenas se llega a él y luego se baja por la izquierda.'
      },
      {
        type: 'traverse', topic: 'Recorridos', tree: ARBOL_B, order: 'in',
        q: 'Haz clic en los nodos en el orden del recorrido <b>inorden</b>.',
        hints: ['Inorden = Izquierdo → Raíz → Derecho.', 'Baja todo lo que puedas a la izquierda: el primero es la hoja de más a la izquierda.'],
        explain: 'Observa que, en este árbol, inorden produce las letras en orden alfabético.'
      },
      {
        type: 'traverse', topic: 'Recorridos', tree: ARBOL_A, order: 'post',
        q: 'Haz clic en los nodos en el orden del recorrido <b>postorden</b>.',
        hints: ['Postorden = Izquierdo → Derecho → Raíz. La raíz es SIEMPRE la última.', 'Un nodo solo se visita cuando sus dos subárboles ya fueron visitados.'],
        explain: 'Postorden visita primero a los hijos y al final al padre; por eso sirve, por ejemplo, para liberar o eliminar un árbol.'
      },
      {
        type: 'traverse', topic: 'Recorridos', tree: ARBOL_B, order: 'level',
        q: 'Haz clic en los nodos en el orden del recorrido <b>por niveles</b> (BFS).',
        hints: ['Lee el árbol como un libro: renglón por renglón, de izquierda a derecha.'],
        explain: 'El recorrido por niveles usa una cola: se saca un nodo y se encolan sus hijos.'
      },
      {
        type: 'order', topic: 'Recorridos',
        q: 'Ordena los bloques para implementar el recorrido <b>inorden</b> recursivo.',
        lines: [
          'def inorden(nodo):',
          '    if nodo is None:',
          '        return',
          '    inorden(nodo.izquierdo)',
          '    print(nodo.valor)',
          '    inorden(nodo.derecho)'
        ],
        hints: ['Toda función recursiva empieza por su caso base.', 'Inorden: Izquierdo → Raíz → Derecho.'],
        explain: 'Caso base (<code>None</code>), luego subárbol izquierdo, después la raíz y por último el subárbol derecho.'
      },
      {
        type: 'mc', topic: 'Recorridos',
        q: '¿Qué recorrido de un <b>árbol binario de búsqueda</b> devuelve los valores ordenados de menor a mayor?',
        options: ['Preorden', 'Inorden', 'Postorden', 'Por niveles'],
        answer: 1,
        hints: ['En un BST, los menores están a la izquierda y los mayores a la derecha.'],
        explain: 'Inorden visita Izquierdo (menores) → Raíz → Derecho (mayores): el resultado queda ordenado.'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 6 */
  {
    id: 6, icon: '🔎', title: 'Árbol binario de búsqueda',
    desc: 'Insertar y buscar comparando desde la raíz.',
    brief: `<ul>
      <li>En un <b>BST</b>, todo valor del subárbol izquierdo es <b>menor</b> que el nodo y todo valor del derecho es <b>mayor</b>.</li>
      <li>Para insertar o buscar: compara desde la raíz; si es menor, ve a la izquierda; si es mayor, a la derecha.</li>
      <li>Balanceado: búsqueda O(log n). Degenerado (como una lista): O(n).</li>
    </ul>`,
    snippet: `def buscar(nodo, valor):
    while nodo is not None:
        if valor == nodo.valor:
            return True
        nodo = nodo.izquierdo if valor < nodo.valor else nodo.derecho
    return False`,
    exercises: [
      {
        type: 'bstbuild', topic: 'BST',
        q: 'Inserta los valores en el BST, uno por uno, haciendo clic en el espacio <b>+</b> correcto.',
        start: [50], values: [30, 70, 20, 40, 60, 80],
        hints: ['Compara con la raíz: si el valor es menor, ve a la izquierda; si es mayor, a la derecha.', 'Repite la comparación en cada nodo hasta encontrar un espacio vacío.'],
        explain: 'Con este orden de inserción el árbol queda perfectamente balanceado.'
      },
      {
        type: 'bstbuild', topic: 'BST',
        q: 'Ahora un reto más profundo. Inserta los valores en orden.',
        start: [15], values: [9, 23, 12, 3, 20, 11, 30, 10],
        hints: ['El 12: es menor que 15, pero mayor que 9.', 'El 10 baja cuatro niveles: 15 → 9 → 12 → 11.'],
        explain: 'Cada inserción recorre un único camino desde la raíz: su costo es proporcional a la altura del árbol.'
      },
      {
        type: 'mc', topic: 'BST', tree: ARBOL_BST,
        q: 'En este BST, ¿cuántos nodos debes <b>comparar</b> para encontrar el 60?',
        options: ['2', '3', '4', '7'],
        answer: 1,
        hints: ['Empieza en la raíz y cuenta cada nodo que visitas, incluido el 60.'],
        explain: 'Se compara con 50 (ir a la derecha), con 70 (ir a la izquierda) y con 60 (encontrado): 3 comparaciones.'
      },
      {
        type: 'fill', topic: 'BST',
        q: 'Completa la función que retorna el <b>valor mínimo</b> de un BST.',
        code: `def minimo(nodo):
    while nodo.izquierdo is not None:
        nodo = nodo.____
    return nodo.valor`,
        answers: ['izquierdo'],
        hints: ['¿Hacia qué lado están los valores menores?'],
        explain: 'El mínimo es el nodo de más a la izquierda: se avanza por <code>izquierdo</code> hasta que no haya más.'
      },
      {
        type: 'order', topic: 'BST',
        q: 'Ordena la función recursiva que <b>inserta</b> un valor en un BST y retorna la raíz.',
        lines: [
          'def insertar(nodo, valor):',
          '    if nodo is None:',
          '        return NodoArbol(valor)',
          '    if valor < nodo.valor:',
          '        nodo.izquierdo = insertar(nodo.izquierdo, valor)',
          '    else:',
          '        nodo.derecho = insertar(nodo.derecho, valor)',
          '    return nodo'
        ],
        hints: ['El caso base crea el nodo nuevo cuando se llega a un espacio vacío.', 'Al final, la función devuelve el mismo nodo para conservar los enlaces.'],
        explain: 'Si el lugar está vacío se crea el nodo; si no, se decide el lado, se inserta recursivamente y se retorna el nodo actual.'
      },
      {
        type: 'mc', topic: 'BST',
        q: 'Insertas 1, 2, 3, 4, 5 (en ese orden) en un BST vacío. ¿Qué forma toma y cuánto cuesta buscar?',
        options: [
          'Queda balanceado; búsqueda O(log n)',
          'Queda como una “cadena” inclinada a la derecha; búsqueda O(n)',
          'Queda como una cadena inclinada a la izquierda; búsqueda O(1)',
          'Queda completo; búsqueda O(n²)'
        ],
        answer: 1,
        hints: ['Cada valor nuevo es mayor que todos los anteriores.'],
        explain: 'Cada valor va siempre a la derecha: el árbol degenera en una lista y la búsqueda pasa a ser O(n).'
      }
    ]
  },

  /* ------------------------------------------------ NIVEL 7 */
  {
    id: 7, icon: '🔁', title: 'Recursión en árboles',
    desc: 'Altura, conteos, sumas y transformaciones.',
    brief: `<ul>
      <li>Casi todo algoritmo de árboles es <b>recursivo</b>: resuelve el problema en cada subárbol y combina los resultados.</li>
      <li>El <b>caso base</b> casi siempre es <code>if nodo is None</code>.</li>
      <li>Convención del juego: la altura de un árbol vacío es <b>−1</b> y la de una hoja es <b>0</b>.</li>
    </ul>`,
    snippet: `def contar(nodo):
    if nodo is None:
        return 0
    return 1 + contar(nodo.izquierdo) + contar(nodo.derecho)`,
    exercises: [
      {
        type: 'fill', topic: 'Recursión en árboles',
        q: 'Completa la función que calcula la <b>altura</b> de un árbol.',
        code: `def altura(nodo):
    if nodo is None:
        return -1
    return 1 + ____(altura(nodo.izquierdo), altura(nodo.derecho))`,
        answers: ['max'],
        hints: ['La altura depende del subárbol MÁS profundo.', 'Es una función integrada de Python que recibe dos números.'],
        explain: 'La altura es 1 más la mayor de las alturas de los dos subárboles: <code>max(...)</code>.'
      },
      {
        type: 'mc', topic: 'Recursión en árboles',
        q: '¿Qué calcula la función <code>misterio</code>?',
        code: `def misterio(nodo):
    if nodo is None:
        return 0
    if nodo.izquierdo is None and nodo.derecho is None:
        return 1
    return misterio(nodo.izquierdo) + misterio(nodo.derecho)`,
        options: ['La altura del árbol', 'El número total de nodos', 'El número de hojas', 'El valor máximo'],
        answer: 2,
        hints: ['¿En qué tipo de nodo retorna 1?'],
        explain: 'Solo retorna 1 cuando el nodo no tiene hijos (hoja) y suma los resultados de los subárboles: cuenta hojas.'
      },
      {
        type: 'mc', topic: 'Recursión en árboles', tree: ARBOL_A,
        q: 'Si <code>raiz</code> es el árbol de la figura, ¿qué imprime el código?',
        code: `def suma(nodo):
    if nodo is None:
        return 0
    return nodo.valor + suma(nodo.izquierdo) + suma(nodo.derecho)

print(suma(raiz))`,
        options: ['56', '62', '66', '8'],
        answer: 2,
        hints: ['La función suma TODOS los valores del árbol.'],
        explain: '8 + 3 + 10 + 1 + 6 + 14 + 4 + 7 + 13 = 66.'
      },
      {
        type: 'order', topic: 'Recursión en árboles',
        q: 'Ordena la función que convierte un árbol en su <b>espejo</b> (intercambia izquierdo y derecho en todos los nodos).',
        lines: [
          'def espejo(nodo):',
          '    if nodo is None:',
          '        return None',
          '    temp = nodo.izquierdo',
          '    nodo.izquierdo = espejo(nodo.derecho)',
          '    nodo.derecho = espejo(temp)',
          '    return nodo'
        ],
        hints: ['Necesitas guardar uno de los hijos antes de sobrescribirlo.', '<code>temp</code> guarda el hijo izquierdo original.'],
        explain: 'Se guarda el izquierdo en <code>temp</code>, el izquierdo pasa a ser el espejo del derecho y el derecho, el espejo de <code>temp</code>.'
      },
      {
        type: 'select', topic: 'Recursión en árboles', tree: ARBOL_A,
        q: 'Selecciona todos los nodos que están en el <b>nivel 2</b> (la raíz está en el nivel 0).',
        answer: [1, 6, 14],
        hints: ['Nivel 0: 8. Nivel 1: sus hijos. Nivel 2: los nietos de 8.'],
        explain: 'Nivel 1: 3 y 10. Nivel 2: 1, 6 y 14.'
      },
      {
        type: 'mc', topic: 'Recursión en árboles',
        q: '¿Qué ocurre si eliminas la línea <code>if nodo is None: return 0</code> de la función <code>suma</code>?',
        options: [
          'Funciona igual, pero más lento',
          'Retorna 0 siempre',
          'Falla con AttributeError al intentar leer <code>None.valor</code>',
          'Entra en un ciclo infinito sin error'
        ],
        answer: 2,
        hints: ['Tarde o temprano la recursión llega a un hijo que no existe.'],
        explain: 'Sin caso base, la recursión llega a <code>None</code> e intenta acceder a <code>None.valor</code>: AttributeError.'
      },
      {
        type: 'mc', topic: 'Recursión en árboles',
        q: '¿Cuál es la complejidad temporal de un recorrido (preorden, inorden o postorden) sobre un árbol de n nodos?',
        options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
        answer: 1,
        hints: ['¿Cuántas veces se visita cada nodo?'],
        explain: 'Cada nodo se visita exactamente una vez: O(n).'
      }
    ]
  }
];

/* =========================================================
   EVALUACIÓN FINAL — nivel difícil, sin pistas, una oportunidad
   ========================================================= */
const EXAM = {
  title: 'Evaluación final',
  minutes: 20,
  passGrade: 3.0,
  questions: [
    {
      type: 'traverse', topic: 'Recorridos', tree: ARBOL_C, order: 'post',
      q: 'Haz clic en los nodos en el orden del recorrido <b>postorden</b>.',
      explain: 'Postorden: Izquierdo → Derecho → Raíz.'
    },
    {
      type: 'bstbuild', topic: 'BST',
      q: 'Inserta todos los valores, en orden, en el BST.',
      start: [40], values: [20, 60, 10, 30, 50, 70, 25, 35, 55, 65],
      explain: 'Cada valor se compara desde la raíz: menor a la izquierda, mayor a la derecha.'
    },
    {
      type: 'mc', topic: 'Recorridos',
      q: 'Un árbol binario tiene <b>preorden</b> 7 3 1 5 9 8 10 e <b>inorden</b> 1 3 5 7 8 9 10. ¿Cuál es su <b>postorden</b>?',
      options: ['1 5 3 8 10 9 7', '1 3 5 8 9 10 7', '7 3 1 5 9 8 10', '1 5 3 10 8 9 7'],
      answer: 0,
      explain: 'El preorden indica que 7 es la raíz; el inorden separa {1,3,5} a la izquierda y {8,9,10} a la derecha. Reconstruido el árbol, el postorden es 1 5 3 8 10 9 7.'
    },
    {
      type: 'mc', topic: 'BST', tree: ARBOL_C,
      q: 'En este BST eliminas la raíz (25) reemplazándola por su <b>sucesor inorden</b>. ¿Qué valor queda en la raíz?',
      options: ['22', '35', '44', '50'],
      answer: 1,
      explain: 'El sucesor inorden es el mínimo del subárbol derecho: 50 → 35 (35 no tiene hijo izquierdo).'
    },
    {
      type: 'fill', topic: 'BST',
      q: 'Completa la función que verifica si un árbol es un <b>BST válido</b> usando límites.',
      code: `def es_bst(nodo, minimo=float('-inf'), maximo=float('inf')):
    if nodo is None:
        return True
    if not (minimo < nodo.valor < maximo):
        return False
    return (es_bst(nodo.izquierdo, minimo, nodo.valor) and
            es_bst(nodo.derecho, ____, maximo))`,
      answers: ['nodo.valor'],
      explain: 'Todo el subárbol derecho debe ser mayor que el nodo actual: su límite inferior pasa a ser <code>nodo.valor</code>.'
    },
    {
      type: 'mc', topic: 'Pilas + árboles',
      q: 'En este preorden iterativo, ¿por qué se apila primero el hijo <b>derecho</b> y después el <b>izquierdo</b>?',
      code: `def preorden_iterativo(raiz):
    pila, resultado = [raiz], []
    while pila:
        nodo = pila.pop()
        resultado.append(nodo.valor)
        if nodo.derecho:
            pila.append(nodo.derecho)
        if nodo.izquierdo:
            pila.append(nodo.izquierdo)
    return resultado`,
      options: [
        'Para ahorrar memoria',
        'Porque la pila es LIFO: el izquierdo, apilado al final, sale primero y se procesa antes',
        'Para obtener el recorrido postorden',
        'Es indiferente: el resultado sería el mismo en cualquier orden'
      ],
      answer: 1,
      explain: 'Preorden exige procesar el izquierdo antes que el derecho. Como la pila es LIFO, el izquierdo debe apilarse de último.'
    },
    {
      type: 'order', topic: 'Colas + árboles',
      q: 'Ordena el recorrido <b>por niveles</b> (BFS) usando una <code>deque</code>.',
      lines: [
        'def por_niveles(raiz):',
        '    cola = deque([raiz])',
        '    while cola:',
        '        nodo = cola.popleft()',
        '        print(nodo.valor)',
        '        if nodo.izquierdo:',
        '            cola.append(nodo.izquierdo)',
        '        if nodo.derecho:',
        '            cola.append(nodo.derecho)'
      ],
      alts: [[0, 1, 2, 3, 5, 6, 7, 8, 4], [0, 1, 2, 3, 5, 6, 4, 7, 8]],
      explain: 'Se saca el nodo del frente, se procesa y se encolan sus hijos (primero el izquierdo).'
    },
    {
      type: 'mc', topic: 'Árboles: conceptos',
      q: '¿Cuál es la <b>altura mínima</b> (en aristas) de un árbol binario con 100 nodos?',
      options: ['5', '6', '7', '50'],
      answer: 1,
      explain: 'Con altura 5 caben máximo 2⁶ − 1 = 63 nodos; con altura 6 caben 127. La mínima posible es 6.'
    },
    {
      type: 'select', topic: 'Árboles: conceptos', tree: ARBOL_C,
      q: 'Selecciona todos los nodos que tienen <b>exactamente un hijo</b>.',
      answer: [10, 22, 35],
      explain: '10 solo tiene a 4; 22 solo tiene a 18; 35 solo tiene a 44.'
    },
    {
      type: 'mc', topic: 'Recursión en árboles', tree: ARBOL_C,
      q: 'Si <code>raiz</code> es el árbol de la figura, ¿qué imprime el código?',
      code: `def f(nodo, k):
    if nodo is None:
        return 0
    if k == 0:
        return 1
    return f(nodo.izquierdo, k - 1) + f(nodo.derecho, k - 1)

print(f(raiz, 2))`,
      options: ['2', '3', '4', '7'],
      answer: 2,
      explain: '<code>f</code> cuenta los nodos del nivel k. En el nivel 2 están 10, 22, 35 y 70: 4 nodos.'
    },
    {
      type: 'fill', topic: 'BST',
      q: 'Completa la función que halla el <b>ancestro común más bajo</b> (LCA) de dos valores en un BST.',
      code: `def ancestro_comun(nodo, a, b):
    if a < nodo.valor and b < nodo.valor:
        return ancestro_comun(nodo.izquierdo, a, b)
    if a > nodo.valor and b > nodo.valor:
        return ancestro_comun(nodo.____, a, b)
    return nodo`,
      answers: ['derecho'],
      explain: 'Si ambos valores son mayores que el nodo, el LCA está en el subárbol derecho.'
    },
    {
      type: 'select', topic: 'BST', tree: ARBOL_C,
      q: 'Selecciona el <b>ancestro común más bajo</b> (LCA) de los nodos 4 y 18.',
      answer: [15],
      explain: '4 y 18 son menores que 25, pero en 15 se separan (4 a la izquierda, 18 a la derecha): el LCA es 15.'
    }
  ]
};
