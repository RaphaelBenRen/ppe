const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { summarizeCourse, reformatContent, answerQuestion } = require('../utils/claude');

// Route pour récupérer tous les résumés de l'utilisateur
router.get('/my-summaries', authMiddleware, async (req, res) => {
    try {
        const { data: summaries, error } = await supabase
            .from('summaries')
            .select('id, titre, matiere, original_course_titre, created_at, updated_at')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: summaries || []
        });

    } catch (error) {
        console.error('Erreur récupération résumés:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des résumés'
        });
    }
});

// Route pour récupérer un résumé spécifique
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: summaries, error } = await supabase
            .from('summaries')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!summaries || summaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Résumé non trouvé'
            });
        }

        res.json({
            success: true,
            data: summaries[0]
        });

    } catch (error) {
        console.error('Erreur récupération résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du résumé'
        });
    }
});

// Route pour créer un résumé (depuis un cours ou du texte)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { courseId, titre, matiere, content } = req.body;

        let summaryContent = content;
        let originalCourseTitre = null;

        // Si courseId est fourni, générer le résumé depuis le cours
        if (courseId) {
            const { data: courses, error: courseError } = await supabase
                .from('courses')
                .select('titre, matiere, text_content, file_path')
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
            originalCourseTitre = course.titre;

            if (!course.text_content) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun contenu disponible pour ce cours'
                });
            }

            console.log('📝 Génération résumé depuis cours:', course.titre);

            summaryContent = await summarizeCourse(course.text_content, {
                titre: course.titre,
                matiere: course.matiere
            });
        }

        if (!summaryContent) {
            return res.status(400).json({
                success: false,
                message: 'Contenu du résumé requis'
            });
        }

        // Sauvegarder le résumé
        const { data: result, error: insertError } = await supabase
            .from('summaries')
            .insert({
                user_id: req.user.userId,
                course_id: courseId || null,
                titre: titre || `Résumé - ${originalCourseTitre || 'Sans titre'}`,
                matiere: matiere || 'Autre',
                content: summaryContent,
                original_course_titre: originalCourseTitre
            })
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('✅ Résumé sauvegardé avec ID:', result.id);

        res.json({
            success: true,
            message: 'Résumé créé avec succès !',
            data: {
                id: result.id,
                titre: result.titre,
                content: summaryContent
            }
        });

    } catch (error) {
        console.error('Erreur création résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du résumé: ' + error.message
        });
    }
});

// Route pour mettre à jour le contenu d'un résumé
router.put('/:id/content', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Le contenu est requis'
            });
        }

        // Vérifier que le résumé appartient à l'utilisateur
        const { data: summaries, error: fetchError } = await supabase
            .from('summaries')
            .select('id')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (fetchError) throw fetchError;

        if (!summaries || summaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Résumé non trouvé'
            });
        }

        // Mettre à jour le contenu
        const { error: updateError } = await supabase
            .from('summaries')
            .update({
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (updateError) throw updateError;

        console.log('✅ Contenu du résumé mis à jour:', req.params.id);

        res.json({
            success: true,
            message: 'Contenu mis à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur mise à jour résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour: ' + error.message
        });
    }
});

// Route pour reformater un résumé avec l'IA
router.post('/:id/reformat', authMiddleware, async (req, res) => {
    try {
        const { data: summaries, error } = await supabase
            .from('summaries')
            .select('titre, matiere, content')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!summaries || summaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Résumé non trouvé'
            });
        }

        const summary = summaries[0];

        console.log('🔄 Reformatage du résumé:', summary.titre);

        const reformattedContent = await reformatContent(summary.content, {
            titre: summary.titre,
            matiere: summary.matiere
        });

        // Sauvegarder le contenu reformaté
        const { error: updateError } = await supabase
            .from('summaries')
            .update({
                content: reformattedContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (updateError) throw updateError;

        console.log('✅ Résumé reformaté');

        res.json({
            success: true,
            message: 'Résumé reformaté avec succès',
            data: {
                content: reformattedContent
            }
        });

    } catch (error) {
        console.error('Erreur reformatage résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du reformatage: ' + error.message
        });
    }
});

// Route pour poser une question à l'IA sur le résumé
router.post('/:id/ask', authMiddleware, async (req, res) => {
    try {
        const { question, context } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'La question est requise'
            });
        }

        const { data: summaries, error } = await supabase
            .from('summaries')
            .select('titre, matiere, content')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!summaries || summaries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Résumé non trouvé'
            });
        }

        const summary = summaries[0];

        console.log('🤖 Question IA sur le résumé:', summary.titre);

        const answer = await answerQuestion(question, context || summary.content, {
            titre: summary.titre,
            matiere: summary.matiere
        });

        res.json({
            success: true,
            data: {
                answer
            }
        });

    } catch (error) {
        console.error('Erreur question IA résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de la réponse: ' + error.message
        });
    }
});

// Route pour supprimer un résumé
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase
            .from('summaries')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Résumé supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du résumé'
        });
    }
});

module.exports = router;
