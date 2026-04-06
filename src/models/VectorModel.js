// src/models/VectorModel.js
const { ChromaClient } = require("chromadb");
const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed");

class VectorModel {
    constructor() {
        // Cliente que habla con ChromaDB en el puerto 8000.
        this.client = new ChromaClient({ host: "localhost", port: 8000 });
        // Función que convierte texto en vectores para buscar por significado.
        this.embeddingFunction = new DefaultEmbeddingFunction();
        this.collection = null;
    }

    async inicializar() {
        // Solo creamos la colección la primera vez que se necesita.
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
        // Todo lo demás solo consulta o elimina.
        await this.inicializar();
        await this.collection.add({
            ids: [id],
            documents: [texto],
            metadatas: [metadatos]
        });
        console.log(`📄 Guardado: ${id}`);
    }

    async contarDocumentos() {
        // Devuelve cuántos documentos hay guardados en total.
        await this.inicializar();
        const count = await this.collection.count();
        console.log(`📊 Total documentos: ${count}`);
        return count;
    }

    // NUEVO MÉTODO: Buscar documentos similares a una pregunta
    async buscarSimilar(pregunta, cantidad = 2) {
        // Esta consulta solo lee datos ya guardados; no crea documentos nuevos.
        // ChromaDB usa el embedding de la pregunta para encontrar el contenido más parecido.
        await this.inicializar();

        const resultados = await this.collection.query({
            queryTexts: [pregunta],
            nResults: cantidad,
        });

        return resultados;
    }

    async existeDocumento(id) {
        // Comprobación rápida para saber si ya guardamos un chunk concreto.
        await this.inicializar();

        const resultado = await this.collection.get({ ids: [id] });
        return (resultado.ids || []).length > 0;
    }

    async eliminarLibro(idLibro) {
        // Carga la metadata del primer chunk para saber cuántos chunks hay que borrar.
        await this.inicializar();

        const primero = await this.collection.get({ ids: [`${idLibro}_chunk_0`] });
        const metadata = primero.metadatas?.[0];

        if (!metadata) {
            return { eliminado: 0, encontrado: false };
        }

        const totalChunks = metadata.totalChunks || 0;
        const ids = [];

        // Generamos los ids de todos los chunks del libro.
        for (let i = 0; i < totalChunks; i++) {
            ids.push(`${idLibro}_chunk_${i}`);
        }

        // Borramos todos los chunks de una sola vez.
        await this.collection.delete({ ids });

        return {
            eliminado: ids.length,
            encontrado: true,
            idBase: idLibro
        };
    }
}

module.exports = VectorModel;