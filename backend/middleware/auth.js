const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware de vérification du token JWT
const authMiddleware = (req, res, next) => {
    try {
        // Récupération du token depuis le header Authorization
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Accès refusé. Aucun token fourni.'
            });
        }

        // Vérification et décodage du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ajout des informations utilisateur à la requête
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré.'
        });
    }
};

module.exports = authMiddleware;
