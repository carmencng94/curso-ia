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
        // Este es el único punto donde el proyecto escribe documentos en ChromaDB.
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
        // Esta consulta solo lee datos ya guardados; no crea documentos nuevos.
        await this.inicializar();

        const resultados = await this.collection.query({
            queryTexts: [pregunta],
            nResults: cantidad,
        });

        return resultados;
    }

    async existeDocumento(id) {
        await this.inicializar();

        const resultado = await this.collection.get({ ids: [id] });
        return (resultado.ids || []).length > 0;
    }

    async eliminarLibro(idLibro) {
        await this.inicializar();

        const primero = await this.collection.get({ ids: [`${idLibro}_chunk_0`] });
        const metadata = primero.metadatas?.[0];

        if (!metadata) {
            return { eliminado: 0, encontrado: false };
        }

        const totalChunks = metadata.totalChunks || 0;
        const ids = [];

        for (let i = 0; i < totalChunks; i++) {
            ids.push(`${idLibro}_chunk_${i}`);
        }

        await this.collection.delete({ ids });

        return {
            eliminado: ids.length,
            encontrado: true,
            idBase: idLibro
        };
    }
}

module.exports = VectorModel;