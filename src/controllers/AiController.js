// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const AnonimizadorAvanzado = require("../utils/anonimizadorAvanzado");
const { PromptTemplate } = require("@langchain/core/prompts");

class AiController {
    
    constructor() {
        this.modelo = new VectorModel();
        this.anonimizador = new AnonimizadorAvanzado();   // Creamos el anonimizador
    }

    // Esta función limpia los datos sensibles
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

    // Función mejorada para hacer preguntas
    async consultar(pregunta) {

        console.log(`🔎 Buscando información sobre: "${pregunta}"`);

        // Buscamos los documentos más parecidos en ChromaDB
        const resultados = await this.modelo.buscarSimilar(pregunta, 4);
        const documentos = resultados.documents[0] || [];

        // Si no encuentra nada
        if (documentos.length === 0) {
            return {
                pregunta: pregunta,
                respuesta: "Lo siento, no encontré información relacionada con tu pregunta.",
                documentosEncontrados: 0
            };
        }

        // Unimos los documentos encontrados para que sea más fácil de leer
        const contexto = documentos.join("\n\n---\n\n");

        return {
            pregunta: pregunta,
            respuesta: "Aquí tienes la información encontrada:",
            documentosEncontrados: documentos.length,
            informacionRecuperada: documentos,   // Los trozos originales
            contextoCompleto: contexto           // Todo junto
        };
    }
}

module.exports = AiController;