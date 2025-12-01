const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Génération du token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
};

// Route d'inscription
router.post('/register', async (req, res) => {
    console.log('========== REGISTER REQUEST ==========');
    console.log('Body reçu:', req.body);

    try {
        const { email, password, nom, prenom } = req.body;

        // Validation des champs
        if (!email || !password || !nom || !prenom) {
            console.log('❌ Champs manquants:', { email: !!email, password: !!password, nom: !!nom, prenom: !!prenom });
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis.'
            });
        }

        console.log('✅ Validation OK, vérification email existant...');

        // Vérification si l'utilisateur existe déjà
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        console.log('Résultat check email:', { existingUser, checkError });

        if (existingUser) {
            console.log('❌ Email déjà existant');
            return res.status(400).json({
                success: false,
                message: 'Un compte existe déjà avec cet email.'
            });
        }

        console.log('✅ Email disponible, hashage du mot de passe...');

        // Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Mot de passe hashé');

        // Insertion de l'utilisateur
        console.log('Insertion dans Supabase...');
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email,
                password: hashedPassword,
                nom,
                prenom
            })
            .select()
            .single();

        console.log('Résultat insertion:', { newUser, insertError });

        if (insertError) {
            console.log('❌ Erreur insertion:', insertError);
            throw insertError;
        }

        const userId = newUser.id;
        console.log('✅ Utilisateur créé avec ID:', userId);

        // Génération du token
        const token = generateToken(userId);
        console.log('✅ Token généré');

        res.status(201).json({
            success: true,
            message: 'Inscription réussie !',
            data: {
                user: {
                    id: userId,
                    email,
                    nom,
                    prenom,
                    onboarding_complete: false,
                    has_ai_access: false
                },
                token
            }
        });

        console.log('========== REGISTER SUCCESS ==========');

    } catch (error) {
        console.error('❌ ERREUR REGISTER:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription: ' + error.message
        });
    }
});

// Route de connexion
router.post('/login', async (req, res) => {
    console.log('========== LOGIN REQUEST ==========');
    console.log('Body reçu:', req.body);

    try {
        const { email, password } = req.body;

        // Validation des champs
        if (!email || !password) {
            console.log('❌ Champs manquants');
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis.'
            });
        }

        console.log('✅ Validation OK, recherche utilisateur...');

        // Recherche de l'utilisateur
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, password, nom, prenom, has_ai_access')
            .eq('email', email);

        console.log('Résultat recherche:', { users, error });

        if (error) {
            console.log('❌ Erreur Supabase:', error);
            throw error;
        }

        if (!users || users.length === 0) {
            console.log('❌ Utilisateur non trouvé');
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        const user = users[0];
        console.log('✅ Utilisateur trouvé:', user.email);

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Vérification mot de passe:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Mot de passe invalide');
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        console.log('✅ Mot de passe valide');

        // Génération du token
        const token = generateToken(user.id);
        console.log('✅ Token généré');

        res.json({
            success: true,
            message: 'Connexion réussie !',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    onboarding_complete: true,
                    has_ai_access: user.has_ai_access || false
                },
                token
            }
        });

        console.log('========== LOGIN SUCCESS ==========');

    } catch (error) {
        console.error('❌ ERREUR LOGIN:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion: ' + error.message
        });
    }
});

// Route pour supprimer le compte (requis par Apple pour l'App Store)
router.delete('/delete-account', authMiddleware, async (req, res) => {
    console.log('========== DELETE ACCOUNT REQUEST ==========');
    console.log('User ID:', req.user?.userId);

    try {
        const userId = req.user.userId;

        // Supprimer toutes les données de l'utilisateur dans l'ordre (contraintes FK)

        // 1. Supprimer les tentatives de QCM
        const { error: attemptsError } = await supabase
            .from('qcm_attempts')
            .delete()
            .eq('user_id', userId);
        if (attemptsError) console.log('Erreur suppression attempts:', attemptsError);

        // 2. Supprimer les QCMs
        const { error: qcmError } = await supabase
            .from('qcms')
            .delete()
            .eq('user_id', userId);
        if (qcmError) console.log('Erreur suppression QCMs:', qcmError);

        // 3. Supprimer les flashcards
        const { error: flashcardsError } = await supabase
            .from('flashcards')
            .delete()
            .eq('user_id', userId);
        if (flashcardsError) console.log('Erreur suppression flashcards:', flashcardsError);

        // 4. Supprimer les cours
        const { error: coursesError } = await supabase
            .from('courses')
            .delete()
            .eq('uploaded_by', userId);
        if (coursesError) console.log('Erreur suppression cours:', coursesError);

        // 6. Supprimer student_profiles
        const { error: studentProfileError } = await supabase
            .from('student_profiles')
            .delete()
            .eq('user_id', userId);
        if (studentProfileError) console.log('Erreur suppression student_profiles:', studentProfileError);

        // 7. Supprimer l'utilisateur
        const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.log('❌ Erreur suppression utilisateur:', userError);
            throw userError;
        }

        console.log('✅ Compte supprimé avec succès');

        res.json({
            success: true,
            message: 'Votre compte et toutes vos données ont été supprimés.'
        });

    } catch (error) {
        console.error('❌ ERREUR DELETE ACCOUNT:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du compte: ' + error.message
        });
    }
});

