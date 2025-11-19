-- Migration: Add qcm_attempts table for QCM history tracking
-- Date: 2025-11-19
-- Description: Creates the qcm_attempts table to store historical attempts of QCMs

-- Create the qcm_attempts table
CREATE TABLE IF NOT EXISTS qcm_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    qcm_id INT NOT NULL,
    user_id INT NOT NULL,
    answers_data JSON NOT NULL,
    score INT NOT NULL,
    pourcentage DECIMAL(5,2) NOT NULL,
    nombre_correctes INT NOT NULL,
    nombre_incorrectes INT NOT NULL,
    temps_ecoule INT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qcm_id) REFERENCES qcms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_qcm_user (qcm_id, user_id),
    INDEX idx_user_date (user_id, completed_at)
);
