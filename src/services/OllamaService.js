// src/services/OllamaService.js
const { Ollama } = require("ollama");

class OllamaService {
    constructor() {
        this.modelo = "gemma2:2b";   // Modelo ligero y bueno
        this.client = new Ollama({ host: "http://127.0.0.1:11434" });
    }

    // Funcion principal para hacer preguntas usando tus documentos
    async generarRespuesta(pregunta, contextoDocumentos) {
        try {
            const prompt = `
Eres un asistente util, claro y profesional.

Usa SOLO la informacion de los documentos siguientes para responder.
Si no tienes informacion suficiente, di "No tengo suficiente informacion".

Documentos recuperados:
${contextoDocumentos}

Pregunta del usuario: ${pregunta}

Respuesta clara y bien estructurada:
`;

            const respuesta = await this.client.generate({
                model: this.modelo,
                prompt: prompt,
                stream: false
            });

            return respuesta.response;

        } catch (error) {
            console.error("Error con Ollama:", error.message);
            return "Lo siento, hubo un error al conectar con la IA local.";
        }
    }
}

module.exports = OllamaService;
