// src/utils/procesarPDF.js
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

async function extraerTextoDePDF(rutaPDF) {
    // Abrimos el archivo como buffer binario para pasarlo al parser.
    const dataBuffer = fs.readFileSync(rutaPDF);
    const parser = new PDFParse({ data: dataBuffer });

    try {
        // getText devuelve el contenido textual de todas las páginas.
        const data = await parser.getText();
        return data.text;
    } finally {
        // Liberamos recursos internos del parser al terminar.
        await parser.destroy();
    }
}

async function extraerTextoDeDocumento(rutaArchivo) {
    const extension = path.extname(rutaArchivo).toLowerCase();

    if (extension === ".pdf") {
        return extraerTextoDePDF(rutaArchivo);
    }

    if (extension === ".docx") {
        const resultado = await mammoth.extractRawText({ path: rutaArchivo });
        return resultado.value || "";
    }

    throw new Error("Formato no soportado. Usa .pdf o .docx");
}

function dividirEnChunks(texto, tamanoChunk = 600) {
    // Dividimos por palabras para crear bloques de tamaño razonable.
    const chunks = [];
    const palabras = texto.split(" ");

    let chunkActual = "";

    for (let palabra of palabras) {
        if ((chunkActual + palabra).length > tamanoChunk) {
            chunks.push(chunkActual.trim());
            chunkActual = palabra + " ";
        } else {
            chunkActual += palabra + " ";
        }
    }

    if (chunkActual.trim()) chunks.push(chunkActual.trim());

    return chunks;
}

module.exports = { extraerTextoDePDF, extraerTextoDeDocumento, dividirEnChunks };
