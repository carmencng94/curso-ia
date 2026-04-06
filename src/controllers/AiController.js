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

    async consultar(pregunta) {
        const resultados = await this.modelo.buscarSimilar(pregunta, 4);
        const documentos = resultados.documents[0] || [];

        const plantilla = new PromptTemplate({
            template: `
Eres un asistente profesional, claro y preciso.
Responde usando solo la información proporcionada.
Si no tienes suficiente información, dilo claramente.

Información recuperada:
{context}

Pregunta: {pregunta}

Respuesta clara y estructurada:`,
            inputVariables: ["context", "pregunta"]
        });

        const contexto = documentos.join("\n\n---\n\n");

        const promptFinal = await plantilla.format({
            context: contexto,
            pregunta: pregunta
        });

        return {
            pregunta: pregunta,
            documentosRecuperados: documentos.length,
            respuesta: promptFinal,   // Aquí irá la respuesta de la IA más adelante
            contextoUsado: documentos
        };
    }

    async listarDocumentos() {
        const total = await this.modelo.contarDocumentos();
        return { totalDocumentos: total };
    }
}

module.exports = AiController;