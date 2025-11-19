import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI } from '../utils/api';

const OnboardingScreen = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [matieres, setMatieres] = useState([]);
    const { completeOnboarding } = useAuth();

    const [formData, setFormData] = useState({
        annee: '',
        majeure: '',
        points_forts: '',
        points_amelioration: '',
        objectifs: '',
        niveau_difficulte_prefere: 'moyen',
    });

    const [selectedPointsForts, setSelectedPointsForts] = useState([]);
    const [selectedPointsAmelioration, setSelectedPointsAmelioration] = useState([]);
    const [selectedObjectifs, setSelectedObjectifs] = useState([]);

    useEffect(() => {
        loadMatieres();
    }, []);

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

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.annee) {
                Alert.alert('Erreur', 'Veuillez sélectionner votre année');
                return;
            }
            if (['Ing4', 'Ing5'].includes(formData.annee) && !formData.majeure) {
                Alert.alert('Erreur', 'Veuillez sélectionner votre majeure');
                return;
            }
        }
        setStep(step + 1);
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const dataToSend = {
                annee_etude: formData.annee,
                majeure: formData.majeure || null,
                points_forts: selectedPointsForts.join(', ') || 'Non spécifié',
                points_faibles: selectedPointsAmelioration.join(', ') || 'Non spécifié',
                objectifs_apprentissage: selectedObjectifs.join(', ') || 'Non spécifié',
                preferences_difficulte: formData.niveau_difficulte_prefere || 'moyen',
            };

            const response = await onboardingAPI.complete(dataToSend);
            if (response.success) {
                completeOnboarding();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Informations de base</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Année d'études</Text>
                <View style={styles.yearButtons}>
                    {['Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5'].map((year) => (
                        <TouchableOpacity
                            key={year}
                            style={[
                                styles.yearButton,
                                formData.annee === year && styles.yearButtonActive,
                            ]}
                            onPress={() => updateField('annee', year)}
                        >
                            <Text
                                style={[
                                    styles.yearButtonText,
                                    formData.annee === year && styles.yearButtonTextActive,
                                ]}
                            >
                                {year}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {['Ing4', 'Ing5'].includes(formData.annee) && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Majeure</Text>
                    <View style={styles.majeureButtons}>
                        {['Data & IA', 'Create', 'Cybersécurité', 'Finance', 'Nucléaire'].map((majeure) => (
                            <TouchableOpacity
                                key={majeure}
                                style={[
                                    styles.majeureButton,
                                    formData.majeure === majeure && styles.majeureButtonActive,
                                ]}
                                onPress={() => updateField('majeure', majeure)}
                            >
                                <Text
                                    style={[
                                        styles.majeureButtonText,
                                        formData.majeure === majeure && styles.majeureButtonTextActive,
                                    ]}
                                >
                                    {majeure}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    const toggleSelection = (item, selected, setSelected) => {
        if (selected.includes(item)) {
            setSelected(selected.filter(i => i !== item));
        } else {
            setSelected([...selected, item]);
        }
    };

    const renderStep2 = () => {
        const matieresList = ['Mathématiques', 'Physique', 'Informatique', 'Électronique', 'Mécanique', 'Anglais', 'Gestion'];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Vos forces et points à améliorer</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Points forts (optionnel)</Text>
                    <View style={styles.selectionButtons}>
                        {matieresList.map((matiere) => (
                            <TouchableOpacity
                                key={matiere}
                                style={[
                                    styles.selectionButton,
                                    selectedPointsForts.includes(matiere) && styles.selectionButtonActive,
                                ]}
                                onPress={() => toggleSelection(matiere, selectedPointsForts, setSelectedPointsForts)}
                            >
                                <Text
                                    style={[
                                        styles.selectionButtonText,
                                        selectedPointsForts.includes(matiere) && styles.selectionButtonTextActive,
                                    ]}
                                >
                                    {matiere}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Points à améliorer (optionnel)</Text>
                    <View style={styles.selectionButtons}>
                        {matieresList.map((matiere) => (
                            <TouchableOpacity
                                key={matiere}
                                style={[
                                    styles.selectionButton,
                                    selectedPointsAmelioration.includes(matiere) && styles.selectionButtonActiveRed,
                                ]}
                                onPress={() => toggleSelection(matiere, selectedPointsAmelioration, setSelectedPointsAmelioration)}
                            >
                                <Text
                                    style={[
                                        styles.selectionButtonText,
                                        selectedPointsAmelioration.includes(matiere) && styles.selectionButtonTextActive,
                                    ]}
                                >
                                    {matiere}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    const renderStep3 = () => {
        const objectifsList = ['Réussir mes examens', 'Préparer les concours', 'Stage/Alternance', 'Projet personnel', 'Améliorer mes notes'];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Préférences d'apprentissage</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Objectifs d'apprentissage (optionnel)</Text>
                    <View style={styles.selectionButtons}>
                        {objectifsList.map((objectif) => (
                            <TouchableOpacity
                                key={objectif}
                                style={[
                                    styles.selectionButton,
                                    selectedObjectifs.includes(objectif) && styles.selectionButtonActive,
                                ]}
                                onPress={() => toggleSelection(objectif, selectedObjectifs, setSelectedObjectifs)}
                            >
                                <Text
                                    style={[
                                        styles.selectionButtonText,
                                        selectedObjectifs.includes(objectif) && styles.selectionButtonTextActive,
                                    ]}
                                >
                                    {objectif}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Niveau de difficulté préféré</Text>
                    <View style={styles.difficultyButtons}>
                        {[
                            { label: 'Facile', value: 'facile' },
                            { label: 'Moyen', value: 'moyen' },
                            { label: 'Difficile', value: 'difficile' },
                        ].map((diff) => (
                            <TouchableOpacity
                                key={diff.value}
                                style={[
                                    styles.difficultyButton,
                                    formData.niveau_difficulte_prefere === diff.value && styles.difficultyButtonActive,
                                ]}
                                onPress={() => updateField('niveau_difficulte_prefere', diff.value)}
                            >
                                <Text
                                    style={[
                                        styles.difficultyButtonText,
                                        formData.niveau_difficulte_prefere === diff.value && styles.difficultyButtonTextActive,
                                    ]}
                                >
                                    {diff.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.logo}>🎓</Text>
                    <Text style={styles.title}>Configuration du profil</Text>
                    <Text style={styles.subtitle}>Étape {step} sur 3</Text>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${(step / 3) * 100}%` }]} />
                </View>

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                <View style={styles.buttonContainer}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={handlePrevious}
                        >
                            <Text style={styles.secondaryButtonText}>Précédent</Text>
                        </TouchableOpacity>
                    )}

                    {step < 3 ? (
                        <>
                            <TouchableOpacity
                                style={[styles.button, styles.skipButton]}
                                onPress={handleNext}
                            >
                                <Text style={styles.skipButtonText}>Passer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton]}
                                onPress={handleNext}
                            >
                                <Text style={styles.buttonText}>Suivant</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Terminer</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        fontSize: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginBottom: 30,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: '#667eea',
    },
    stepContainer: {
        marginBottom: 30,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    yearButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    yearButton: {
        flex: 1,
        minWidth: '30%',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    yearButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    yearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    yearButtonTextActive: {
        color: '#fff',
    },
    majeureButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    majeureButton: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    majeureButtonActive: {
        backgroundColor: '#764ba2',
        borderColor: '#764ba2',
    },
    majeureButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    majeureButtonTextActive: {
        color: '#fff',
    },
    difficultyButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        alignItems: 'center',
    },
    difficultyButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    difficultyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    difficultyButtonTextActive: {
        color: '#fff',
    },
    selectionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    selectionButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    selectionButtonActive: {
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
    },
    selectionButtonActiveRed: {
        backgroundColor: '#ff9800',
        borderColor: '#ff9800',
    },
    selectionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    selectionButtonTextActive: {
        color: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#667eea',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    secondaryButton: {
        backgroundColor: '#e0e0e0',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    skipButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#667eea',
    },
    skipButtonText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;
