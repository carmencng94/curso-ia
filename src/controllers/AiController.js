// src/controllers/AiController.js
const VectorModel = require("../models/VectorModel");
const { PromptTemplate } = require("@langchain/core/prompts");

class AiController {
    constructor() {
        this.modelo = new VectorModel();
    }

    // Función que protege la privacidad (anonimización)
    anonimizar(texto) {
        // Quita correos electrónicos
        const patronEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        
        // Quita DNI español (8 números + 1 letra)
        const patronDni = /\b\d{8}[A-Za-z]\b/g;

        return texto
            .replace(patronEmail, "[CORREO_CONFIDENCIAL]")
            .replace(patronDni, "[DNI_OCULTO]");
    }

    async procesarYGuardar(id, contenidoBruto) {
        // 1. Limpiar datos sensibles
        const textoLimpio = this.anonimizar(contenidoBruto);

        // 2. Guardar en ChromaDB usando el Modelo
        const resultado = await this.modelo.guardarTexto(
            id,
            textoLimpio,
            { 
                fecha: new Date().toISOString(),
                origen: "api"
            }
        );

        return {
            mensaje: "Documento procesado correctamente",
            estado: "guardado",
            textoOriginal: contenidoBruto.length + " caracteres",
            textoLimpio: textoLimpio.length + " caracteres",
            id: id
        };
    }
}

module.exports = AiController;