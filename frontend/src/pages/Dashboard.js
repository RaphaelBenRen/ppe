import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '30px',
                color: 'white',
                marginBottom: '30px'
            }}>
                <h1 style={{ margin: 0, marginBottom: '10px' }}>
                    Bienvenue, {user?.prenom} {user?.nom} ! 👋
                </h1>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Votre espace d'apprentissage personnalisé ECE
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📝</div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Générer un QCM</h3>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                        Créez des QCMs personnalisés à partir de vos cours
                    </p>
                </div>

                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>🗂️</div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Flashcards</h3>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                        Révisez avec des flashcards générées par IA
                    </p>
                </div>

                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📚</div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Mes Cours</h3>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                        Consultez et uploadez vos cours
                    </p>
                </div>

                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📊</div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Statistiques</h3>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                        Suivez votre progression
                    </p>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '12px 24px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        color: '#4a5568'
                    }}
                >
                    Déconnexion
                </button>
            </div>

            <div style={{
                marginTop: '40px',
                padding: '20px',
                background: '#f7fafc',
                borderRadius: '15px',
                fontSize: '14px',
                color: '#718096'
            }}>
                <p style={{ margin: 0 }}>
                    ℹ️ <strong>Note:</strong> Le dashboard complet avec toutes les fonctionnalités sera développé dans les prochaines étapes.
                    Pour l'instant, vous pouvez vous déconnecter et tester à nouveau le processus d'inscription/connexion/onboarding.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
