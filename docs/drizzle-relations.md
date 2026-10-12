# Relaciones en Drizzle ORM — `src/db/schema.ts`

Documento de referencia sobre la definición de relaciones del schema, con foco en
`userRelations` (línea 79) y en cómo encaja con el resto del modelo.

Fichero analizado: `src/db/schema.ts`
Versión de la librería: `drizzle-orm@0.44.7` (Relational Queries API v0, la "clásica";
no es la API nueva `defineRelations`).

> **Estado actual del proyecto:** `src/db/` solo contiene `schema.ts`. Todavía **no existe
> una instancia de `drizzle()`** y ningún `db.query.*` en `src/routes/`, por lo que hoy
> `userRelations` no produce efecto en tiempo de ejecución. Es metadato preparado pero
> aún no conectado.

---

## El código

```ts
export const userRelations = relations(users, ({ many }) => ({
  habits: many(habits),
}))
```

---

## Desglose línea por línea

### 1. `relations(...)` — el registro de relaciones

Se importa desde `drizzle-orm` (línea 12 del schema), **no** desde
`drizzle-orm/pg-core` (de donde vienen `pgTable`, `uuid`, `varchar`, etc.).

Es una función que **recibe una tabla y devuelve un descriptor de relaciones**. No ejecuta
SQL, no toca la base de datos y no crea nada: solo construye un objeto de metadatos que
Drizzle usará después para saber cómo hacer los `JOIN` y para tipar las consultas anidadas.

### 2. Primer argumento: `users`

Es el objeto `PgTable` devuelto por `pgTable('users', ...)` (schema.ts:14). Ojo: **no es
la tabla SQL `users`**, es la representación en JS de esa tabla. Lo que se declara es
"las relaciones que tiene `users` hacia otras tablas".

### 3. Segundo argumento: el callback `({ many }) => ...`

Es una función que Drizzle invoca inmediatamente durante el import del módulo. Le pasa un
**builder** con estos helpers:

| Helper                             | Tipo de relación                     | Devuelve                        |
| ---------------------------------- | ------------------------------------ | ------------------------------- |
| `many`                             | 1 → N                                | `Relational<..., 'many'>`       |
| `one`                              | N → 1 (FK en la otra tabla)          | `Relational<..., 'one'>`        |
| `one(..., { fields, references })` | 1 → 1 con columnas distintas a la PK |                                 |
| `manyToMany`                       | N → N (tabla pivote)                 | `Relational<..., 'manyToMany'>` |

Aquí se destructura **solo** `many`, así que esta tabla únicamente puede declarar
relaciones "uno hacia muchos". Para el lado inverso (`habits → user`) haría falta `one`
en otra declaración.

### 4. La clave `habits` — nombre de la relación

El nombre de la propiedad del objeto devuelto es **arbitrario**. Es la "etiqueta" con la
que luego se pide el anidamiento:

```ts
db.query.users.findMany({ with: { habits: true } })
//                        ^^^^^^^ esta clave
```

Podría llamarse `misHabitos` o `routine` y el SQL generado sería idéntico. Solo cambia
el nombre de la propiedad en el objeto devuelto.

### 5. `many(habits)` — la relación 1 → N

Aquí está el corazón. `many()` recibe la tabla del lado "hijo" y **Drizzle deduce la FK
automáticamente** mirando las definiciones de columnas:

- `habits.userId` está declarado en schema.ts:29-31
- `uuid('user_id').references(() => users.id, { onDelete: 'cascade' })`

Como existe una única columna en `habits` que referencia `users.id` y no hay ambigüedad,
Drizzle la encuentra solo y establece la relación `users.id = habits.user_id`.

**No se escribe SQL aquí**, pero el resultado es equivalente a:

```sql
SELECT u.*, coalesce(json_agg(h.*), '[]')
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM habits h WHERE h.user_id = u.id
) h ON TRUE
GROUP BY u.id
```

Si la FK estuviera en `users` en lugar de en `habits`, o si hubiera **dos** columnas que
referencian `users.id`, esta llamada sin configuración adicional fallaría y habría que
usar `one(users, { fields: [...], references: [...] })`.

