// src/models/VectorModel.js
const { ChromaClient } = require("chromadb");
const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed");

class VectorModel {
    constructor() {
        // Conexión actualizada a ChromaDB v2 (recomendado)
        this.client = new ChromaClient({
            host: "localhost",
            port: 8000
        });
        
        this.embeddingFunction = new DefaultEmbeddingFunction();
        this.collection = null;
    }

    async inicializar() {
        console.log("🔄 Conectando a ChromaDB (v2)...");

        this.collection = await this.client.getOrCreateCollection({
            name: "mis_documentos",
            embeddingFunction: this.embeddingFunction,   // ← Aquí está la solución
            metadata: {
                description: "Documentos anonimizados del curso"
            }
        });

        console.log("✅ Colección 'mis_documentos' lista con embedding function");
        return this.collection;
    }

    async guardarTexto(id, texto, metadatos = {}) {
        if (!this.collection) {
            await this.inicializar();
        }

        await this.collection.add({
            ids: [id],
            documents: [texto],
            metadatas: [metadatos]
        });

        console.log(`📄 Documento guardado con ID: ${id}`);
        return "Documento guardado correctamente en ChromaDB";
    }

    async contarDocumentos() {
        if (!this.collection) {
            await this.inicializar();
        }
        
        const count = await this.collection.count();
        console.log(`📊 Total de documentos en ChromaDB: ${count}`);
        return count;
    }
}

module.exports = VectorModel;