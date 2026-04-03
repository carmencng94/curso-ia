// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const { PromptTemplate } = require("@langchain/core/prompts");

class AiController {
    constructor() {
        this.modelo = new VectorModel();
    }

    anonimizar(texto) {
        const patronEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const patronDni   = /\b\d{8}[A-Za-z]\b/g;

        return texto
            .replace(patronEmail, "[CORREO_CONFIDENCIAL]")
            .replace(patronDni, "[DNI_OCULTO]");
    }

    async procesarYGuardar(id, contenidoBruto) {
        const textoLimpio = this.anonimizar(contenidoBruto);

        await this.modelo.guardarTexto(id, textoLimpio, {
            fecha: new Date().toISOString(),
            origen: "api"
        });

        return {
            mensaje: "Documento procesado y guardado correctamente",
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

Documentos recuperados:
{context}

Pregunta del usuario: {pregunta}

Respuesta:`,
            inputVariables: ["context", "pregunta"]
        });

        const contexto = documentos.join("\n\n");

        const promptFinal = await plantilla.format({
            context: contexto,
            pregunta: pregunta
        });

        return {
            pregunta: pregunta,
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