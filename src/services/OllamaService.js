// src/services/OllamaService.js
const { Ollama } = require("ollama");

class OllamaService {
    constructor() {
        // Modelo local que descargaste dentro del contenedor Ollama.
        this.modelo = "gemma2:2b";
        // Cliente apuntando al puerto expuesto por el contenedor.
        this.client = new Ollama({ host: "http://127.0.0.1:11434" });
    }

    // Genera una respuesta en lenguaje natural usando la pregunta y el contexto recuperado.
    async generarRespuesta(pregunta, contextoDocumentos) {
        try {
            // El prompt le dice al modelo qué rol tiene y qué información puede usar.
            const prompt = `
Eres un asistente util, claro y profesional.

Usa SOLO la informacion de los documentos siguientes para responder.
Si no tienes informacion suficiente, di "No tengo suficiente informacion".

Documentos recuperados:
${contextoDocumentos}

Pregunta del usuario: ${pregunta}

Respuesta clara y bien estructurada:
`;

            // generate devuelve un objeto con la respuesta textual del modelo.
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
