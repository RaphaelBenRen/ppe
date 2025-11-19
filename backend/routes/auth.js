const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Génération du token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token valide 7 jours
    );
};

// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, nom, prenom } = req.body;

        // Validation des champs
        if (!email || !password || !nom || !prenom) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis.'
            });
        }

        // Validation email ECE (optionnel)
        // if (!email.endsWith('@edu.ece.fr')) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Veuillez utiliser votre email ECE (@edu.ece.fr).'
        //     });
        // }

        // Vérification si l'utilisateur existe déjà
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Un compte existe déjà avec cet email.'
            });
        }

        // Hashage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertion de l'utilisateur
        const [result] = await pool.query(
            'INSERT INTO users (email, password, nom, prenom) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, nom, prenom]
        );

        const userId = result.insertId;

        // Génération du token
        const token = generateToken(userId);

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

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription.'
        });
    }
});

// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des champs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis.'
            });
        }

        // Recherche de l'utilisateur
        const [users] = await pool.query(
            'SELECT id, email, password, nom, prenom, onboarding_completed FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        const user = users[0];

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        // Génération du token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'Connexion réussie !',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    onboarding_complete: user.onboarding_completed
                },
                token
            }
        });

    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion.'
        });
    }
});

// Route pour vérifier le token (utilisé au chargement de l'app)
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, email, nom, prenom, onboarding_completed FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    nom: user.nom,
                    prenom: user.prenom,
                    onboarding_complete: user.onboarding_completed
                }
            }
        });

    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification.'
        });
    }
});

module.exports = router;
