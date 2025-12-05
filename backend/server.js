const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const coursesRoutes = require('./routes/courses');
const qcmRoutes = require('./routes/qcm');
const flashcardsRoutes = require('./routes/flashcards');
const summariesRoutes = require('./routes/summaries');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ extended: true, limit: '50gb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/qcm', qcmRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/summaries', summariesRoutes);

// Route de test
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API PPE ECE - Serveur opérationnel',
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Test de la connexion à la base de données
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Impossible de se connecter à la base de données');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`📍 API disponible sur http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
