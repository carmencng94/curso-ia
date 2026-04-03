// src/app.js - Versión corregida
const express = require("express");
const fs = require("fs");
const path = require("path");
const AiController = require("./controllers/AiController");

const app = express();
const puerto = 3000;

// Middleware para leer JSON correctamente
app.use(express.json({ limit: "10mb" }));     // Aumentamos el límite
app.use(express.urlencoded({ extended: true })); // Por si envías formularios
app.use(express.static(path.join(__dirname, "..", "public")));

const aiCtrl = new AiController();

// Ruta principal
app.post("/procesar", async (req, res) => {
    try {
        const { id, texto } = req.body;

        // Validación mejorada
        if (!id || !texto) {
            return res.status(400).json({
                error: "Faltan datos",
                mensaje: "Se requiere 'id' y 'texto' en el body JSON",
                recibido: req.body   // Esto nos ayuda a depurar
            });
        }

        console.log("📥 Recibido documento con ID:", id);

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

// Ruta principal web
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Ruta de estado de la API
app.get("/estado", (req, res) => {
    res.json({
        mensaje: "🚀 Servidor MVC de IA con ChromaDB v2 funcionando correctamente",
        instrucciones: "Envía POST a /procesar con { id, texto }",
        estadoChromaDB: "Conectado"
    });
});
// Nueva ruta para hacer consultas

// Nueva ruta: Listar todos los documentos
app.get("/documentos", async (req, res) => {
    try {
        const resultado = await aiCtrl.listarDocumentos();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta mejorada de consulta
app.post("/consultar", async (req, res) => {
    try {
        const { pregunta } = req.body;

        if (!pregunta) {
            return res.status(400).json({ error: "Debes enviar una 'pregunta'" });
        }

        const resultado = await aiCtrl.consultar(pregunta);
        res.json(resultado);
    } catch (error) {
        console.error("Error en /consultar:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/procesar-libro", async (req, res) => {
    try {
        const { id, titulo, rutaPDF } = req.body;

        if (!id || !titulo || !rutaPDF) {
            return res.status(400).json({
                error: "Faltan datos",
                mensaje: "Se requiere 'id', 'titulo' y 'rutaPDF' en el body JSON",
                recibido: req.body
            });
        }

        if (!fs.existsSync(rutaPDF)) {
            return res.status(400).json({
                error: "RutaPDF no encontrada",
                mensaje: "No existe un archivo PDF en la ruta indicada",
                rutaPDF
            });
        }

        const resultado = await aiCtrl.procesarLibro(id, rutaPDF, titulo);
        res.json(resultado);
    } catch (error) {
        console.error("Error en /procesar-libro:", error);
        res.status(500).json({ error: error.message });
    }
});
app.listen(puerto, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${puerto}`);
    console.log(`📡 Prueba POST en: http://localhost:${puerto}/procesar`);
});