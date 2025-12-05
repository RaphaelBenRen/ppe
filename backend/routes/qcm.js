const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseDocument, cleanText, chunkText } = require('../utils/documentParser');
const { generateQCM, parseQCM } = require('../utils/claude');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration de Multer pour l'upload de PDF
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/temp');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non supporté. Utilisez PDF ou TXT.'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

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

        console.log(`Génération QCM - Longueur texte: ${contentToUse.length} caractères`);

        // Générer le QCM avec Claude
        const questions = await generateQCM(contentToUse, {
            nombreQuestions: parseInt(nombre_questions),
            difficulte,
            matiere: course.matiere,
            annee: course.annee_cible
        });

        // Sauvegarder le QCM dans la base de données
        const { data: result, error: insertError } = await supabase
            .from('qcms')
            .insert({
                user_id: req.user.userId,
                titre: `QCM - ${course.titre}`,
                matiere: course.matiere,
                annee_cible: course.annee_cible,
                difficulte,
                nombre_questions: questions.length,
                questions_data: questions
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.json({
            success: true,
            message: 'QCM généré avec succès !',
            data: {
                qcmId: result.id,
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
        const { data: result, error: insertError } = await supabase
            .from('qcms')
            .insert({
                user_id: req.user.userId,
                titre: titre || `QCM - ${matiere}`,
                matiere,
                annee_cible: annee_cible || 'Ing1',
                difficulte,
                nombre_questions: questions.length,
                questions_data: questions
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.json({
            success: true,
            message: 'QCM généré avec succès !',
            data: {
                qcmId: result.id,
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
        const { data: qcms, error } = await supabase
            .from('qcms')
            .select('id, titre, matiere, annee_cible, difficulte, nombre_questions, score, completed, created_at')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: qcms || []
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
        const { data: qcms, error } = await supabase
            .from('qcms')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!qcms || qcms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'QCM non trouvé'
            });
        }

        const qcm = qcms[0];

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
        const { answers, tempsEcoule } = req.body;

        // Récupérer le QCM
        const { data: qcms, error: qcmError } = await supabase
            .from('qcms')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (qcmError) throw qcmError;

        if (!qcms || qcms.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'QCM non trouvé'
            });
        }

        const qcm = qcms[0];
        const questions = qcm.questions_data;

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
                question: question.question,
                userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect,
                explanation: question.explanation,
                options: question.options
            };
        });

        const incorrectAnswers = questions.length - correctAnswers;
        const pourcentage = (correctAnswers / questions.length) * 100;

        // Sauvegarder cette tentative dans l'historique
        const { data: attemptResult, error: attemptError } = await supabase
            .from('qcm_attempts')
            .insert({
                qcm_id: parseInt(req.params.id),
                user_id: req.user.userId,
                answers_data: results,
                score: Math.round(pourcentage),
                pourcentage,
                nombre_correctes: correctAnswers,
                nombre_incorrectes: incorrectAnswers,
                temps_ecoule: tempsEcoule || null
            })
            .select()
            .single();

        if (attemptError) throw attemptError;

        // Mettre à jour le meilleur score du QCM si nécessaire
        if (!qcm.score || pourcentage > qcm.score) {
            const { error: updateError } = await supabase
                .from('qcms')
                .update({
                    score: Math.round(pourcentage),
                    completed: true,
                    completed_at: new Date().toISOString()
                })
                .eq('id', req.params.id);

            if (updateError) throw updateError;
        }

        res.json({
            success: true,
            data: {
                attemptId: attemptResult.id,
                score: Math.round(pourcentage),
                pourcentage,
                correctAnswers,
                incorrectAnswers,
                totalQuestions: questions.length,
                results,
                tempsEcoule
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

// Route pour récupérer l'historique des tentatives d'un QCM
router.get('/:id/attempts', authMiddleware, async (req, res) => {
    try {
        const { data: attempts, error } = await supabase
            .from('qcm_attempts')
            .select('id, score, pourcentage, nombre_correctes, nombre_incorrectes, temps_ecoule, completed_at')
            .eq('qcm_id', req.params.id)
            .eq('user_id', req.user.userId)
            .order('completed_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: attempts || []
        });

    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique'
        });
    }
});

// Route pour récupérer le détail d'une tentative spécifique
router.get('/:id/attempts/:attemptId', authMiddleware, async (req, res) => {
    try {
        const { data: attempts, error } = await supabase
            .from('qcm_attempts')
            .select('*')
            .eq('id', req.params.attemptId)
            .eq('qcm_id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

        if (!attempts || attempts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tentative non trouvée'
            });
        }

        const attempt = attempts[0];

        res.json({
            success: true,
            data: attempt
        });

    } catch (error) {
        console.error('Erreur récupération tentative:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la tentative'
        });
    }
});

