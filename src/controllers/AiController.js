// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const AnonimizadorAvanzado = require("../utils/anonimizadorAvanzado");
const { PromptTemplate } = require("@langchain/core/prompts");

class AiController {
    constructor() {
        this.modelo = new VectorModel();
        this.anonimizador = new AnonimizadorAvanzado();
    }

    async procesarYGuardar(id, contenidoBruto) {
        const textoLimpio = this.anonimizador.anonimizar(contenidoBruto);

        await this.modelo.guardarTexto(id, textoLimpio, {
            fecha: new Date().toISOString(),
            origen: "api"
        });

        return {
            mensaje: "Documento procesado y guardado con privacidad",
            id: id,
            caracteresOriginales: contenidoBruto.length,
            caracteresLimpios: textoLimpio.length
        };
    }

    // Nueva versión mejorada de consultar
    async consultar(pregunta) {
        const resultados = await this.modelo.buscarSimilar(pregunta, 3);

        const documentos = resultados.documents[0] || [];

        // Prompt más profesional y claro
        const plantilla = new PromptTemplate({
            template: `
Eres un asistente profesional y seguro.
Responde de forma clara, concisa y profesional.

Información recuperada:
{context}

Pregunta: {pregunta}

Respuesta:`,
            inputVariables: ["context", "pregunta"]
        });

        const contexto = documentos.join("\n\n");

        const promptFinal = await plantilla.format({
            context: contextoFinal.join("\n\n---\n\n"),
            pregunta
        });

        return {
            pregunta,
            documentosRecuperados: documentos.length,
            contextoUsado: documentos,
            promptGenerado: promptFinal.substring(0, 300) + "...",
            mensaje: "Consulta realizada con prompt mejorado"
        };
    }

    // Nueva función: Ver todos los documentos
    async listarDocumentos() {
        const total = await this.modelo.contarDocumentos();
        return {
            totalDocumentos: total,
            mensaje: `Hay ${total} documentos guardados en ChromaDB`
        };
    }
}

module.exports = AiController;