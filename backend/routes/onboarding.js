const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Route pour sauvegarder les données d'onboarding
router.post('/complete', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            annee_etude,
            majeure,
            points_forts,
            points_faibles,
            objectifs_apprentissage,
            preferences_difficulte
        } = req.body;

        // Validation de l'année d'étude
        const anneesValides = ['Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5'];
        if (!annee_etude || !anneesValides.includes(annee_etude)) {
            return res.status(400).json({
                success: false,
                message: 'Année d\'étude invalide.'
            });
        }

        // Validation de la majeure pour Ing4 et Ing5
        if ((annee_etude === 'Ing4' || annee_etude === 'Ing5') && !majeure) {
            return res.status(400).json({
                success: false,
                message: 'La majeure est requise pour Ing4 et Ing5.'
            });
        }

        // Conversion des arrays en JSON pour stockage
        const pointsFortsJSON = JSON.stringify(points_forts || []);
        const pointsFaiblesJSON = JSON.stringify(points_faibles || []);

        // Insertion ou mise à jour du profil étudiant
        const [existing] = await pool.query(
            'SELECT id FROM student_profiles WHERE user_id = ?',
            [userId]
        );

        if (existing.length > 0) {
            // Mise à jour
            await pool.query(`
                UPDATE student_profiles
                SET annee_etude = ?,
                    majeure = ?,
                    points_forts = ?,
                    points_faibles = ?,
                    objectifs_apprentissage = ?,
                    preferences_difficulte = ?
                WHERE user_id = ?
            `, [annee_etude, majeure || null, pointsFortsJSON, pointsFaiblesJSON,
                objectifs_apprentissage || null, preferences_difficulte || 'moyen', userId]);
        } else {
            // Insertion
            await pool.query(`
                INSERT INTO student_profiles
                (user_id, annee_etude, majeure, points_forts, points_faibles,
                 objectifs_apprentissage, preferences_difficulte)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, annee_etude, majeure || null, pointsFortsJSON, pointsFaiblesJSON,
                objectifs_apprentissage || null, preferences_difficulte || 'moyen']);
        }

        // Marquer l'onboarding comme complété
        await pool.query(
            'UPDATE users SET onboarding_completed = TRUE WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Profil enregistré avec succès !',
            data: {
                annee_etude,
                majeure,
                points_forts,
                points_faibles
            }
        });

    } catch (error) {
        console.error('Erreur onboarding:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'enregistrement du profil.'
        });
    }
});

// Route pour récupérer le profil étudiant
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [profiles] = await pool.query(`
            SELECT
                sp.*,
                u.email,
                u.nom,
                u.prenom,
                u.onboarding_completed
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE sp.user_id = ?
        `, [userId]);

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profil non trouvé.'
            });
        }

        const profile = profiles[0];

        // Parse JSON fields
        profile.points_forts = JSON.parse(profile.points_forts || '[]');
        profile.points_faibles = JSON.parse(profile.points_faibles || '[]');

        res.json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil.'
        });
    }
});

// Route pour obtenir la liste des matières disponibles
router.get('/matieres', authMiddleware, async (req, res) => {
    try {
        const [matieres] = await pool.query('SELECT * FROM matieres ORDER BY nom');

        // Parse le JSON des années concernées
        const matieresFormatted = matieres.map(m => ({
            ...m,
            annees_concernees: JSON.parse(m.annees_concernees)
        }));

        res.json({
            success: true,
            data: matieresFormatted
        });

    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des matières.'
        });
    }
});

module.exports = router;
