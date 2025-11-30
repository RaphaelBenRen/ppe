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
                    onboarding_complete: false
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
            .select('id, email, password, nom, prenom')
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
                    onboarding_complete: true
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

// Route pour vérifier le token
router.get('/verify', authMiddleware, async (req, res) => {
    console.log('========== VERIFY REQUEST ==========');
    console.log('User ID from token:', req.user?.userId);

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, nom, prenom')
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
                    onboarding_complete: true
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

module.exports = router;