// Route pour importer un QCM depuis du texte (copier-coller)
router.post('/import-from-text', authMiddleware, async (req, res) => {
    try {
        const { textContent, titre, matiere, difficulte } = req.body;

        if (!textContent || textContent.trim().length < 50) {
            return res.status(400).json({
                success: false,
                message: 'Texte trop court. Collez le contenu du QCM à importer.'
            });
        }

        console.log('📥 Import QCM depuis texte - Longueur:', textContent.length);

        // Parser le QCM avec l'IA
        const parsedQCM = await parseQCM(textContent, { titre, matiere });

        if (!parsedQCM.questions || parsedQCM.questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune question QCM détectée dans le texte fourni.'
            });
        }

        // Sauvegarder le QCM
        const { data: result, error: insertError } = await supabase
            .from('qcms')
            .insert({
                user_id: req.user.userId,
                titre: titre || parsedQCM.titre,
                matiere: matiere || parsedQCM.matiere,
                annee_cible: 'Ing3',
                difficulte: difficulte || 'moyen',
                nombre_questions: parsedQCM.questions.length,
                questions_data: parsedQCM.questions
            })
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('✅ QCM importé:', result.id, '-', parsedQCM.questions.length, 'questions');

        res.json({
            success: true,
            message: `QCM importé avec succès ! ${parsedQCM.questions.length} questions extraites.${!parsedQCM.answers_from_document ? ' Les réponses ont été déterminées par l\'IA.' : ''}`,
            data: {
                qcmId: result.id,
                titre: result.titre,
                nombreQuestions: parsedQCM.questions.length,
                answersFromDocument: parsedQCM.answers_from_document
            }
        });

    } catch (error) {
        console.error('Erreur import QCM texte:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'import du QCM'
        });
    }
});

// Route pour importer un QCM depuis un fichier PDF
router.post('/import-from-file', authMiddleware, upload.single('file'), async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        filePath = req.file.path;
        const { titre, matiere, difficulte } = req.body;

        console.log('📥 Import QCM depuis fichier:', req.file.originalname);

        // Parser le document
        let textContent = await parseDocument(filePath);
        textContent = cleanText(textContent);

        if (textContent.length < 50) {
            throw new Error('Le fichier ne contient pas assez de texte.');
        }

        // Parser le QCM avec l'IA
        const parsedQCM = await parseQCM(textContent, { titre, matiere });

        if (!parsedQCM.questions || parsedQCM.questions.length === 0) {
            throw new Error('Aucune question QCM détectée dans le fichier.');
        }

        // Sauvegarder le QCM
        const { data: result, error: insertError } = await supabase
            .from('qcms')
            .insert({
                user_id: req.user.userId,
                titre: titre || parsedQCM.titre || req.file.originalname.replace(/\.[^/.]+$/, ''),
                matiere: matiere || parsedQCM.matiere,
                annee_cible: 'Ing3',
                difficulte: difficulte || 'moyen',
                nombre_questions: parsedQCM.questions.length,
                questions_data: parsedQCM.questions
            })
            .select()
            .single();

        if (insertError) throw insertError;

        console.log('✅ QCM importé depuis fichier:', result.id, '-', parsedQCM.questions.length, 'questions');

        res.json({
            success: true,
            message: `QCM importé avec succès ! ${parsedQCM.questions.length} questions extraites.${!parsedQCM.answers_from_document ? ' Les réponses ont été déterminées par l\'IA.' : ''}`,
            data: {
                qcmId: result.id,
                titre: result.titre,
                nombreQuestions: parsedQCM.questions.length,
                answersFromDocument: parsedQCM.answers_from_document
            }
        });

    } catch (error) {
        console.error('Erreur import QCM fichier:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'import du QCM'
        });
    } finally {
        // Nettoyer le fichier temporaire
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (e) {
                console.log('Erreur nettoyage fichier temp:', e.message);
            }
        }
    }
});

// Route pour supprimer un QCM
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // D'abord supprimer toutes les tentatives associées
        const { error: attemptsError } = await supabase
            .from('qcm_attempts')
            .delete()
            .eq('qcm_id', req.params.id)
            .eq('user_id', req.user.userId);

        if (attemptsError) {
            console.error('Erreur suppression tentatives:', attemptsError);
        }

        // Ensuite supprimer le QCM
        const { error } = await supabase
            .from('qcms')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.userId);

        if (error) throw error;

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
