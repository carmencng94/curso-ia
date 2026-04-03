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

    // Nuevo método para guardar libros o PDFs grandes
    async procesarLibro(idLibro, rutaPDF, tituloLibro) {
        const { extraerTextoDePDF, dividirEnChunks } = require("../utils/procesarPDF");

        // 1. Extraer texto del PDF
        const textoCompleto = await extraerTextoDePDF(rutaPDF);

        // 2. Dividir en chunks
        const chunks = dividirEnChunks(textoCompleto);

        console.log(`📖 Libro "${tituloLibro}" dividido en ${chunks.length} trozos`);

        // 3. Guardar cada chunk
        for (let i = 0; i < chunks.length; i++) {
            const idChunk = `${idLibro}_chunk_${i}`;
            await this.modelo.guardarTexto(idChunk, chunks[i], {
                titulo: tituloLibro,
                tipo: "libro",
                chunk: i,
                totalChunks: chunks.length
            });
        }

        return {
            mensaje: "Libro procesado correctamente",
            titulo: tituloLibro,
            chunksGuardados: chunks.length,
            idBase: idLibro
        };
    }

    tokenizarConsulta(texto) {
        const stopwords = new Set([
            "de", "la", "el", "los", "las", "un", "una", "unos", "unas",
            "y", "o", "a", "en", "con", "por", "para", "que", "del", "al",
            "se", "es", "quien", "quién", "como", "cómo", "cual", "cuál"
        ]);

        return (texto || "")
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, " ")
            .split(/\s+/)
            .filter((p) => p.length > 2 && !stopwords.has(p));
    }

    puntuarFragmento(fragmento, tokens) {
        const base = (fragmento || "").toLowerCase();
        let score = 0;

        for (const token of tokens) {
            if (base.includes(token)) {
                score += 1;
            }
        }

        return score;
    }

    extraerRespuestaDesdeFragmentos(fragmentos, tokens) {
        const oraciones = fragmentos
            .join(" ")
            .split(/(?<=[.!?])\s+/)
            .map((o) => o.trim())
            .filter((o) => o.length > 20);

        const candidatas = oraciones
            .map((o) => ({ texto: o, score: this.puntuarFragmento(o, tokens) }))
            .filter((o) => o.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((o) => o.texto);

        if (candidatas.length === 0) {
            return "No tengo información suficiente en los documentos recuperados para responder con precisión.";
        }

        return candidatas.join(" ");
    }

    async consultar(pregunta) {
        const resultados = await this.modelo.buscarSimilar(pregunta, 6);
        const documentos = resultados.documents[0] || [];

        const tokens = this.tokenizarConsulta(pregunta);

        const documentosOrdenados = documentos
            .map((doc) => ({ texto: doc, score: this.puntuarFragmento(doc, tokens) }))
            .sort((a, b) => b.score - a.score);

        const contextoTop = documentosOrdenados
            .filter((d) => d.score > 0)
            .slice(0, 3)
            .map((d) => d.texto);

        const contextoFinal = contextoTop.length > 0 ? contextoTop : documentos.slice(0, 3);
        const respuestaFinal = this.extraerRespuestaDesdeFragmentos(contextoFinal, tokens);

        const plantilla = new PromptTemplate({
            template: `
Eres un asistente experto, claro y profesional.

Usa solo la información de los documentos siguientes para responder.
Si no sabes algo, di "No tengo información suficiente".

Documentos recuperados:
{context}

Pregunta: {pregunta}

Respuesta completa y bien estructurada:`,
            inputVariables: ["context", "pregunta"]
        });

        const promptFinal = await plantilla.format({
            context: contextoFinal.join("\n\n---\n\n"),
            pregunta
        });

        return {
            pregunta,
            documentosRecuperados: documentos.length,
            respuesta: respuestaFinal,
            contextoUsado: contextoFinal,
            promptListo: promptFinal
        };
    }
}

module.exports = AiController;