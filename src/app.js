// src/app.js - Versión corregida
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const AiController = require("./controllers/AiController");

const app = express();
const puerto = 3000;
const booksApiKey = process.env.BOOKS_API_KEY || "";

// Middleware base:
// - Lee JSON en el body de las peticiones.
// - Permite enviar formularios HTML si alguna vez los necesitas.
// - Sirve los archivos estáticos del frontend desde la carpeta public.
app.use(express.json({ limit: "10mb" }));     // Aumentamos el límite
app.use(express.urlencoded({ extended: true })); // Por si envías formularios
app.use(express.static(path.join(__dirname, "..", "public")));

// Si defines BOOKS_API_KEY, estas rutas pedirán x-api-key.
// Si no la defines, el proyecto sigue funcionando en local como hasta ahora.
function validarClaveLibros(req, res, next) {
    if (!booksApiKey) {
        return next();
    }

    const apiKey = req.get("x-api-key");

    if (apiKey !== booksApiKey) {
        return res.status(401).json({
            error: "No autorizado",
            mensaje: "Falta o es incorrecta la clave para cargar o borrar libros"
        });
    }

    next();
}

const aiCtrl = new AiController();

// Endpoint para guardar texto corto/manual en la base vectorial.
// Este endpoint guarda 1 solo documento y lo deja listo para búsquedas futuras.
app.post("/procesar", async (req, res) => {
    try {
        const { id, texto } = req.body;

        // Comprobamos que lleguen los dos campos mínimos necesarios.
        if (!id || !texto) {
            return res.status(400).json({
                error: "Faltan datos",
                mensaje: "Se requiere 'id' y 'texto' en el body JSON",
                recibido: req.body   // Esto nos ayuda a depurar
            });
        }

        console.log("📥 Recibido documento con ID:", id);

        // El controlador limpia el texto sensible y luego lo guarda.
        const resultado = await aiCtrl.procesarYGuardar(id, texto);

        res.status(200).json(resultado);

    } catch (error) {
        console.error("❌ Error en /procesar:", error.message);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: error.message
        });
    }
});

// Página principal del frontend.
// Aquí se carga el HTML que permite procesar PDFs y hacer preguntas.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Ruta de estado de la API.
// Sirve para comprobar rápido si el servidor está vivo.
app.get("/estado", (req, res) => {
    res.json({
        mensaje: "🚀 Servidor MVC de IA con ChromaDB v2 funcionando correctamente",
        instrucciones: "Envía POST a /procesar con { id, texto }",
        estadoChromaDB: "Conectado"
    });
});
// Nueva ruta para hacer consultas

// Endpoint de consulta rápida para saber cuántos documentos hay indexados.
// No modifica la base: solo devuelve un contador.
app.get("/documentos", async (req, res) => {
    try {
        const resultado = await aiCtrl.listarDocumentos();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de preguntas sobre el contenido ya almacenado en ChromaDB.
// Aquí solo se consulta, no se vuelve a guardar nada.
app.post("/consultar", async (req, res) => {
    try {
        const { pregunta, titulo } = req.body;

        if (!pregunta) {
            return res.status(400).json({ error: "Debes enviar una 'pregunta'" });
        }

        const resultado = await aiCtrl.consultar(pregunta, { titulo });
        res.json(resultado);
    } catch (error) {
        console.error("Error en /consultar:", error);
        res.status(500).json({ error: error.message });
    }
});
// Procesa un PDF local: lo parte en chunks y los guarda en ChromaDB.
// Si BOOKS_API_KEY está definida, exige la cabecera x-api-key.
app.post("/procesar-libro", validarClaveLibros, async (req, res) => {
    try {
        const { id, titulo, rutaArchivo, rutaPDF } = req.body;
        const rutaDocumento = rutaArchivo || rutaPDF;
        const idNormalizado = String(id || "").trim().toLowerCase();

        // Validamos que el usuario haya enviado todos los datos obligatorios.
        if (!idNormalizado || !titulo || !rutaDocumento) {
            return res.status(400).json({
                error: "Faltan datos",
                mensaje: "Se requiere 'id', 'titulo' y 'rutaArchivo' (o 'rutaPDF') en el body JSON",
                recibido: req.body
            });
        }

        const extension = path.extname(rutaDocumento).toLowerCase();

        if (![".pdf", ".docx"].includes(extension)) {
            return res.status(400).json({
                error: "Formato no soportado",
                mensaje: "Solo se permiten archivos .pdf o .docx",
                extension
            });
        }

        // El backend debe poder leer el archivo en disco; si la ruta no existe, paramos aquí.
        if (!fs.existsSync(rutaDocumento)) {
            return res.status(400).json({
                error: "RutaArchivo no encontrada",
                mensaje: "No existe un archivo en la ruta indicada",
                rutaArchivo: rutaDocumento
            });
        }

        // El controlador se encarga de extraer el texto, dividirlo y guardarlo.
        const resultado = await aiCtrl.procesarLibro(idNormalizado, rutaDocumento, titulo);
        res.json(resultado);
    } catch (error) {
        console.error("Error en /procesar-libro:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para borrar todos los chunks de un libro por su id base.
// Útil si quieres rehacer el proceso sin dejar restos duplicados.
app.post("/eliminar-libro", validarClaveLibros, async (req, res) => {
    try {
        const { id } = req.body;
        const idNormalizado = String(id || "").trim().toLowerCase();

        if (!idNormalizado) {
            return res.status(400).json({
                error: "Faltan datos",
                mensaje: "Se requiere 'id' en el body JSON"
            });
        }

        const resultado = await aiCtrl.eliminarLibro(idNormalizado);
        res.json(resultado);
    } catch (error) {
        console.error("Error en /eliminar-libro:", error);
        res.status(500).json({ error: error.message });
    }
});
app.listen(puerto, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${puerto}`);
    console.log(`📡 Prueba POST en: http://localhost:${puerto}/procesar`);
});