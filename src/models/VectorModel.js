// src/models/VectorModel.js
const { ChromaClient } = require("chromadb");
const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed");

class VectorModel {
    constructor() {
        this.client = new ChromaClient({ host: "localhost", port: 8000 });
        this.embeddingFunction = new DefaultEmbeddingFunction();
        this.collection = null;
    }

    async inicializar() {
        if (this.collection) return this.collection;

        this.collection = await this.client.getOrCreateCollection({
            name: "mis_documentos",
            embeddingFunction: this.embeddingFunction,
        });
        console.log("✅ Conectado a ChromaDB");
        return this.collection;
    }

    async guardarTexto(id, texto, metadatos = {}) {
        await this.inicializar();
        await this.collection.add({
            ids: [id],
            documents: [texto],
            metadatas: [metadatos]
        });
        console.log(`📄 Guardado: ${id}`);
    }

    async contarDocumentos() {
        await this.inicializar();
        const count = await this.collection.count();
        console.log(`📊 Total documentos: ${count}`);
        return count;
    }

    // NUEVO MÉTODO: Buscar documentos similares a una pregunta
    async buscarSimilar(pregunta, cantidad = 2) {
        await this.inicializar();

        const resultados = await this.collection.query({
            queryTexts: [pregunta],
            nResults: cantidad,
        });

        return resultados;
    }
}

module.exports = VectorModel;