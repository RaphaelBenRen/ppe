-- Base de données PPE - Plateforme ECE

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email)
);

-- Table des profils étudiants (données d'onboarding)
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    annee_etude ENUM('Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5') NOT NULL,
    majeure VARCHAR(100) NULL, -- Seulement pour Ing4 et Ing5
    points_forts TEXT NULL, -- JSON array des matières fortes
    points_faibles TEXT NULL, -- JSON array des matières faibles
    objectifs_apprentissage TEXT NULL, -- Objectifs de l'étudiant
    preferences_difficulte ENUM('facile', 'moyen', 'difficile', 'mixte') DEFAULT 'moyen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_annee (annee_etude)
);

-- Table des cours uploadés
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    annee_cible ENUM('Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5') NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    type_document ENUM('cours', 'annale', 'td', 'tp', 'resume') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- pdf, docx, etc.
    uploaded_by INT NOT NULL,
    chroma_collection_id VARCHAR(255), -- ID de la collection ChromaDB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_annee_matiere (annee_cible, matiere),
    INDEX idx_matiere (matiere),
    INDEX idx_type (type_document)
);

-- Table des QCMs générés
CREATE TABLE IF NOT EXISTS qcms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    annee_cible ENUM('Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5') NOT NULL,
    difficulte ENUM('facile', 'moyen', 'difficile') NOT NULL,
    nombre_questions INT NOT NULL,
    questions_data JSON NOT NULL, -- Stockage JSON des questions
    score INT NULL, -- Score obtenu (si complété)
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_matiere (user_id, matiere),
    INDEX idx_completed (completed)
);

-- Table des flashcards générées
CREATE TABLE IF NOT EXISTS flashcards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    matiere VARCHAR(100) NOT NULL,
    annee_cible ENUM('Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5') NOT NULL,
    cards_data JSON NOT NULL, -- Stockage JSON des flashcards
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_matiere (user_id, matiere)
);

-- Table de progression des flashcards (spaced repetition)
CREATE TABLE IF NOT EXISTS flashcard_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    flashcard_id INT NOT NULL,
    card_index INT NOT NULL, -- Index de la carte dans le set
    niveau_maitrise INT DEFAULT 0, -- 0-5 pour spaced repetition
    derniere_revision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prochaine_revision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nombre_revisions INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_card (user_id, flashcard_id, card_index),
    INDEX idx_next_review (user_id, prochaine_revision)
);

-- Table des matières disponibles
CREATE TABLE IF NOT EXISTS matieres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    annees_concernees JSON NOT NULL, -- ["Ing1", "Ing2", etc.]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des matières de base ECE
INSERT INTO matieres (nom, description, annees_concernees) VALUES
('Mathématiques', 'Algèbre, Analyse, Probabilités', '["Ing1", "Ing2", "Ing3", "Ing4", "Ing5"]'),
('Physique', 'Physique générale et appliquée', '["Ing1", "Ing2", "Ing3"]'),
('Informatique', 'Programmation, Algorithmes, Bases de données', '["Ing1", "Ing2", "Ing3", "Ing4", "Ing5"]'),
('Électronique', 'Circuits, Composants, Systèmes embarqués', '["Ing1", "Ing2", "Ing3", "Ing4", "Ing5"]'),
('Réseaux', 'Réseaux informatiques et télécommunications', '["Ing2", "Ing3", "Ing4", "Ing5"]'),
('Signal', 'Traitement du signal', '["Ing2", "Ing3", "Ing4"]'),
('Anglais', 'Anglais technique et professionnel', '["Ing1", "Ing2", "Ing3", "Ing4", "Ing5"]'),
('Gestion de projet', 'Management de projet', '["Ing3", "Ing4", "Ing5"]'),
('Intelligence Artificielle', 'Machine Learning, Deep Learning', '["Ing3", "Ing4", "Ing5"]'),
('Cybersécurité', 'Sécurité des systèmes et réseaux', '["Ing3", "Ing4", "Ing5"]');
