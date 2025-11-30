-- ========================================
-- Schema Supabase pour PPE ECE
-- Base de données PostgreSQL
-- ========================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Table des utilisateurs
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role VARCHAR(20) DEFAULT 'etudiant' CHECK (role IN ('etudiant', 'professeur', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- Table des cours
-- ========================================
CREATE TABLE IF NOT EXISTS cours (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    fichier_url TEXT,
    fichier_nom VARCHAR(255),
    contenu_extrait TEXT,
    matiere VARCHAR(100),
    niveau VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_cours_user ON cours(user_id);

-- ========================================
-- Table des QCMs
-- ========================================
CREATE TABLE IF NOT EXISTS qcms (
    id SERIAL PRIMARY KEY,
    cours_id INTEGER REFERENCES cours(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    questions_data JSONB NOT NULL DEFAULT '[]',
    nombre_questions INTEGER DEFAULT 0,
    difficulte VARCHAR(20) DEFAULT 'moyen' CHECK (difficulte IN ('facile', 'moyen', 'difficile')),
    score INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_qcms_user ON qcms(user_id);
CREATE INDEX IF NOT EXISTS idx_qcms_cours ON qcms(cours_id);

-- ========================================
-- Table des tentatives de QCM (historique)
-- ========================================
CREATE TABLE IF NOT EXISTS qcm_attempts (
    id SERIAL PRIMARY KEY,
    qcm_id INTEGER NOT NULL REFERENCES qcms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers_data JSONB NOT NULL,
    score INTEGER NOT NULL,
    pourcentage DECIMAL(5,2) NOT NULL,
    nombre_correctes INTEGER NOT NULL,
    nombre_incorrectes INTEGER NOT NULL,
    temps_ecoule INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches d'historique
CREATE INDEX IF NOT EXISTS idx_qcm_attempts_qcm_user ON qcm_attempts(qcm_id, user_id);
CREATE INDEX IF NOT EXISTS idx_qcm_attempts_user_date ON qcm_attempts(user_id, completed_at);

-- ========================================
-- Table des flashcards
-- ========================================
CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    cours_id INTEGER REFERENCES cours(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    cards_data JSONB NOT NULL DEFAULT '[]',
    nombre_cartes INTEGER DEFAULT 0,
    derniere_revision TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_flashcards_user ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_cours ON flashcards(cours_id);

-- ========================================
-- Table des sessions d'étude
-- ========================================
CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type_session VARCHAR(20) NOT NULL CHECK (type_session IN ('qcm', 'flashcard', 'cours')),
    reference_id INTEGER,
    duree_minutes INTEGER,
    score INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(created_at);

-- ========================================
-- Fonction pour mettre à jour updated_at automatiquement
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cours_updated_at ON cours;
CREATE TRIGGER update_cours_updated_at
    BEFORE UPDATE ON cours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_qcms_updated_at ON qcms;
CREATE TRIGGER update_qcms_updated_at
    BEFORE UPDATE ON qcms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flashcards_updated_at ON flashcards;
CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS) - Optionnel mais recommandé
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcms ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour les utilisateurs (accès à ses propres données)
-- Note: Ces politiques sont basiques, ajustez selon vos besoins

-- Pour le moment, on permet tout accès (à sécuriser plus tard avec auth Supabase)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for cours" ON cours FOR ALL USING (true);
CREATE POLICY "Allow all for qcms" ON qcms FOR ALL USING (true);
CREATE POLICY "Allow all for qcm_attempts" ON qcm_attempts FOR ALL USING (true);
CREATE POLICY "Allow all for flashcards" ON flashcards FOR ALL USING (true);
CREATE POLICY "Allow all for study_sessions" ON study_sessions FOR ALL USING (true);

-- ========================================
-- Données de test (optionnel)
-- ========================================
-- INSERT INTO users (email, password, nom, prenom, role)
-- VALUES ('test@test.com', '$2b$10$hashedpassword', 'Test', 'User', 'etudiant');
