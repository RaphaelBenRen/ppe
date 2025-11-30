const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { supabase } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { parseDocument, cleanText } = require('../utils/documentParser');

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
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Utilisez PDF, DOCX ou TXT.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
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

// Route pour récupérer le contenu parsé d'un cours
router.get('/:id/content', authMiddleware, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('file_path, titre, matiere, file_type')
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

        // Parser le fichier
        console.log('📖 Parsing du cours:', course.titre);
        const content = await parseDocument(course.file_path);
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
