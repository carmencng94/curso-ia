// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const AnonimizadorAvanzado = require("../utils/anonimizadorAvanzado");

class AiController {
    
    constructor() {
        this.modelo = new VectorModel();
        this.anonimizador = new AnonimizadorAvanzado();   // Creamos el anonimizador
    }

    // Este método se usa cuando el usuario envía texto manual y queremos guardarlo.
    async procesarYGuardar(id, contenidoBruto) {
        
        // 1. Limpiamos el texto con el anonimizador avanzado
        const textoLimpio = this.anonimizador.anonimizar(contenidoBruto);

        console.log("✅ Texto anonimizado correctamente");

        // 2. Guardamos el texto limpio en ChromaDB
        await this.modelo.guardarTexto(id, textoLimpio, {
            fecha: new Date().toISOString(),
            origen: "api"
        });

        return {
            mensaje: "Documento guardado con privacidad",
            id: id,
            original: contenidoBruto.length + " caracteres",
            limpio: textoLimpio.length + " caracteres"
        };
    }

    // Este método guarda un PDF en partes pequeñas para poder buscarlo después.
    async procesarLibro(idLibro, rutaPDF, tituloLibro) {
        const { extraerTextoDePDF, dividirEnChunks } = require("../utils/procesarPDF");

        // Si el primer chunk ya existe, asumimos que este libro ya fue indexado.
        const yaProcesado = await this.modelo.existeDocumento(`${idLibro}_chunk_0`);
        if (yaProcesado) {
            return {
                mensaje: "Este libro ya fue procesado anteriormente",
                titulo: tituloLibro,
                chunksGuardados: 0,
                idBase: idLibro,
                yaExistia: true
            };
        }

        // 1) Leemos el PDF completo y sacamos todo su texto.
        const textoCompleto = await extraerTextoDePDF(rutaPDF);
        // 2) Lo partimos en trozos para que ChromaDB lo pueda indexar mejor.
        const chunks = dividirEnChunks(textoCompleto);

        for (let i = 0; i < chunks.length; i++) {
            const idChunk = `${idLibro}_chunk_${i}`;
            // Antes de guardar, volvemos a anonimizar por seguridad.
            const chunkAnonimizado = this.anonimizador.anonimizar(chunks[i]);

            // Cada chunk se guarda como un documento independiente.
            await this.modelo.guardarTexto(idChunk, chunkAnonimizado, {
                titulo: tituloLibro,
                tipo: "libro",
                chunk: i,
                totalChunks: chunks.length,
                fecha: new Date().toISOString(),
                origen: "pdf"
            });
        }

        return {
            mensaje: "Libro procesado correctamente",
            titulo: tituloLibro,
            chunksGuardados: chunks.length,
            idBase: idLibro,
            yaExistia: false
        };
    }

    // Solo cuenta documentos, no modifica nada en la base.
    async listarDocumentos() {
        const total = await this.modelo.contarDocumentos();
        return {
            totalDocumentos: total,
            mensaje: `Hay ${total} documentos guardados en ChromaDB`
        };
    }

    // Borra todos los chunks de un libro usando su id base.
    async eliminarLibro(idLibro) {
        const resultado = await this.modelo.eliminarLibro(idLibro);

        if (!resultado.encontrado) {
            return {
                mensaje: "No se encontró ningún libro con ese id",
                idBase: idLibro,
                eliminado: 0
            };
        }

        return {
            mensaje: "Libro eliminado correctamente",
            idBase: idLibro,
            eliminado: resultado.eliminado
        };
    }

    // Importante: este método SOLO consulta. No guarda ni duplica documentos.
    async consultar(pregunta) {

        console.log(`🔎 Buscando: "${pregunta}"`);

        // Buscamos los documentos más parecidos en ChromaDB.
        // Aquí solo leemos información; no se escribe nada en la base.
        const resultados = await this.modelo.buscarSimilar(pregunta, 4);
        const documentos = resultados.documents[0] || [];

        // Si no encuentra nada
        if (documentos.length === 0) {
            return {
                pregunta: pregunta,
                respuesta: "No encontré información relacionada con tu pregunta."
            };
        }

        // 2. Unimos los documentos encontrados
        const contexto = documentos.join("\n\n---\n\n");

        // 3. Llamamos a Ollama para generar una respuesta bonita
        const ollamaService = new (require("../services/OllamaService"))();
        const respuestaIA = await ollamaService.generarRespuesta(pregunta, contexto);

        return {
            pregunta: pregunta,
            respuesta: respuestaIA,
            documentosUsados: documentos.length
        };
    }
}

module.exports = AiController;