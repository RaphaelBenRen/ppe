const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseDocument, cleanText, chunkText } = require('../utils/documentParser');
const { generateFlashcards } = require('../utils/claude');

// Route pour générer des flashcards à partir d'un cours
router.post('/generate-from-course/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { nombre_flashcards } = req.body;

        if (!nombre_flashcards) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de cartes requis'
            });
        }

        // Récupérer le cours
        const [courses] = await pool.query(`
            SELECT * FROM courses
            WHERE id = ? AND uploaded_by = ?
        `, [courseId, req.user.userId]);

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];

        // Parser le document
        let textContent = await parseDocument(course.file_path);
        textContent = cleanText(textContent);

        // Si le texte est trop long, prendre un chunk
        const chunks = chunkText(textContent);
        const contentToUse = chunks[0];

        console.log(`Génération Flashcards - Longueur texte: ${contentToUse.length} caractères`);

        // Générer les flashcards avec Claude
        const cards = await generateFlashcards(contentToUse, {
            nombreCartes: parseInt(nombre_flashcards),
            matiere: course.matiere,
            annee: course.annee_cible
        });

        // Sauvegarder dans la base de données
        const [result] = await pool.query(`
            INSERT INTO flashcards
            (user_id, titre, matiere, annee_cible, cards_data)
            VALUES (?, ?, ?, ?, ?)
        `, [
            req.user.userId,
            `Flashcards - ${course.titre}`,
            course.matiere,
            course.annee_cible,
            JSON.stringify(cards)
        ]);

        res.json({
            success: true,
            message: 'Flashcards générées avec succès !',
            data: {
                flashcardId: result.insertId,
                titre: `Flashcards - ${course.titre}`,
                nombreCartes: cards.length,
                cards
            }
        });

    } catch (error) {
        console.error('Erreur génération flashcards:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la génération des flashcards'
        });
    }
});

// Route pour récupérer toutes les flashcards de l'utilisateur
router.get('/my-flashcards', authMiddleware, async (req, res) => {
    try {
        const [flashcards] = await pool.query(`
            SELECT
                id,
                titre,
                matiere,
                annee_cible,
                created_at
            FROM flashcards
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [req.user.userId]);

        res.json({
            success: true,
            data: flashcards
        });

    } catch (error) {
        console.error('Erreur récupération flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des flashcards'
        });
    }
});

// Route pour récupérer un set de flashcards spécifique
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [flashcards] = await pool.query(`
            SELECT * FROM flashcards
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.userId]);

        if (flashcards.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flashcards non trouvées'
            });
        }

        const flashcard = flashcards[0];
        flashcard.cards_data = JSON.parse(flashcard.cards_data);

        res.json({
            success: true,
            data: flashcard
        });

    } catch (error) {
        console.error('Erreur récupération flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des flashcards'
        });
    }
});

// Route pour supprimer un set de flashcards
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query(`
            DELETE FROM flashcards
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.userId]);

        res.json({
            success: true,
            message: 'Flashcards supprimées avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression des flashcards'
        });
    }
});

module.exports = router;
