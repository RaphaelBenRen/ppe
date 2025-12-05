const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
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
        const { data: courses, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .eq('uploaded_by', req.user.userId);

        if (courseError) throw courseError;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];

        // Récupérer le contenu du cours
        let textContent;

        // Si le cours a du contenu texte stocké directement (copier-coller ou OCR)
        if (course.text_content) {
            textContent = course.text_content;
        }
        // Sinon parser le fichier
        else if (course.file_path && course.file_path !== 'text-import' && course.file_path !== 'ocr-content') {
            textContent = await parseDocument(course.file_path);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Aucun contenu disponible pour ce cours'
            });
        }

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
        const { data: result, error: insertError } = await supabase
            .from('flashcards')
            .insert({
                user_id: req.user.userId,
                titre: `Flashcards - ${course.titre}`,
                matiere: course.matiere,
                annee_cible: course.annee_cible,
                cards_data: cards
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.json({
            success: true,
            message: 'Flashcards générées avec succès !',
            data: {
                flashcardId: result.id,
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
        const { data: flashcards, error } = await supabase
            .from('flashcards')
            .select('id, titre, matiere, annee_cible, created_at')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: flashcards || []
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
        const { data: flashcards, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!flashcards || flashcards.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Flashcards non trouvées'
            });
        }

        res.json({
            success: true,
            data: flashcards[0]
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
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

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
