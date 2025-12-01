const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { supabase } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseDocument, cleanText } = require('../utils/documentParser');
const { answerQuestion, extractTextFromImage, reformatContent } = require('../utils/claude');

// Configuration de Multer pour l'upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
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

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Utilisez PDF, DOCX, PPT ou TXT.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Configuration multer pour les images OCR
const imageStorage = multer.memoryStorage();
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type d\'image non autorisé. Utilisez JPG, PNG ou WebP.'));
    }
};
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});

// Route pour uploader un cours
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    console.log('📤 Upload reçu:', req.file ? req.file.originalname : 'Pas de fichier');
    console.log('📋 Body:', req.body);

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        const { titre, description, annee_cible, matiere, type_document } = req.body;

        // Validation
        if (!titre || !annee_cible || !matiere || !type_document) {
            console.log('❌ Validation échouée - champs manquants');
            await fs.unlink(req.file.path);

            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        console.log('💾 Sauvegarde en BDD...');

        // Sauvegarder dans la base de données
        const { data: result, error } = await supabase
            .from('courses')
            .insert({
                titre,
                description: description || null,
                annee_cible,
                matiere,
                type_document,
                file_path: req.file.path,
                file_type: path.extname(req.file.originalname).substring(1),
                uploaded_by: req.user.userId
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Cours sauvegardé avec ID:', result.id);

        res.json({
            success: true,
            message: 'Cours uploadé avec succès !',
            data: {
                id: result.id,
                titre,
                matiere,
                annee_cible,
                type_document,
                filename: req.file.filename
            }
        });

    } catch (error) {
        console.error('❌ Erreur upload:', error);

        // Supprimer le fichier en cas d'erreur
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Erreur suppression fichier:', unlinkError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload du cours: ' + error.message
        });
    }
});

// Route pour récupérer tous les cours de l'utilisateur
router.get('/my-courses', authMiddleware, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('id, titre, description, annee_cible, matiere, type_document, file_type, created_at')
            .eq('uploaded_by', req.user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: courses || []
        });

    } catch (error) {
        console.error('Erreur récupération cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des cours'
        });
    }
});

// Route pour extraire le texte d'une image (OCR) - DOIT être avant /:id
router.post('/ocr', authMiddleware, uploadImage.single('image'), async (req, res) => {
    console.log('📸 OCR reçu:', req.file ? req.file.originalname : 'Pas d\'image');

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucune image fournie'
            });
        }

        console.log('🔍 Extraction du texte via GPT-4o Vision...');

        // Convertir en base64
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Extraire le texte
        const extractedText = await extractTextFromImage(imageBase64, mimeType);

        console.log('✅ Texte extrait avec succès');

        res.json({
            success: true,
            data: {
                text: extractedText,
                imageSize: req.file.size,
                mimeType: mimeType
            }
        });

    } catch (error) {
        console.error('❌ Erreur OCR:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'extraction du texte: ' + error.message
        });
    }
});

// Route pour uploader un cours depuis une image OCR - DOIT être avant /:id
router.post('/upload-from-ocr', authMiddleware, async (req, res) => {
    try {
        const { titre, description, annee_cible, matiere, type_document, content } = req.body;

        // Validation
        if (!titre || !annee_cible || !matiere || !type_document || !content) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis (titre, annee_cible, matiere, type_document, content)'
            });
        }

        console.log('💾 Sauvegarde du cours OCR en BDD...');

        // Sauvegarder dans la base de données avec le contenu texte directement
        const { data: result, error } = await supabase
            .from('courses')
            .insert({
                titre,
                description: description || 'Cours importé depuis une photo',
                annee_cible,
                matiere,
                type_document,
                file_path: 'ocr-content',
                file_type: 'txt',
                text_content: content,
                uploaded_by: req.user.userId
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Cours OCR sauvegardé avec ID:', result.id);

        res.json({
            success: true,
            message: 'Cours créé avec succès depuis la photo !',
            data: {
                id: result.id,
                titre,
                matiere,
                annee_cible,
                type_document
            }
        });

    } catch (error) {
        console.error('❌ Erreur upload OCR:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du cours: ' + error.message
        });
    }
});

// Route pour récupérer un cours spécifique
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        res.json({
            success: true,
            data: courses[0]
        });

    } catch (error) {
        console.error('Erreur récupération cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du cours'
        });
    }
});

