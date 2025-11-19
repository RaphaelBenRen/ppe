import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingAPI } from '../utils/api';
import '../styles/Auth.css';

const Onboarding = ({ user }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [matieres, setMatieres] = useState([]);

    const [formData, setFormData] = useState({
        annee_etude: '',
        majeure: '',
        points_forts: [],
        points_faibles: [],
        objectifs_apprentissage: '',
        preferences_difficulte: 'moyen'
    });

    // Charger les matières disponibles
    useEffect(() => {
        const loadMatieres = async () => {
            try {
                const response = await onboardingAPI.getMatieres();
                if (response.success) {
                    setMatieres(response.data);
                }
            } catch (error) {
                console.error('Erreur chargement matières:', error);
            }
        };
        loadMatieres();
    }, []);

    // Configuration des étapes
    const steps = [
        {
            title: "Quelle est votre année d'études ?",
            description: "Sélectionnez votre niveau actuel à l'ECE",
            component: StepAnnee
        },
        {
            title: formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5'
                ? "Quelle est votre majeure ?"
                : "Quelles sont vos points forts ?",
            description: formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5'
                ? "Sélectionnez votre spécialisation"
                : "Choisissez les matières que vous maîtrisez bien",
            component: (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5')
                ? StepMajeure
                : StepPointsForts
        },
        {
            title: (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5')
                ? "Quelles sont vos points forts ?"
                : "Quelles sont vos points faibles ?",
            description: (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5')
                ? "Choisissez les matières que vous maîtrisez bien"
                : "Choisissez les matières à améliorer",
            component: (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5')
                ? StepPointsForts
                : StepPointsFaibles
        },
        {
            title: "Vos objectifs d'apprentissage",
            description: "Qu'aimeriez-vous améliorer cette année ?",
            component: StepObjectifs
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await onboardingAPI.complete(formData);
            if (response.success) {
                // Mettre à jour l'utilisateur local
                const updatedUser = {
                    ...user,
                    onboardingCompleted: true
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Rediriger vers le dashboard
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Erreur onboarding:', error);
            alert('Erreur lors de l\'enregistrement de votre profil');
        } finally {
            setLoading(false);
        }
    };

    const StepComponent = steps[currentStep].component;

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                {/* Barre de progression */}
                <div className="onboarding-progress">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-step ${
                                index === currentStep ? 'active' : ''
                            } ${index < currentStep ? 'completed' : ''}`}
                        >
                            {index < currentStep ? '✓' : index + 1}
                        </div>
                    ))}
                </div>

                {/* Contenu de l'étape */}
                <div className="onboarding-step">
                    <h2 className="step-title">{steps[currentStep].title}</h2>
                    <p className="step-description">{steps[currentStep].description}</p>

                    <StepComponent
                        formData={formData}
                        setFormData={setFormData}
                        matieres={matieres}
                    />
                </div>

                {/* Boutons de navigation */}
                <div className="form-buttons">
                    {currentStep > 0 && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleBack}
                        >
                            Retour
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleNext}
                        disabled={loading || !canProceed(formData, currentStep)}
                    >
                        {loading
                            ? 'Enregistrement...'
                            : currentStep === steps.length - 1
                            ? 'Terminer'
                            : 'Suivant'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Étape 1: Sélection de l'année
const StepAnnee = ({ formData, setFormData }) => {
    const annees = [
        { value: 'Ing1', icon: '1️⃣', label: 'Ing 1' },
        { value: 'Ing2', icon: '2️⃣', label: 'Ing 2' },
        { value: 'Ing3', icon: '3️⃣', label: 'Ing 3' },
        { value: 'Ing4', icon: '4️⃣', label: 'Ing 4' },
        { value: 'Ing5', icon: '5️⃣', label: 'Ing 5' }
    ];

    return (
        <div className="select-grid">
            {annees.map((annee) => (
                <div
                    key={annee.value}
                    className={`select-card ${formData.annee_etude === annee.value ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, annee_etude: annee.value })}
                >
                    <div className="select-card-icon">{annee.icon}</div>
                    <div className="select-card-title">{annee.label}</div>
                </div>
            ))}
        </div>
    );
};

