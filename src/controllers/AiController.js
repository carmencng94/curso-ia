// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const AnonimizadorAvanzado = require("../utils/anonimizadorAvanzado");

class AiController {
    
    constructor() {
        // El controlador coordina el flujo: recibe datos, llama al modelo y devuelve respuesta.
        this.modelo = new VectorModel();
        this.anonimizador = new AnonimizadorAvanzado();   // Creamos el anonimizador
    }

    // Este método se usa cuando el usuario envía texto manual y queremos guardarlo.
    async procesarYGuardar(id, contenidoBruto) {
        
        // 1. Limpiamos el texto con el anonimizador avanzado.
        // Así evitamos guardar correos, DNI u otros datos sensibles.
        const textoLimpio = this.anonimizador.anonimizar(contenidoBruto);

        console.log("✅ Texto anonimizado correctamente");

        // 2. Guardamos el texto limpio en ChromaDB.
        // Aquí ya se crea el documento vectorial.
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
    async procesarLibro(idLibro, rutaArchivo, tituloLibro) {
        const { extraerTextoDeDocumento, dividirEnChunks } = require("../utils/procesarPDF");

        // Si el primer chunk ya existe, asumimos que este libro ya fue indexado.
        // Esto evita duplicar el mismo libro si alguien pulsa dos veces el botón.
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

        // 1) Leemos el archivo completo y sacamos todo su texto.
        // Soporta PDF y DOCX.
        const textoCompleto = await extraerTextoDeDocumento(rutaArchivo);
        // 2) Lo partimos en trozos para que ChromaDB lo pueda indexar mejor.
        // Así luego podemos recuperar solo la parte relevante cuando preguntamos.
        const chunks = dividirEnChunks(textoCompleto);

        for (let i = 0; i < chunks.length; i++) {
            const idChunk = `${idLibro}_chunk_${i}`;
            // Antes de guardar, volvemos a anonimizar por seguridad.
            // Cada trozo puede contener nombres, emails o teléfonos.
            const chunkAnonimizado = this.anonimizador.anonimizar(chunks[i]);

            // Cada chunk se guarda como un documento independiente.
            // Esto mejora la búsqueda semántica y evita guardar el PDF entero en un solo bloque.
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
    // Sirve para limpiar un libro completo antes de volver a cargarlo.
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
    // Toma la pregunta, busca fragmentos parecidos y se los pasa a Ollama para redactar respuesta.
    async consultar(pregunta, opciones = {}) {

        console.log(`🔎 Buscando: "${pregunta}"`);

        // Buscamos los documentos más parecidos en ChromaDB.
        // Aquí solo leemos información; no se escribe nada en la base.
        const resultados = await this.modelo.buscarSimilar(pregunta, 6, {
            titulo: opciones.titulo || undefined
        });
        const documentos = resultados.documents[0] || [];
        const metadatas = resultados.metadatas?.[0] || [];

        // Quitamos documentos repetidos para no sesgar la respuesta del modelo.
        const vistos = new Set();
        const documentosUnicos = [];
        const titulosUnicos = new Set();

        for (let i = 0; i < documentos.length; i++) {
            const doc = documentos[i];
            const key = (doc || "").trim();

            if (!key || vistos.has(key)) {
                continue;
            }

            vistos.add(key);
            documentosUnicos.push(doc);

            const tituloMeta = metadatas[i]?.titulo;
            if (tituloMeta) {
                titulosUnicos.add(tituloMeta);
            }
        }

        // Si no encuentra nada, respondemos sin intentar llamar al modelo.
        if (documentosUnicos.length === 0) {
            return {
                pregunta: pregunta,
                respuesta: "No encontré información relacionada con tu pregunta."
            };
        }

        // Unimos los documentos encontrados en un solo contexto legible.
        const contexto = documentosUnicos.join("\n\n---\n\n");

        // Llamamos a Ollama para generar una respuesta más natural.
        const ollamaService = new (require("../services/OllamaService"))();
        const respuestaIA = await ollamaService.generarRespuesta(pregunta, contexto);

        return {
            pregunta: pregunta,
            respuesta: respuestaIA,
            documentosUsados: documentosUnicos.length,
            fuenteTitulos: Array.from(titulosUnicos)
        };
    }
}

module.exports = AiController;