# curso-ia

Proyecto Node.js con ChromaDB y Ollama para cargar documentos, procesar PDF/DOCX y hacer preguntas sobre su contenido.

## Qué hace

- Guarda textos manuales en una base vectorial.
- Procesa documentos grandes (PDF o DOCX) dividiéndolos en chunks.
- Permite hacer preguntas sobre el contenido indexado.
- Usa Ollama local con `gemma2:2b` para redactar respuestas.
- Tiene una interfaz web simple en `http://localhost:3000`.

## Requisitos

- Node.js instalado.
- Podman y `podman-compose` instalados.
- ChromaDB y Ollama levantados con `podman-compose`.

## Instalación

```powershell
npm install
```

## Configuración opcional (.env)

Puedes proteger las rutas de carga/borrado de libros con una clave.

1. Crea tu `.env` local a partir de `.env.example`.
2. Define:

```dotenv
BOOKS_API_KEY=tu-clave-secreta
```

Si no defines esta variable, el proyecto funciona en modo local sin clave.

También puedes definir el orden de modelos de Ollama para fallback automático:

```dotenv
OLLAMA_MODELS=llama3.2:3b,gemma2:2b
```

El backend intentará usar el primer modelo y, si falla, probará el siguiente.

## Arrancar los servicios

En la raíz del proyecto:

```powershell
podman-compose down
podman-compose up -d
```

Verifica que estén activos:

```powershell
podman ps
```

Opcional pero recomendado: confirmar que Ollama tiene el modelo:

```powershell
podman exec ollama_curso ollama list
```

## Arrancar la aplicación

```powershell
node src/app.js
```

Luego abre:

- Web: `http://localhost:3000`
- Estado API: `http://localhost:3000/estado`

## Procesar un libro desde la web

1. Abre `http://localhost:3000`.
2. En la sección **Procesar un documento (PDF o DOCX)** rellena:
  - `Clave opcional`: tu `BOOKS_API_KEY` (si la protección está activa)
   - `ID base`: por ejemplo `libro_001`
   - `Título`: por ejemplo `Resosense`
  - `Ruta local del archivo`: por ejemplo `C:\Users\Usuario\Desktop\archivo.pdf` o `.docx`
3. Pulsa **Procesar libro**.

Si el mismo libro ya fue indexado con el mismo `id`, el sistema no lo vuelve a guardar.

## Preguntar sobre el libro

En la misma web escribe una pregunta como:

```json
{
  "pregunta": "¿De qué trata el libro Resosense?"
}
```

También puedes probarlo en Postman con:

- `POST /consultar`
- Body JSON con el campo `pregunta`

## Uso rápido con Postman

### 1) Procesar documento (PDF o DOCX)

- Método: `POST`
- URL: `http://localhost:3000/procesar-libro`
- Header (solo si activaste clave):
  - `x-api-key: tu-clave-secreta`
- Body (raw JSON):

```json
{
  "id": "libro_001",
  "titulo": "Resosense",
  "rutaArchivo": "C:\\Users\\Usuario\\Desktop\\archivo.docx"
}
```

### 2) Hacer pregunta

- Método: `POST`
- URL: `http://localhost:3000/consultar`
- Body (raw JSON):

```json
{
  "pregunta": "¿De qué trata el libro?"
}
```

### 3) Borrar libro por ID base

- Método: `POST`
- URL: `http://localhost:3000/eliminar-libro`
- Header (solo si activaste clave):
  - `x-api-key: tu-clave-secreta`
- Body (raw JSON):

```json
{
  "id": "libro_001"
}
```

## Endpoints principales

### `POST /procesar`
Guarda un texto corto o manual.

Body:

```json
{
  "id": "doc_001",
  "texto": "Texto del documento"
}
```

### `POST /procesar-libro`
Procesa un archivo local (`.pdf` o `.docx`), lo divide en chunks y lo indexa.

Body:

```json
{
  "id": "libro_001",
  "titulo": "Resosense",
  "rutaArchivo": "C:\\Users\\Usuario\\Desktop\\archivo.pdf"
}
```

Nota: también acepta `rutaPDF` por compatibilidad, pero se recomienda `rutaArchivo`.

### `POST /consultar`
Busca contexto en ChromaDB y genera respuesta con Ollama.

Body:

```json
{
  "pregunta": "¿De qué trata el libro?"
}
```

### `POST /eliminar-libro`
Elimina todos los chunks de un libro por su `id` base.

Body:

```json
{
  "id": "libro_001"
}
```

### `GET /documentos`
Muestra cuántos documentos hay guardados en ChromaDB.

## Protección opcional para libros

Si quieres evitar que cualquiera que clone el repositorio pueda cargar o borrar libros, define una clave de entorno llamada `BOOKS_API_KEY`.

Cuando esa variable existe:

- `POST /procesar-libro` pide la cabecera `x-api-key`
- `POST /eliminar-libro` pide la cabecera `x-api-key`
- La web tiene un campo para escribir esa clave

Ejemplo en PowerShell:

```powershell
$env:BOOKS_API_KEY = "mi-clave-secreta"
node src/app.js
```

Si usas `.env`, no hace falta exportar la variable manualmente en PowerShell.

## Notas

- `public/index.html` sirve la interfaz web.
- `db_data/` guarda la persistencia de ChromaDB.
- `ollama_data/` guarda los modelos descargados en Ollama.
- Si cambias el archivo o el `id`, vuelve a procesarlo solo una vez.
