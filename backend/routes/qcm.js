const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseDocument, cleanText, chunkText } = require('../utils/documentParser');
const { generateQCM } = require('../utils/claude');

// Route pour générer un QCM à partir d'un cours uploadé
router.post('/generate-from-course/:courseId', authMiddleware, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { nombre_questions, difficulte } = req.body;

        // Validation
        if (!nombre_questions || !difficulte) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de questions et difficulté requis'
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
        const contentToUse = chunks[0]; // Utiliser le premier chunk pour l'instant

        console.log(`Génération QCM - Longueur texte: ${contentToUse.length} caractères`);

        // Générer le QCM avec Claude
        const questions = await generateQCM(contentToUse, {
            nombreQuestions: parseInt(nombre_questions),
            difficulte,
            matiere: course.matiere,
            annee: course.annee_cible
        });

        // Sauvegarder le QCM dans la base de données
        const [result] = await pool.query(`
            INSERT INTO qcms
            (user_id, titre, matiere, annee_cible, difficulte, nombre_questions, questions_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.userId,
            `QCM - ${course.titre}`,
            course.matiere,
            course.annee_cible,
            difficulte,
            questions.length,
            JSON.stringify(questions)
        ]);

        res.json({
            success: true,
            message: 'QCM généré avec succès !',
            data: {
                qcmId: result.insertId,
                titre: `QCM - ${course.titre}`,
                nombreQuestions: questions.length,
                questions
            }
        });

    } catch (error) {
        console.error('Erreur génération QCM:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la génération du QCM'
        });
    }
});

// Route pour générer un QCM à partir de texte personnalisé
router.post('/generate-from-text', authMiddleware, async (req, res) => {
    try {
        const { textContent, nombreQuestions, difficulte, matiere, annee_cible, titre } = req.body;

        // Validation
        if (!textContent || !nombreQuestions || !difficulte || !matiere) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        const cleanedText = cleanText(textContent);

        console.log(`Génération QCM - Longueur texte: ${cleanedText.length} caractères`);

        // Générer le QCM avec Claude
        const questions = await generateQCM(cleanedText, {
            nombreQuestions: parseInt(nombreQuestions),
            difficulte,
            matiere,
            annee: annee_cible || ''
        });

        // Sauvegarder le QCM
        const [result] = await pool.query(`
            INSERT INTO qcms
            (user_id, titre, matiere, annee_cible, difficulte, nombre_questions, questions_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            req.user.userId,
            titre || `QCM - ${matiere}`,
            matiere,
            annee_cible || 'Ing1',
            difficulte,
            questions.length,
            JSON.stringify(questions)
        ]);

        res.json({
            success: true,
            message: 'QCM généré avec succès !',
            data: {
                qcmId: result.insertId,
                nombreQuestions: questions.length,
                questions
            }
        });

    } catch (error) {
        console.error('Erreur génération QCM:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la génération du QCM'
        });
    }
});

// Route pour récupérer tous les QCMs de l'utilisateur
router.get('/my-qcms', authMiddleware, async (req, res) => {
    try {
        const [qcms] = await pool.query(`
            SELECT
                id,
                titre,
                matiere,
                annee_cible,
                difficulte,
                nombre_questions,
                score,
                completed,
                created_at
            FROM qcms
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [req.user.userId]);

        res.json({
            success: true,
            data: qcms
        });

    } catch (error) {
        console.error('Erreur récupération QCMs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des QCMs'
        });
    }
});

// Route pour récupérer un QCM spécifique avec ses questions
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [qcms] = await pool.query(`
            SELECT * FROM qcms
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.userId]);

        if (qcms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'QCM non trouvé'
            });
        }

        const qcm = qcms[0];
        qcm.questions_data = JSON.parse(qcm.questions_data);

        res.json({
            success: true,
            data: qcm
        });

    } catch (error) {
        console.error('Erreur récupération QCM:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du QCM'
        });
    }
});

// Route pour soumettre les réponses d'un QCM
router.post('/:id/submit', authMiddleware, async (req, res) => {
    try {
        const { answers } = req.body; // { "0": "A", "1": "C", ... }

        // Récupérer le QCM
        const [qcms] = await pool.query(`
            SELECT * FROM qcms
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.userId]);

        if (qcms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'QCM non trouvé'
            });
        }

        const qcm = qcms[0];
        const questions = JSON.parse(qcm.questions_data);

        // Calculer le score
        let correctAnswers = 0;
        const results = questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correct_answer;

            if (isCorrect) {
                correctAnswers++;
            }

            return {
                questionIndex: index,
                userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect,
                explanation: question.explanation
            };
        });

        const score = Math.round((correctAnswers / questions.length) * 100);

        // Mettre à jour le QCM
        await pool.query(`
            UPDATE qcms
            SET score = ?, completed = TRUE, completed_at = NOW()
            WHERE id = ?
        `, [score, req.params.id]);

        res.json({
            success: true,
            data: {
                score,
                correctAnswers,
                totalQuestions: questions.length,
                results
            }
        });

    } catch (error) {
        console.error('Erreur soumission QCM:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la soumission du QCM'
        });
    }
});

// Route pour supprimer un QCM
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await pool.query(`
            DELETE FROM qcms
            WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.userId]);

        res.json({
            success: true,
            message: 'QCM supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression QCM:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du QCM'
        });
    }
});

module.exports = router;
