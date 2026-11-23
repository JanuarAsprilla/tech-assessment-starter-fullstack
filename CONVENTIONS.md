# Convenciones del proyecto

Reglas que sigo al escribir código en este repo. Cada una es verificable en una revisión.

## 1. Flujo de Git

**GitHub Flow**: `main` siempre queda estable y todo cambio entra por Pull Request.

| Elemento | Regla |
|----------|-------|
| Ramas | `<tipo>/<descripcion-corta>`, creadas desde `main`: `feat/accounts-domain`, `chore/project-setup` |
| Commits | [Conventional Commits](https://www.conventionalcommits.org): `<tipo>(<alcance>): <descripción en imperativo>` |
| Tipos | `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf` |
| Tamaño | Un commit = un cambio lógico. Las pruebas van junto al código que cubren |
| Qué se versiona | Solo lo esencial: código fuente, configuración, lockfiles y documentación. Ver `.gitignore` |
| Pull Request | Resumen, qué se decidió y por qué, plan de pruebas. Un PR por bloque de trabajo |
| Merge | Squash o merge después de la revisión. No se hace push directo a `main` |
| Revisión | **Antes de cada commit** se muestra el mensaje y el diff a la persona que revisa, que lo aprueba |

## 2. Mantenibilidad (SOLID y Clean Architecture)

La regla de dependencia apunta hacia adentro: `presentation → application → domain`. `infrastructure` implementa interfaces del dominio.

- **S, responsabilidad única:** un caso de uso por archivo y una clase con una sola razón de cambio.
- **O, abierto/cerrado:** una nueva forma de persistencia es una nueva implementación de `AccountRepository`, sin tocar los casos de uso.
- **L, sustitución:** toda implementación del repositorio cumple el contrato completo de la interfaz, y las mismas pruebas la validan.
- **I, segregación de interfaces:** interfaces pequeñas y enfocadas, sin "dioses".
- **D, inversión de dependencias:** los casos de uso reciben el repositorio por constructor, como abstracción. El dominio no importa nada de NestJS ni de librerías de infraestructura.
- Las reglas de negocio viven en el dominio (`AccountCode`, `Account`), nunca en controladores ni en componentes React.
- Entidades y value objects son **inmutables**: las operaciones devuelven instancias nuevas.
- Archivos de menos de 400 líneas (máximo 800) y funciones de menos de 50. Anidamiento máximo de 4 niveles, con retornos tempranos.
- Sin números mágicos: las longitudes de código y los límites son constantes con nombre.
- Nombres en el vocabulario del dominio. Código en inglés y mensajes al usuario en español.
- Errores de dominio tipados (`AccountNotFoundError`, `ParentNotFoundError`...) con un código estable que el front puede mapear a un campo.

## 3. Seguridad

- **Validar en el borde y en el dominio.** El DTO rechaza formas inválidas y el dominio protege sus invariantes aunque el borde falle.
- El código solo acepta `^\d+$`, con longitud máxima y con nombre acotado y recortado (`trim`). Se rechazan campos desconocidos (`whitelist`, `forbidNonWhitelisted`).
- Los errores no filtran detalles internos: un filtro global convierte errores de dominio en HTTP 4xx con `{ code, message, field? }`, y cualquier otro error devuelve un 500 genérico. El detalle se registra solo en el servidor.
- `helmet` y CORS restringido a `WEB_ORIGIN`. Límite de tamaño del cuerpo y limitación de tasa (`@nestjs/throttler`).
- Sin secretos en el código: configuración por variables de entorno, con `.env.example` y sin `.env` en git.
- Front: sin `dangerouslySetInnerHTML`, React escapa los datos. Los parámetros de URL se codifican con `encodeURIComponent`. El front **no confía** en sus propias validaciones: son solo ayuda para el usuario.
- Dependencias mínimas, revisadas con `npm audit` antes de entregar.

## 4. Accesibilidad (WCAG 2.2 AA)

- HTML semántico primero: `button`, `form`, `label`, `dialog`, `main`, `h1..h3`.
- **Árbol:** `role="tree"`, `treeitem`, `group`, con `aria-expanded`, `aria-level` y `aria-selected`. Navegación por teclado: flechas arriba y abajo, derecha expande, izquierda colapsa, Enter activa.
- **Formularios:** cada campo con `<label>`, `aria-invalid` y `aria-describedby` apuntando a su mensaje de error. El error de la API se muestra junto al campo que corresponde. El primer campo con error recibe el foco al enviar.
- **Mensajes dinámicos:** errores y estados de carga se anuncian con `role="alert"` o `aria-live="polite"`.
- **Confirmación de borrado:** `<dialog>` modal con foco atrapado, cierre con `Esc`, y foco devuelto al elemento que lo abrió.
- Foco siempre visible, con área táctil de al menos 24×24 px. Contraste mínimo 4.5:1 para texto. El color nunca es el único portador de significado (se acompaña de texto o ícono).
- `prefers-reduced-motion` respetado: las animaciones se reducen o se quitan.

## 5. Pruebas

- **TDD** en dominio y casos de uso: primero la prueba (rojo), luego la implementación mínima (verde), luego refactor.
- Pirámide: unitarias de dominio y casos de uso (muchas), e2e de la API (las rutas críticas), pruebas de componentes del front para el árbol y el formulario.
- Nombres descriptivos: `rechaza crear una cuenta cuando el padre no existe`. Estructura Arrange-Act-Assert.
- Objetivo de cobertura: 80 % en `domain` y `application`.

## 6. Definición de "terminado" para un bloque

- [ ] Pruebas en verde (`npm test`) y lint sin errores (`npm run lint`)
- [ ] Compila (`npm run build`)
- [ ] Cumple las secciones 2 a 4 de este documento
- [ ] Mensaje de commit y diff revisados por la persona que aprueba
- [ ] PR abierto con resumen y plan de pruebas
