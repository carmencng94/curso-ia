// src/utils/procesarPDF.js
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function extraerTextoDePDF(rutaPDF) {
    const dataBuffer = fs.readFileSync(rutaPDF);
    const parser = new PDFParse({ data: dataBuffer });

    try {
        const data = await parser.getText();
        return data.text;
    } finally {
        await parser.destroy();
    }
}

function dividirEnChunks(texto, tamanoChunk = 600) {
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

module.exports = { extraerTextoDePDF, dividirEnChunks };