// Route pour télécharger/servir le fichier original d'un cours
router.get('/:id/file', authMiddleware, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('file_path, file_type, titre')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];
        const filePath = course.file_path;

        // Vérifier que le fichier existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé sur le serveur'
            });
        }

        // Définir le type MIME
        const mimeTypes = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'txt': 'text/plain',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'ppt': 'application/vnd.ms-powerpoint'
        };

        const mimeType = mimeTypes[course.file_type] || 'application/octet-stream';

        res.setHeader('Content-Type', mimeType);

        // Encoder le nom de fichier pour éviter les erreurs avec les caractères spéciaux
        const safeFilename = course.titre.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_');
        const encodedFilename = encodeURIComponent(`${course.titre}.${course.file_type}`);
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}.${course.file_type}"; filename*=UTF-8''${encodedFilename}`);

        // Lire et envoyer le fichier
        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);

    } catch (error) {
        console.error('Erreur récupération fichier cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du fichier'
        });
    }
});

// Route pour récupérer le contenu parsé d'un cours
router.get('/:id/content', authMiddleware, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('file_path, titre, matiere, file_type, edited_content_path, text_content')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];
        let content;

        // Priorité 1: Contenu édité (fichier)
        if (course.edited_content_path) {
            try {
                console.log('📖 Lecture du contenu édité:', course.titre);
                content = await fs.readFile(course.edited_content_path, 'utf-8');
            } catch (readError) {
                console.log('📖 Fichier édité non trouvé, fallback...');
                content = null;
            }
        }

        // Priorité 2: Contenu texte stocké en BDD (cours OCR)
        if (!content && course.text_content) {
            console.log('📖 Utilisation du contenu texte stocké en BDD:', course.titre);
            content = course.text_content;
        }

        // Priorité 3: Parser le fichier original
        if (!content && course.file_path && course.file_path !== 'ocr-content') {
            try {
                console.log('📖 Parsing du fichier:', course.titre);
                content = await parseDocument(course.file_path);
            } catch (parseError) {
                console.error('Erreur parsing fichier:', parseError);
                return res.status(500).json({
                    success: false,
                    message: 'Impossible de lire le contenu du cours. Le fichier est peut-être inaccessible.'
                });
            }
        }

        if (!content) {
            return res.status(500).json({
                success: false,
                message: 'Aucun contenu disponible pour ce cours.'
            });
        }

        const cleanedContent = content.trim();

        res.json({
            success: true,
            data: {
                titre: course.titre,
                matiere: course.matiere,
                file_type: course.file_type,
                content: cleanedContent
            }
        });

    } catch (error) {
        console.error('Erreur récupération contenu cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la lecture du cours: ' + error.message
        });
    }
});

// Route pour récupérer les surlignages d'un cours
router.get('/:id/highlights', authMiddleware, async (req, res) => {
    try {
        const { data: highlights, error } = await supabase
            .from('course_highlights')
            .select('*')
            .eq('course_id', req.params.id)
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: highlights || []
        });

    } catch (error) {
        console.error('Erreur récupération surlignages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des surlignages'
        });
    }
});

// Route pour sauvegarder les surlignages d'un cours
router.post('/:id/highlights', authMiddleware, async (req, res) => {
    try {
        const { highlights } = req.body;

        if (!Array.isArray(highlights)) {
            return res.status(400).json({
                success: false,
                message: 'Les surlignages doivent être un tableau'
            });
        }

        // Supprimer les anciens surlignages de l'utilisateur pour ce cours
        const { error: deleteError } = await supabase
            .from('course_highlights')
            .delete()
            .eq('course_id', req.params.id)
            .eq('user_id', req.user.userId);

        if (deleteError) throw deleteError;

        // Insérer les nouveaux surlignages s'il y en a
        if (highlights.length > 0) {
            const highlightsToInsert = highlights.map(h => ({
                course_id: parseInt(req.params.id),
                user_id: req.user.userId,
                text_content: h.text,
                color: h.color,
                start_offset: h.startOffset || null,
                end_offset: h.endOffset || null,
                page_number: h.pageNumber || 1
            }));

            const { error: insertError } = await supabase
                .from('course_highlights')
                .insert(highlightsToInsert);

            if (insertError) throw insertError;
        }

        res.json({
            success: true,
            message: 'Surlignages sauvegardés'
        });

    } catch (error) {
        console.error('Erreur sauvegarde surlignages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la sauvegarde des surlignages'
        });
    }
});

