import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const DashboardNew = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showQCMModal, setShowQCMModal] = useState(false);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [generatedQCM, setGeneratedQCM] = useState(null);
    const [generatedFlashcards, setGeneratedFlashcards] = useState(null);

    // États pour l'upload
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        titre: '',
        description: '',
        matiere: '',
        annee_cible: user?.onboardingCompleted ? '' : 'Ing1',
        type_document: 'cours'
    });

    // États pour la génération
    const [qcmOptions, setQcmOptions] = useState({
        nombreQuestions: 10,
        difficulte: 'moyen'
    });

    const [flashcardOptions, setFlashcardOptions] = useState({
        nombreCartes: 20
    });

    useEffect(() => {
        loadCourses();
    }, []);

    // Charger les cours
    const loadCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/courses/my-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCourses(response.data.data);
            }
        } catch (error) {
            console.error('Erreur chargement cours:', error);
        }
    };

    // Upload de fichier
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadFile(file);

            // Auto-upload avec valeurs par défaut
            const defaultData = {
                titre: file.name.replace(/\.[^/.]+$/, ''),
                description: '',
                matiere: 'Informatique', // Par défaut
                annee_cible: 'Ing3', // Par défaut
                type_document: 'cours'
            };

            setUploadData(defaultData);

            // Upload automatique
            await uploadCourse(file, defaultData);
        }
    };

    // Fonction d'upload séparée
    const uploadCourse = async (file, data) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('titre', data.titre);
            formData.append('description', data.description);
            formData.append('matiere', data.matiere);
            formData.append('annee_cible', data.annee_cible);
            formData.append('type_document', data.type_document);

            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/courses/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                alert('✅ Cours uploadé avec succès !');
                // Reset
                setUploadFile(null);
                setUploadData({
                    titre: '',
                    description: '',
                    matiere: 'Informatique',
                    annee_cible: 'Ing3',
                    type_document: 'cours'
                });
                document.getElementById('file-input').value = '';
                // Recharger les cours
                loadCourses();
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            alert(error.response?.data?.message || 'Erreur lors de l\'upload');
        } finally {
            setLoading(false);
        }
    };


    // Générer un QCM
    const handleGenerateQCM = async (course) => {
        setSelectedCourse(course);
        setShowQCMModal(true);
        setGeneratedQCM(null);
    };

    const submitQCMGeneration = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/qcm/generate-from-course/${selectedCourse.id}`,
                qcmOptions,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setGeneratedQCM(response.data.data);
                alert('QCM généré avec succès ! 🎉');
            }
        } catch (error) {
            console.error('Erreur génération QCM:', error);
            alert(error.response?.data?.message || 'Erreur lors de la génération');
        } finally {
            setLoading(false);
        }
    };

    // Générer des flashcards
    const handleGenerateFlashcards = async (course) => {
        setSelectedCourse(course);
        setShowFlashcardsModal(true);
        setGeneratedFlashcards(null);
    };

    const submitFlashcardsGeneration = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/flashcards/generate-from-course/${selectedCourse.id}`,
                flashcardOptions,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setGeneratedFlashcards(response.data.data);
                alert('Flashcards générées avec succès ! 🎉');
            }
        } catch (error) {
            console.error('Erreur génération flashcards:', error);
            alert(error.response?.data?.message || 'Erreur lors de la génération');
        } finally {
            setLoading(false);
        }
    };

    // Supprimer un cours
    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Cours supprimé');
            loadCourses();
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <h1>Bienvenue, {user?.prenom} ! 👋</h1>
                        <p>Votre plateforme d'apprentissage personnalisée ECE</p>
                    </div>
                    <div className="header-actions">
                        <button onClick={handleLogout}>Déconnexion</button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="dashboard-content">
                <div className="sections-grid">
                    {/* Section Upload */}
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-icon">📚</div>
                            <div className="section-title">
                                <h2>Uploader un cours</h2>
                                <p>PDF, DOCX, TXT acceptés</p>
                            </div>
                        </div>

                        <div className="upload-zone" onClick={() => document.getElementById('file-input').click()}>
                            <div className="upload-icon">📤</div>
                            <div className="upload-text">
                                <h3>{uploadFile ? uploadFile.name : 'Cliquez pour sélectionner un fichier'}</h3>
                                <p>ou glissez-déposez ici</p>
                            </div>
                        </div>

                        <input
                            id="file-input"
                            type="file"
                            className="upload-input"
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={handleFileChange}
                        />

                        {loading && (
                            <div className="loading-spinner" style={{ marginTop: '20px' }}>
                                <div className="spinner"></div>
                                <p>Upload en cours...</p>
                            </div>
                        )}
                    </div>

                    {/* Section Mes cours */}
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-icon">📖</div>
                            <div className="section-title">
                                <h2>Mes cours</h2>
                                <p>{courses.length} cours uploadés</p>
                            </div>
                        </div>

                        <div className="course-list">
                            {courses.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📭</div>
                                    <p>Aucun cours pour le moment.<br />Uploadez votre premier cours !</p>
                                </div>
                            ) : (
                                courses.map(course => (
                                    <div key={course.id} className="course-item">
                                        <div className="course-info">
                                            <h4>{course.titre}</h4>
                                            <p>{course.matiere} • {course.annee_cible} • {course.type_document}</p>
                                        </div>
                                        <div className="course-actions">
                                            <button
                                                className="btn-small btn-primary-small"
                                                onClick={() => handleGenerateQCM(course)}
                                            >
                                                QCM
                                            </button>
                                            <button
                                                className="btn-small btn-secondary-small"
                                                onClick={() => handleGenerateFlashcards(course)}
                                            >
                                                Flash
                                            </button>
                                            <button
                                                className="btn-small btn-danger-small"
                                                onClick={() => handleDeleteCourse(course.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal QCM */}
            {showQCMModal && (
                <div className="modal-overlay" onClick={() => setShowQCMModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Générer un QCM</h2>
                            <button className="close-btn" onClick={() => setShowQCMModal(false)}>×</button>
                        </div>

                        {!generatedQCM ? (
                            <div className="generation-options">
                                <p><strong>Cours :</strong> {selectedCourse?.titre}</p>

                                <div className="form-group">
                                    <label className="form-label">Nombre de questions</label>
                                    <select
                                        className="form-input"
                                        value={qcmOptions.nombreQuestions}
                                        onChange={(e) => setQcmOptions({ ...qcmOptions, nombreQuestions: e.target.value })}
                                    >
                                        <option value="5">5 questions</option>
                                        <option value="10">10 questions</option>
                                        <option value="15">15 questions</option>
                                        <option value="20">20 questions</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Difficulté</label>
                                    <select
                                        className="form-input"
                                        value={qcmOptions.difficulte}
                                        onChange={(e) => setQcmOptions({ ...qcmOptions, difficulte: e.target.value })}
                                    >
                                        <option value="facile">Facile</option>
                                        <option value="moyen">Moyen</option>
                                        <option value="difficile">Difficile</option>
                                    </select>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={submitQCMGeneration}
                                    disabled={loading}
                                >
                                    {loading ? 'Génération en cours...' : 'Générer le QCM avec IA'}
                                </button>

                                {loading && (
                                    <div className="loading-spinner">
                                        <div className="spinner"></div>
                                        <p>Claude génère votre QCM personnalisé...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="qcm-preview">
                                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#48bb78', fontWeight: '600' }}>
                                    ✅ QCM généré avec succès ! ({generatedQCM.nombreQuestions} questions)
                                </p>

                                {generatedQCM.questions.slice(0, 3).map((q, index) => (
                                    <div key={index} className="question-item">
                                        <div className="question-header">
                                            <span className="question-number">Question {index + 1}</span>
                                            <span className="question-difficulty">{q.difficulty}</span>
                                        </div>
                                        <div className="question-text">{q.question}</div>
                                        <div className="question-options">
                                            {Object.entries(q.options).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className={`option-item ${key === q.correct_answer ? 'correct' : ''}`}
                                                >
                                                    {key}) {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {generatedQCM.questions.length > 3 && (
                                    <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                                        ... et {generatedQCM.questions.length - 3} autres questions
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Flashcards */}
            {showFlashcardsModal && (
                <div className="modal-overlay" onClick={() => setShowFlashcardsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Générer des Flashcards</h2>
                            <button className="close-btn" onClick={() => setShowFlashcardsModal(false)}>×</button>
                        </div>

                        {!generatedFlashcards ? (
                            <div className="generation-options">
                                <p><strong>Cours :</strong> {selectedCourse?.titre}</p>

                                <div className="form-group">
                                    <label className="form-label">Nombre de flashcards</label>
                                    <select
                                        className="form-input"
                                        value={flashcardOptions.nombreCartes}
                                        onChange={(e) => setFlashcardOptions({ ...flashcardOptions, nombreCartes: e.target.value })}
                                    >
                                        <option value="10">10 cartes</option>
                                        <option value="20">20 cartes</option>
                                        <option value="30">30 cartes</option>
                                        <option value="50">50 cartes</option>
                                    </select>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={submitFlashcardsGeneration}
                                    disabled={loading}
                                >
                                    {loading ? 'Génération en cours...' : 'Générer les Flashcards avec IA'}
                                </button>

                                {loading && (
                                    <div className="loading-spinner">
                                        <div className="spinner"></div>
                                        <p>Claude génère vos flashcards...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p style={{ textAlign: 'center', marginBottom: '20px', color: '#48bb78', fontWeight: '600' }}>
                                    ✅ Flashcards générées avec succès ! ({generatedFlashcards.nombreCartes} cartes)
                                </p>

                                {generatedFlashcards.cards.slice(0, 5).map((card, index) => (
                                    <div key={index} className="question-item" style={{ marginBottom: '15px' }}>
                                        <div className="question-header">
                                            <span className="question-number">Carte {index + 1}</span>
                                            <span className="question-difficulty">{card.category}</span>
                                        </div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ fontSize: '14px', color: '#667eea' }}>Recto:</strong>
                                            <p style={{ marginTop: '5px', fontSize: '14px' }}>{card.front}</p>
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '14px', color: '#764ba2' }}>Verso:</strong>
                                            <p style={{ marginTop: '5px', fontSize: '14px' }}>{card.back}</p>
                                        </div>
                                    </div>
                                ))}

                                {generatedFlashcards.cards.length > 5 && (
                                    <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                                        ... et {generatedFlashcards.cards.length - 5} autres cartes
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardNew;
