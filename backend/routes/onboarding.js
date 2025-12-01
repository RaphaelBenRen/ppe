const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
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

        // Vérifier si un profil existe déjà
        const { data: existing, error: checkError } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('user_id', userId);

        if (checkError) throw checkError;

        const profileData = {
            user_id: userId,
            annee_etude,
            majeure: majeure || null,
            points_forts: points_forts || [],
            points_faibles: points_faibles || [],
            objectifs_apprentissage: objectifs_apprentissage || null,
            preferences_difficulte: preferences_difficulte || 'moyen'
        };

        if (existing && existing.length > 0) {
            // Mise à jour
            const { error: updateError } = await supabase
                .from('student_profiles')
                .update(profileData)
                .eq('user_id', userId);

            if (updateError) throw updateError;
        } else {
            // Insertion
            const { error: insertError } = await supabase
                .from('student_profiles')
                .insert(profileData);

            if (insertError) throw insertError;
        }

        // Marquer l'onboarding comme complété
        const { error: userUpdateError } = await supabase
            .from('users')
            .update({ onboarding_completed: true })
            .eq('id', userId);

        if (userUpdateError) throw userUpdateError;

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

        const { data: profiles, error } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profil non trouvé.'
            });
        }

        const profile = profiles[0];

        // Récupérer les infos utilisateur
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('email, nom, prenom')
            .eq('id', userId);

        if (userError) throw userError;

        const user = users[0];

        res.json({
            success: true,
            data: {
                ...profile,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom
            }
        });

    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil.'
        });
    }
});

// Route pour modifier le profil utilisateur (nom, prénom, année)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { nom, prenom, annee_etude, majeure } = req.body;

        // Mise à jour des infos utilisateur (nom, prénom)
        if (nom || prenom) {
            const userUpdate = {};
            if (nom) userUpdate.nom = nom;
            if (prenom) userUpdate.prenom = prenom;

            const { error: userError } = await supabase
                .from('users')
                .update(userUpdate)
                .eq('id', userId);

            if (userError) throw userError;
        }

        // Mise à jour du profil étudiant (année, majeure)
        if (annee_etude || majeure) {
            const profileUpdate = {};
            if (annee_etude) profileUpdate.annee_etude = annee_etude;
            if (majeure !== undefined) profileUpdate.majeure = majeure;

            const { error: profileError } = await supabase
                .from('student_profiles')
                .update(profileUpdate)
                .eq('user_id', userId);

            if (profileError) throw profileError;
        }

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès !'
        });

    } catch (error) {
        console.error('Erreur modification profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du profil.'
        });
    }
});

// Route pour obtenir la liste des matières disponibles
router.get('/matieres', authMiddleware, async (req, res) => {
    try {
        const { data: matieres, error } = await supabase
            .from('matieres')
            .select('*')
            .order('nom');

        if (error) throw error;

        res.json({
            success: true,
            data: matieres || []
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