// Route pour mettre à jour le contenu textuel d'un cours
router.put('/:id/content', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Le contenu est requis'
            });
        }

        // Vérifier que le cours appartient à l'utilisateur
        const { data: courses, error: fetchError } = await supabase
            .from('courses')
            .select('id')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (fetchError) throw fetchError;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Sauvegarder le contenu directement en BDD (plus fiable que les fichiers)
        const { error: updateError } = await supabase
            .from('courses')
            .update({ text_content: content })
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (updateError) throw updateError;

        console.log('✅ Contenu du cours mis à jour:', req.params.id);

        res.json({
            success: true,
            message: 'Contenu mis à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur mise à jour contenu:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du contenu: ' + error.message
        });
    }
});

// Route pour reformater le contenu d'un cours avec l'IA
router.post('/:id/reformat', authMiddleware, async (req, res) => {
    try {
        // Récupérer les infos du cours
        const { data: courses, error } = await supabase
            .from('courses')
            .select('titre, matiere, file_path, text_content, edited_content_path')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];

        // Récupérer le contenu actuel
        let content;

        if (course.edited_content_path) {
            try {
                content = await fs.readFile(course.edited_content_path, 'utf-8');
            } catch (readError) {
                content = null;
            }
        }

        if (!content && course.text_content) {
            content = course.text_content;
        }

        if (!content && course.file_path && course.file_path !== 'ocr-content') {
            try {
                content = await parseDocument(course.file_path);
            } catch (parseError) {
                return res.status(500).json({
                    success: false,
                    message: 'Impossible de lire le contenu du cours'
                });
            }
        }

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Aucun contenu à reformater'
            });
        }

        console.log('🔄 Reformatage du cours:', course.titre);

        // Appeler l'IA pour reformater
        const reformattedContent = await reformatContent(content, {
            titre: course.titre,
            matiere: course.matiere
        });

        // Sauvegarder le contenu reformaté en BDD
        const { error: updateError } = await supabase
            .from('courses')
            .update({ text_content: reformattedContent })
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (updateError) throw updateError;

        console.log('✅ Contenu reformaté et sauvegardé');

        res.json({
            success: true,
            message: 'Contenu reformaté avec succès',
            data: {
                content: reformattedContent
            }
        });

    } catch (error) {
        console.error('Erreur reformatage:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du reformatage: ' + error.message
        });
    }
});

// Route pour poser une question à l'IA sur le contenu du cours
router.post('/:id/ask', authMiddleware, async (req, res) => {
    try {
        const { question, context } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'La question est requise'
            });
        }

        // Récupérer les infos du cours
        const { data: courses, error } = await supabase
            .from('courses')
            .select('titre, matiere')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (error) throw error;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const course = courses[0];

        console.log('🤖 Question IA sur le cours:', course.titre);
        console.log('❓ Question:', question);

        const answer = await answerQuestion(question, context || '', {
            titre: course.titre,
            matiere: course.matiere
        });

        res.json({
            success: true,
            data: {
                answer
            }
        });

    } catch (error) {
        console.error('Erreur question IA:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération de la réponse: ' + error.message
        });
    }
});

// Route pour supprimer un cours
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Récupérer le cours pour obtenir le chemin du fichier
        const { data: courses, error: fetchError } = await supabase
            .from('courses')
            .select('file_path')
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (fetchError) throw fetchError;

        if (!courses || courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Supprimer le fichier
        try {
            await fs.unlink(courses[0].file_path);
        } catch (error) {
            console.error('Erreur suppression fichier:', error);
        }

        // Supprimer de la base de données
        const { error: deleteError } = await supabase
            .from('courses')
            .delete()
            .eq('id', req.params.id)
            .eq('uploaded_by', req.user.userId);

        if (deleteError) throw deleteError;

        res.json({
            success: true,
            message: 'Cours supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur suppression cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du cours'
        });
    }
});

// Middleware pour gérer les erreurs Multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Le fichier est trop volumineux. Taille maximale : 500MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next(error);
});

module.exports = router;
