const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * Parse un fichier PDF et retourne le texte
 */
const parsePDF = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Erreur parsing PDF:', error);
        throw new Error('Impossible de lire le fichier PDF');
    }
};

/**
 * Parse un fichier DOCX et retourne le texte
 */
const parseDOCX = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Erreur parsing DOCX:', error);
        throw new Error('Impossible de lire le fichier DOCX');
    }
};

/**
 * Parse un fichier TXT
 */
const parseTXT = async (filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        console.error('Erreur parsing TXT:', error);
        throw new Error('Impossible de lire le fichier TXT');
    }
};

/**
 * Parse un document selon son extension
 */
const parseDocument = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.pdf':
            return await parsePDF(filePath);
        case '.docx':
        case '.doc':
            return await parseDOCX(filePath);
        case '.txt':
            return await parseTXT(filePath);
        default:
            throw new Error(`Type de fichier non supporté: ${ext}`);
    }
};

/**
 * Nettoie et prépare le texte pour l'IA
 */
const cleanText = (text) => {
    // Supprime les espaces multiples
    text = text.replace(/\s+/g, ' ');

    // Supprime les lignes vides multiples
    text = text.replace(/\n\s*\n/g, '\n\n');

    // Trim
    text = text.trim();

    return text;
};

/**
 * Découpe le texte en chunks pour ne pas dépasser les limites de l'API
 */
const chunkText = (text, maxChunkSize = 15000) => {
    const chunks = [];
    const paragraphs = text.split('\n\n');

    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > maxChunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
        } else {
            currentChunk += '\n\n' + paragraph;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

module.exports = {
    parseDocument,
    parsePDF,
    parseDOCX,
    parseTXT,
    cleanText,
    chunkText
};
