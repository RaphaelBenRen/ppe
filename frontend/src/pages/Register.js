import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import '../styles/Auth.css';

const Register = ({ setUser }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nom: '',
        prenom: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Effacer l'erreur du champ modifié
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom est requis';
        }

        if (!formData.prenom.trim()) {
            newErrors.prenom = 'Le prénom est requis';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const { confirmPassword, ...registerData } = formData;
            const response = await authAPI.register(registerData);

            if (response.success) {
                // Stockage du token
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data));

                setUser(response.data);

                // Redirection vers l'onboarding
                navigate('/onboarding');
            }
        } catch (err) {
            setErrors({
                general: err.message || 'Erreur lors de l\'inscription'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">ECE</div>
                    <h1 className="auth-title">Inscription</h1>
                    <p className="auth-subtitle">Créez votre compte étudiant ECE</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Nom</label>
                        <input
                            type="text"
                            name="nom"
                            className={`form-input ${errors.nom ? 'error' : ''}`}
                            placeholder="Dupont"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                        />
                        {errors.nom && <div className="error-message">{errors.nom}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Prénom</label>
                        <input
                            type="text"
                            name="prenom"
                            className={`form-input ${errors.prenom ? 'error' : ''}`}
                            placeholder="Jean"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                        />
                        {errors.prenom && <div className="error-message">{errors.prenom}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                            placeholder="votre.email@edu.ece.fr"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && <div className="error-message">{errors.email}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Mot de passe</label>
                        <input
                            type="password"
                            name="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {errors.password && <div className="error-message">{errors.password}</div>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirmer le mot de passe</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                    </div>

                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                </form>

                <div className="auth-link">
                    Vous avez déjà un compte ?
                    <Link to="/login">Se connecter</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
