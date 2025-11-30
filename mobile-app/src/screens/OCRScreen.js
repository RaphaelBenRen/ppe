import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { coursesAPI, onboardingAPI } from '../utils/api';

const OCRScreen = ({ navigation }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState('select'); // 'select', 'preview', 'edit', 'save'

    // Champs pour sauvegarder le cours
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [annee, setAnnee] = useState('');
    const [matiere, setMatiere] = useState('');
    const [typeDocument, setTypeDocument] = useState('');
    const [matieres, setMatieres] = useState([]);

    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    // Charger les matières au démarrage
    useEffect(() => {
        loadMatieres();
    }, []);

    const loadMatieres = async () => {
        try {
            const response = await onboardingAPI.getMatieres();
            if (response.success && response.data) {
                setMatieres(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement matières:', error);
            // Fallback avec des matières par défaut
            setMatieres(['Mathématiques', 'Physique', 'Informatique', 'Électronique', 'Autre']);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
            setStep('preview');
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
            setStep('preview');
        }
    };

    const extractText = async () => {
        if (!selectedImage) return;

        setLoading(true);
        try {
            const response = await coursesAPI.extractTextFromImage(selectedImage.uri);

            if (response.success) {
                setExtractedText(response.data.text);
                setStep('edit');
            } else {
                Alert.alert('Erreur', 'Impossible d\'extraire le texte');
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'extraction');
        } finally {
            setLoading(false);
        }
    };

    const saveCourse = async () => {
        if (!titre || !annee || !matiere || !typeDocument) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSaving(true);
        try {
            const response = await coursesAPI.uploadFromOCR({
                titre,
                description,
                annee_cible: annee,
                matiere,
                type_document: typeDocument,
                content: extractedText
            });

            if (response.success) {
                Alert.alert(
                    'Succès',
                    'Cours créé avec succès !',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const resetAll = () => {
        setSelectedImage(null);
        setExtractedText('');
        setTitre('');
        setDescription('');
        setAnnee('');
        setMatiere('');
        setTypeDocument('');
        setStep('select');
    };

    const renderSelectStep = () => (
        <View style={styles.centerContent}>
            <Text style={styles.title}>Importer depuis une photo</Text>
            <Text style={styles.subtitle}>
                Prenez une photo de votre cours ou importez une image existante
            </Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.mainButton} onPress={takePhoto}>
                    <Text style={styles.mainButtonIcon}>📷</Text>
                    <Text style={styles.mainButtonText}>Prendre une photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.mainButton, styles.secondaryButton]} onPress={pickImage}>
                    <Text style={styles.mainButtonIcon}>🖼️</Text>
                    <Text style={styles.mainButtonText}>Choisir depuis la galerie</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Conseils pour de meilleurs résultats :</Text>
                <Text style={styles.infoText}>• Assurez-vous que le texte est lisible</Text>
                <Text style={styles.infoText}>• Évitez les reflets et les ombres</Text>
                <Text style={styles.infoText}>• Prenez la photo bien droite</Text>
                <Text style={styles.infoText}>• Fonctionne aussi avec l'écriture manuscrite</Text>
            </View>
        </View>
    );

    const renderPreviewStep = () => (
        <View style={styles.previewContainer}>
            <Text style={styles.stepTitle}>Aperçu de l'image</Text>

            {selectedImage && (
                <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                />
            )}

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={resetAll}
                >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.extractButton]}
                    onPress={extractText}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.extractButtonText}>Extraire le texte</Text>
                    )}
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loadingInfo}>
                    <Text style={styles.loadingText}>Analyse de l'image en cours...</Text>
                    <Text style={styles.loadingSubtext}>Cela peut prendre quelques secondes</Text>
                </View>
            )}
        </View>
    );

    const renderEditStep = () => (
        <ScrollView style={styles.editContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Texte extrait</Text>

            <TextInput
                style={styles.textArea}
                value={extractedText}
                onChangeText={setExtractedText}
                multiline
                placeholder="Le texte extrait apparaîtra ici..."
                textAlignVertical="top"
            />

            <Text style={styles.editHint}>
                Vous pouvez modifier le texte si nécessaire avant de sauvegarder
            </Text>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={resetAll}
                >
                    <Text style={styles.cancelButtonText}>Recommencer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.nextButton]}
                    onPress={() => setStep('save')}
                >
                    <Text style={styles.nextButtonText}>Continuer</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const annees = ['Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5'];
    const typesDocument = [
        { label: 'Cours', value: 'cours' },
        { label: 'TD', value: 'td' },
        { label: 'TP', value: 'tp' },
        { label: 'Annale', value: 'annale' },
        { label: 'Résumé', value: 'resume' },
        { label: 'Notes', value: 'notes' },
    ];

    const renderSaveStep = () => (
        <ScrollView style={styles.saveContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Informations du cours</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Titre du cours *</Text>
                <TextInput
                    style={styles.input}
                    value={titre}
                    onChangeText={setTitre}
                    placeholder="Ex: Chapitre 3 - Thermodynamique"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textInputMulti]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description optionnelle..."
                    multiline
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Année *</Text>
                <View style={styles.chipsContainer}>
                    {annees.map((a) => (
                        <TouchableOpacity
                            key={a}
                            style={[styles.chip, annee === a && styles.chipSelected]}
                            onPress={() => setAnnee(a)}
                        >
                            <Text style={[styles.chipText, annee === a && styles.chipTextSelected]}>{a}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Matière *</Text>
                <View style={styles.chipsContainer}>
                    {matieres.map((m, index) => {
                        const matiereNom = typeof m === 'string' ? m : m.nom;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.chip, matiere === matiereNom && styles.chipSelected]}
                                onPress={() => setMatiere(matiereNom)}
                            >
                                <Text style={[styles.chipText, matiere === matiereNom && styles.chipTextSelected]}>{matiereNom}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Type de document *</Text>
                <View style={styles.chipsContainer}>
                    {typesDocument.map((t) => (
                        <TouchableOpacity
                            key={t.value}
                            style={[styles.chip, typeDocument === t.value && styles.chipSelected]}
                            onPress={() => setTypeDocument(t.value)}
                        >
                            <Text style={[styles.chipText, typeDocument === t.value && styles.chipTextSelected]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.actionButtons, { marginTop: 20 }]}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setStep('edit')}
                >
                    <Text style={styles.cancelButtonText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveCourse}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Sauvegarder</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scanner un cours</Text>
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, step !== 'select' && styles.progressStepDone]}>
                    <Text style={styles.progressText}>1</Text>
                </View>
                <View style={[styles.progressLine, step !== 'select' && styles.progressLineDone]} />
                <View style={[styles.progressStep, (step === 'edit' || step === 'save') && styles.progressStepDone]}>
                    <Text style={styles.progressText}>2</Text>
                </View>
                <View style={[styles.progressLine, step === 'save' && styles.progressLineDone]} />
                <View style={[styles.progressStep, step === 'save' && styles.progressStepDone]}>
                    <Text style={styles.progressText}>3</Text>
                </View>
            </View>

            <View style={[styles.content, isTablet && styles.contentTablet]}>
                {step === 'select' && renderSelectStep()}
                {step === 'preview' && renderPreviewStep()}
                {step === 'edit' && renderEditStep()}
                {step === 'save' && renderSaveStep()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        marginBottom: 10,
    },
    backButtonText: {
        color: '#1a1a2e',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 40,
    },
    progressStep: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressStepDone: {
        backgroundColor: '#1a1a2e',
    },
    progressText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    progressLine: {
        flex: 1,
        height: 3,
        backgroundColor: '#ddd',
        marginHorizontal: 10,
    },
    progressLineDone: {
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentTablet: {
        paddingHorizontal: '15%',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    buttonContainer: {
        gap: 15,
        marginBottom: 30,
    },
    mainButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 20,
        paddingHorizontal: 25,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#1a1a2e',
    },
    mainButtonIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    mainButtonText: {
        color: '#1a1a2e',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#e3f2fd',
        padding: 20,
        borderRadius: 12,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 13,
        color: '#333',
        marginBottom: 5,
        lineHeight: 20,
    },
    previewContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 15,
    },
    previewImage: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    extractButton: {
        backgroundColor: '#1a1a2e',
    },
    extractButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#1a1a2e',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#4caf50',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    loadingText: {
        fontSize: 14,
        color: '#1a1a2e',
        fontWeight: '500',
    },
    loadingSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    editContainer: {
        flex: 1,
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        lineHeight: 24,
        minHeight: 300,
        maxHeight: 400,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 10,
    },
    editHint: {
        fontSize: 12,
        color: '#888',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    saveContainer: {
        flex: 1,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textInputMulti: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 10,
        marginBottom: 10,
    },
    chipSelected: {
        backgroundColor: '#1a1a2e',
        borderColor: '#1a1a2e',
    },
    chipText: {
        fontSize: 14,
        color: '#333',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default OCRScreen;