// Étape 2a: Sélection de la majeure (pour Ing4 et Ing5)
const StepMajeure = ({ formData, setFormData }) => {
    const majeures = [
        { value: 'Informatique', icon: '💻' },
        { value: 'Systèmes Embarqués', icon: '🔧' },
        { value: 'Réseaux & Cybersécurité', icon: '🔒' },
        { value: 'Data Science & IA', icon: '🤖' },
        { value: 'Énergie & Environnement', icon: '⚡' },
        { value: 'Autre', icon: '📚' }
    ];

    return (
        <div className="select-grid">
            {majeures.map((majeure) => (
                <div
                    key={majeure.value}
                    className={`select-card ${formData.majeure === majeure.value ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, majeure: majeure.value })}
                >
                    <div className="select-card-icon">{majeure.icon}</div>
                    <div className="select-card-title">{majeure.value}</div>
                </div>
            ))}
        </div>
    );
};

// Étape 2b/3a: Points forts
const StepPointsForts = ({ formData, setFormData, matieres }) => {
    const toggleMatiere = (matiere) => {
        const isSelected = formData.points_forts.includes(matiere);
        setFormData({
            ...formData,
            points_forts: isSelected
                ? formData.points_forts.filter(m => m !== matiere)
                : [...formData.points_forts, matiere]
        });
    };

    // Filtrer les matières selon l'année
    const matieresDisponibles = matieres.filter(m =>
        m.annees_concernees.includes(formData.annee_etude)
    );

    return (
        <div>
            <p style={{ marginBottom: '15px', color: '#718096' }}>
                Sélectionnez au moins une matière
            </p>
            <div className="chips-container">
                {matieresDisponibles.map((matiere) => (
                    <div
                        key={matiere.id}
                        className={`chip ${formData.points_forts.includes(matiere.nom) ? 'selected' : ''}`}
                        onClick={() => toggleMatiere(matiere.nom)}
                    >
                        {matiere.nom}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Étape 3b/4: Points faibles
const StepPointsFaibles = ({ formData, setFormData, matieres }) => {
    const toggleMatiere = (matiere) => {
        const isSelected = formData.points_faibles.includes(matiere);
        setFormData({
            ...formData,
            points_faibles: isSelected
                ? formData.points_faibles.filter(m => m !== matiere)
                : [...formData.points_faibles, matiere]
        });
    };

    // Filtrer les matières selon l'année
    const matieresDisponibles = matieres.filter(m =>
        m.annees_concernees.includes(formData.annee_etude)
    );

    return (
        <div>
            <p style={{ marginBottom: '15px', color: '#718096' }}>
                Sélectionnez les matières à améliorer (optionnel)
            </p>
            <div className="chips-container">
                {matieresDisponibles.map((matiere) => (
                    <div
                        key={matiere.id}
                        className={`chip ${formData.points_faibles.includes(matiere.nom) ? 'selected' : ''}`}
                        onClick={() => toggleMatiere(matiere.nom)}
                    >
                        {matiere.nom}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Étape finale: Objectifs
const StepObjectifs = ({ formData, setFormData }) => {
    return (
        <div>
            <div className="form-group">
                <label className="form-label">Vos objectifs d'apprentissage (optionnel)</label>
                <textarea
                    className="form-input textarea"
                    placeholder="Ex: Améliorer mes compétences en programmation, préparer mes examens, approfondir mes connaissances en IA..."
                    value={formData.objectifs_apprentissage}
                    onChange={(e) => setFormData({ ...formData, objectifs_apprentissage: e.target.value })}
                />
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">Niveau de difficulté préféré</label>
                <div className="select-grid">
                    {[
                        { value: 'facile', icon: '😊', label: 'Facile' },
                        { value: 'moyen', icon: '😐', label: 'Moyen' },
                        { value: 'difficile', icon: '😤', label: 'Difficile' },
                        { value: 'mixte', icon: '🎯', label: 'Mixte' }
                    ].map((niveau) => (
                        <div
                            key={niveau.value}
                            className={`select-card ${formData.preferences_difficulte === niveau.value ? 'selected' : ''}`}
                            onClick={() => setFormData({ ...formData, preferences_difficulte: niveau.value })}
                        >
                            <div className="select-card-icon">{niveau.icon}</div>
                            <div className="select-card-title">{niveau.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Fonction pour vérifier si on peut passer à l'étape suivante
const canProceed = (formData, currentStep) => {
    switch (currentStep) {
        case 0:
            return formData.annee_etude !== '';
        case 1:
            if (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5') {
                return formData.majeure !== '';
            }
            return formData.points_forts.length > 0;
        case 2:
            if (formData.annee_etude === 'Ing4' || formData.annee_etude === 'Ing5') {
                return formData.points_forts.length > 0;
            }
            return true; // Points faibles optionnel
        case 3:
            return true; // Objectifs optionnel
        default:
            return true;
    }
};

export default Onboarding;