### 6. ¿Por qué `export const`?

Crítico y no obvio: Drizzle **descubre las relaciones por los exports del módulo**, no por
el contenido. Cuando alguien haga:

```ts
import * as schema from './db/schema.js'
const db = drizzle(pool, { schema })
```

Drizzle recorre `Object.values(schema)` y separa tablas de relaciones **por el nombre de
la variable** (`users`, `habits`, `habitsTags`… son tablas; `userRelations` es relación).

Si se escribiera `const userRelations = ...` sin `export`, la relación sería invisible y
`with: { habits: true }` fallaría con:

```
Relation "users.habits" not found
```

De ahí la convención de nombres `xxxRelations` / `yyyRelations`.

---

## Modelo de datos del schema

```
users ──1:N──> habits ──1:N──> entries
  │                │
  │                └──N:M──> tags   (vía habitsTags)
  └──1:N──> tags
```

| Tabla        | PK                                   | FKs                                                      |
| ------------ | ------------------------------------ | -------------------------------------------------------- |
| `users`      | `id`                                 | —                                                        |
| `habits`     | `id`                                 | `user_id` → `users.id` (cascade)                         |
| `entries`    | `id`                                 | `habit_id` → `habits.id` (cascade)                       |
| `tags`       | `id`                                 | `user_id` → `users.id` (cascade)                         |
| `habitsTags` | — (PK compuesta `habit_id`+`tag_id`) | `habit_id` → `habits.id`, `tag_id` → `tags.id` (cascade) |

---

## Lo que falta

Solo `users` tiene relaciones. Para consultas anidadas completas faltan las demás:

```ts
export const habitRelations = relations(
  habits,
  ({ one, many, manyToMany }) => ({
    user: one(users, { fields: [habits.userId], references: [users.id] }),
    entries: many(entries),
    tags: manyToMany(tags, { fields: [habits.id], references: [tags.id] }),
  }),
)

export const tagRelations = relations(tags, ({ many, manyToMany }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  habits: manyToMany(habits, { fields: [tags.id], references: [habits.id] }),
}))

export const entryRelations = relations(entries, ({ one }) => ({
  habit: one(habits, { fields: [entries.habitId], references: [habits.id] }),
}))
```

Notas de diseño relevantes para este esquema:

- **`one(users, { fields, references })`**: permite declarar el lado inverso de forma
  explícita. Si solo se declara el lado `many`, Drizzle puede deducir el inverso, pero
  declararlo hace la intención inequívoca y el tipado más estable.
- **`habitsTags` no necesita `relations()`**: es una tabla pivote pura. `manyToMany` la
  encuentra automáticamente por sus FKs. Sí exige un `relationName` distinto por cada
  camino si existe más de una ruta entre las mismas dos tablas; aquí `tags` ↔ `habits` solo
  tiene una, así que no es obligatorio.
- **Relaciones ≠ integridad referencial**: el `onDelete: 'cascade'` de las `.references()`
  es lo que garantiza el borrado en cascada en la base de datos. Las `relations()` no
  afectan al comportamiento de la BD, solo a cómo Drizzle genera los `SELECT`.
- **Nombres de propiedades ≠ nombres de tablas**: en el `with:` se usan los nombres del
  objeto devuelto por `relations()`, no los nombres SQL.

---

## Uso previsto (aún no implementado)

```ts
// src/db/index.ts  — pendiente de crear
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

```ts
// Consulta anidada 1 → N
const result = await db.query.users.findMany({
  where: eq(users.email, 'miguel@example.com'),
  with: { habits: true },
})
// result[0].habits -> Habit[]

// Envolver en una sola query
const userWithHabitsAndTags = await db.query.habits.findMany({
  with: {
    user: true,
    entries: true,
    tags: true,
  },
})
```

---

## Referencias

- Documentación oficial: https://orm.drizzle.team/docs/relations
- Definiciones de columnas: `src/db/schema.ts:14-77`
- Relaciones: `src/db/schema.ts:79-81`
