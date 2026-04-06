# curso-ia

Proyecto Node.js con ChromaDB y Ollama para cargar documentos, procesar PDFs y hacer preguntas sobre su contenido.

## Qué hace

- Guarda textos manuales en una base vectorial.
- Procesa libros o PDFs grandes dividiéndolos en chunks.
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

## Arrancar la aplicación

```powershell
node src/app.js
```

Luego abre:

- Web: `http://localhost:3000`
- Estado API: `http://localhost:3000/estado`

## Procesar un libro desde la web

1. Abre `http://localhost:3000`.
2. En la sección **Procesar un PDF** rellena:
   - `ID base`: por ejemplo `libro_001`
   - `Título`: por ejemplo `Resosense`
   - `Ruta local del PDF`: por ejemplo `C:\Users\Usuario\Desktop\archivo.pdf`
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
Procesa un PDF local, lo divide en chunks y lo indexa.

Body:

```json
{
  "id": "libro_001",
  "titulo": "Resosense",
  "rutaPDF": "C:\\Users\\Usuario\\Desktop\\archivo.pdf"
}
```

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

## Notas

- `public/index.html` sirve la interfaz web.
- `db_data/` guarda la persistencia de ChromaDB.
- `ollama_data/` guarda los modelos descargados en Ollama.
- Si cambias el PDF o el `id`, vuelve a procesarlo solo una vez.
