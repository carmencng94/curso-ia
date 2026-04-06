// src/services/OllamaService.js

class OllamaService {
    constructor() {
        this.host = "http://127.0.0.1:11434";
        // Orden de preferencia de modelos. Puedes cambiarlo con OLLAMA_MODELS en .env.
        this.modelos = (process.env.OLLAMA_MODELS || "llama3.2:3b,gemma2:2b")
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
    }

    async intentarGenerate(modelo, prompt) {
        const response = await fetch(`${this.host}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelo,
                prompt,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const respuesta = await response.json();
        return respuesta.response || "";
    }

    async intentarChat(modelo, prompt) {
        const response = await fetch(`${this.host}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelo,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const respuesta = await response.json();
        return respuesta.message?.content || "";
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
            const errores = [];

            // Intentamos cada modelo en orden. Para cada modelo probamos chat y generate.
            for (const modelo of this.modelos) {
                try {
                    const porChat = await this.intentarChat(modelo, prompt);
                    if (porChat) return porChat;
                } catch (errorChat) {
                    errores.push(`[${modelo}][chat] ${errorChat.message}`);
                }

                try {
                    const porGenerate = await this.intentarGenerate(modelo, prompt);
                    if (porGenerate) return porGenerate;
                } catch (errorGenerate) {
                    errores.push(`[${modelo}][generate] ${errorGenerate.message}`);
                }
            }

            throw new Error(errores.join(" | "));

        } catch (error) {
            console.error("Error con Ollama:", error.message);
            return "Lo siento, hubo un error al conectar con la IA local.";
        }
    }
}

module.exports = OllamaService;
