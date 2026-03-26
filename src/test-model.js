// src/test-model.js
// Archivo temporal para probar el Modelo

const VectorModel = require("./models/VectorModel");

async function probarModelo() {
    console.log("🚀 Iniciando prueba del Modelo...\n");

    const modelo = new VectorModel();

    try {
        // 1. Inicializar conexión con ChromaDB
        await modelo.inicializar();

        // 2. Contar cuántos documentos tenemos (debería ser 0)
        await modelo.contarDocumentos();

        // 3. Guardar un texto de ejemplo
        const resultado = await modelo.guardarTexto(
            "doc_001", 
            "Este es un documento de prueba para el curso de IA con Node.js y Podman.",
            { fecha: new Date().toISOString(), origen: "prueba" }
        );

        console.log("\n✅ Resultado:", resultado);

        // 4. Volver a contar documentos
        await modelo.contarDocumentos();

        console.log("\n🎉 ¡Prueba completada con éxito!");
        
    } catch (error) {
        console.error("❌ Error durante la prueba:", error.message);
    }
}

// Ejecutar la prueba
probarModelo();