// Route pour modifier le mot de passe
router.put('/change-password', authMiddleware, async (req, res) => {
    console.log('========== CHANGE PASSWORD REQUEST ==========');

    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel et nouveau mot de passe requis.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
            });
        }

        // Récupérer l'utilisateur
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('password')
            .eq('id', userId);

        if (fetchError) throw fetchError;

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        // Vérifier le mot de passe actuel
        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect.'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', userId);

        if (updateError) throw updateError;

        console.log('✅ Mot de passe modifié avec succès');

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès !'
        });

    } catch (error) {
        console.error('❌ ERREUR CHANGE PASSWORD:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du mot de passe.'
        });
    }
});

// Route pour vérifier le token
router.get('/verify', authMiddleware, async (req, res) => {
    console.log('========== VERIFY REQUEST ==========');
    console.log('User ID from token:', req.user?.userId);

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, nom, prenom, has_ai_access')
            .eq('id', req.user.userId);

        console.log('Résultat recherche:', { users, error });

        if (error) throw error;

        if (!users || users.length === 0) {
            console.log('❌ Utilisateur non trouvé');
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        const user = users[0];
        console.log('✅ Utilisateur vérifié:', user.email);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    onboarding_complete: true,
                    has_ai_access: user.has_ai_access || false
                }
            }
        });

    } catch (error) {
        console.error('❌ ERREUR VERIFY:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification.'
        });
    }
});

// Route pour valider un code d'accès IA
router.post('/redeem-code', authMiddleware, async (req, res) => {
    console.log('========== REDEEM CODE REQUEST ==========');

    try {
        const userId = req.user.userId;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code requis.'
            });
        }

        const codeUpper = code.toUpperCase().trim();

        // Vérifier si l'utilisateur a déjà l'accès IA
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('has_ai_access')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (userData?.has_ai_access) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà accès aux fonctionnalités IA.'
            });
        }

        // Rechercher le code
        const { data: accessCode, error: codeError } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', codeUpper)
            .single();

        if (codeError || !accessCode) {
            return res.status(404).json({
                success: false,
                message: 'Code invalide.'
            });
        }

        // Vérifier si le code est actif
        if (!accessCode.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Ce code n\'est plus actif.'
            });
        }

        // Vérifier si le code n'a pas expiré
        if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ce code a expiré.'
            });
        }

        // Vérifier si le code n'a pas atteint son max d'utilisations
        if (accessCode.max_uses && accessCode.current_uses >= accessCode.max_uses) {
            return res.status(400).json({
                success: false,
                message: 'Ce code a atteint son nombre maximum d\'utilisations.'
            });
        }

        // Vérifier si l'utilisateur n'a pas déjà utilisé ce code
        const { data: existingRedemption } = await supabase
            .from('code_redemptions')
            .select('id')
            .eq('user_id', userId)
            .eq('code_id', accessCode.id)
            .single();

        if (existingRedemption) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà utilisé ce code.'
            });
        }

        // Tout est OK, activer l'accès IA pour l'utilisateur
        const { error: updateUserError } = await supabase
            .from('users')
            .update({ has_ai_access: true })
            .eq('id', userId);

        if (updateUserError) throw updateUserError;

        // Enregistrer l'utilisation du code
        const { error: redemptionError } = await supabase
            .from('code_redemptions')
            .insert({
                user_id: userId,
                code_id: accessCode.id
            });

        if (redemptionError) throw redemptionError;

        // Incrémenter le compteur d'utilisations
        const { error: updateCodeError } = await supabase
            .from('access_codes')
            .update({ current_uses: accessCode.current_uses + 1 })
            .eq('id', accessCode.id);

        if (updateCodeError) console.log('Erreur update compteur:', updateCodeError);

        console.log('✅ Code validé avec succès pour user:', userId);

        res.json({
            success: true,
            message: 'Code validé ! Vous avez maintenant accès aux fonctionnalités IA.',
            data: {
                has_ai_access: true
            }
        });

    } catch (error) {
        console.error('❌ ERREUR REDEEM CODE:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation du code.'
        });
    }
});

// Route pour vérifier le statut d'accès IA
router.get('/ai-access-status', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('has_ai_access')
            .eq('id', req.user.userId)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                has_ai_access: user?.has_ai_access || false
            }
        });

    } catch (error) {
        console.error('❌ ERREUR AI ACCESS STATUS:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification.'
        });
    }
});

module.exports = router;
