import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    useWindowDimensions,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { qcmAPI } from '../utils/api';

const QCMScreen = ({ navigation }) => {
    const { qcms, refreshQCMs } = useData();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const [deletingId, setDeletingId] = useState(null);

    // États pour l'import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importMode, setImportMode] = useState(null); // 'text' ou 'file'
    const [importText, setImportText] = useState('');
    const [importTitre, setImportTitre] = useState('');
    const [importMatiere, setImportMatiere] = useState('Autre');
    const [importing, setImporting] = useState(false);

    const matieres = ['Informatique', 'Mathématiques', 'Physique', 'Électronique', 'Anglais', 'Autre'];

    const handleDeleteQCM = (qcm) => {
        Alert.alert(
            'Supprimer le QCM',
            `Voulez-vous vraiment supprimer "${qcm.titre}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(qcm.id);
                            await qcmAPI.deleteQCM(qcm.id);
                            await refreshQCMs();
                        } catch (error) {
                            Alert.alert('Erreur', error.message || 'Impossible de supprimer le QCM');
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    const handleOpenImportModal = () => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour importer des QCM, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }
        setShowImportModal(true);
        setImportMode(null);
        setImportText('');
        setImportTitre('');
        setImportMatiere('Autre');
    };

    const handleImportFromText = async () => {
        if (!importText.trim() || importText.trim().length < 50) {
            Alert.alert('Erreur', 'Collez le contenu du QCM (minimum 50 caractères)');
            return;
        }

        setImporting(true);
        try {
            const response = await qcmAPI.importFromText(importText, {
                titre: importTitre || undefined,
                matiere: importMatiere,
            });

            if (response.success) {
                Alert.alert('Succès', response.message);
                setShowImportModal(false);
                refreshQCMs();
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'import');
        } finally {
            setImporting(false);
        }
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const file = result.assets[0];

                setImporting(true);
                try {
                    const response = await qcmAPI.importFromFile(file, {
                        titre: importTitre || undefined,
                        matiere: importMatiere,
                    });

                    if (response.success) {
                        Alert.alert('Succès', response.message);
                        setShowImportModal(false);
                        refreshQCMs();
                    }
                } catch (error) {
                    Alert.alert('Erreur', error.message || 'Erreur lors de l\'import');
                } finally {
                    setImporting(false);
                }
            }
        } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la sélection du fichier');
        }
    };

    const getDifficultyLabel = (difficulte) => {
        switch (difficulte) {
            case 'facile': return 'Facile';
            case 'moyen': return 'Moyen';
            case 'difficile': return 'Difficile';
            default: return difficulte;
        }
    };

    const renderQCM = ({ item }) => (
        <View style={styles.qcmCard}>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteQCM(item)}
                disabled={deletingId === item.id}
            >
                {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#999" />
                ) : (
                    <Text style={styles.deleteButtonText}>×</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.qcmMain}
                onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
                activeOpacity={0.7}
            >
                <View style={styles.qcmIcon}>
                    <Text style={styles.qcmIconText}>★</Text>
                </View>
                <View style={styles.qcmInfo}>
                    <Text style={styles.qcmTitle} numberOfLines={1}>{item.titre}</Text>
                    <Text style={styles.qcmMeta}>
                        {item.nombre_questions} questions • {getDifficultyLabel(item.difficulte)}
                    </Text>
                </View>
            </TouchableOpacity>
            <View style={styles.qcmActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionBtnText}>Commencer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('QCMHistory', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionBtnText}>Historique</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Mes QCMs</Text>
                    <Text style={styles.headerCount}>{qcms.length}</Text>
                </View>
                <TouchableOpacity style={styles.importButton} onPress={handleOpenImportModal}>
                    <Text style={styles.importButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {qcms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>★</Text>
                    </View>
                    <Text style={[styles.emptyText, isTablet && styles.emptyTextTablet]}>Aucun QCM</Text>
                    <Text style={[styles.emptySubtext, isTablet && styles.emptySubtextTablet]}>
                        Générez un QCM depuis un cours ou importez une annale !
                    </Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={handleOpenImportModal}>
                        <Text style={styles.emptyButtonText}>Importer un QCM</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={qcms}
                    renderItem={renderQCM}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                />
            )}

            {/* Modal d'import */}
            <Modal
                visible={showImportModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImportModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        {importing ? (
                            <View style={styles.importingContainer}>
                                <ActivityIndicator size="large" color="#1a1a2e" />
                                <Text style={styles.importingText}>Analyse du QCM en cours...</Text>
                                <Text style={styles.importingSubtext}>L'IA extrait les questions</Text>
                            </View>
                        ) : importMode === null ? (
                            // Choix du mode d'import
                            <>
                                <Text style={styles.modalTitle}>Importer un QCM</Text>
                                <Text style={styles.modalSubtitle}>
                                    Importez une annale ou un QCM existant
                                </Text>

                                <TouchableOpacity
                                    style={styles.importOption}
                                    onPress={() => setImportMode('text')}
                                >
                                    <View style={styles.importOptionIcon}>
                                        <Text style={styles.importOptionIconText}>⎘</Text>
                                    </View>
                                    <View style={styles.importOptionInfo}>
                                        <Text style={styles.importOptionTitle}>Coller du texte</Text>
                                        <Text style={styles.importOptionDesc}>Collez le contenu d'un QCM copié</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.importOption}
                                    onPress={() => setImportMode('file')}
                                >
                                    <View style={styles.importOptionIcon}>
                                        <Text style={styles.importOptionIconText}>↑</Text>
                                    </View>
                                    <View style={styles.importOptionInfo}>
                                        <Text style={styles.importOptionTitle}>Importer un fichier</Text>
                                        <Text style={styles.importOptionDesc}>PDF ou fichier texte</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalBtnSecondary}
                                    onPress={() => setShowImportModal(false)}
                                >
                                    <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                                </TouchableOpacity>
                            </>
                        ) : importMode === 'text' ? (
                            // Mode texte
                            <>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => setImportMode(null)}>
                                        <Text style={styles.backButton}>‹ Retour</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>Coller le QCM</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Titre (optionnel)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={importTitre}
                                        onChangeText={setImportTitre}
                                        placeholder="Ex: Annale 2023 - Algo"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Matière</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.chipContainer}>
                                            {matieres.map((m) => (
                                                <TouchableOpacity
                                                    key={m}
                                                    style={[styles.chip, importMatiere === m && styles.chipActive]}
                                                    onPress={() => setImportMatiere(m)}
                                                >
                                                    <Text style={[styles.chipText, importMatiere === m && styles.chipTextActive]}>
                                                        {m}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Contenu du QCM</Text>
                                    <TextInput
                                        style={[styles.textInput, styles.textArea]}
                                        value={importText}
                                        onChangeText={setImportText}
                                        placeholder="Collez ici le contenu du QCM (questions, options, réponses si disponibles)..."
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={8}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalBtnSecondary}
                                        onPress={() => setShowImportModal(false)}
                                    >
                                        <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalBtnPrimary}
                                        onPress={handleImportFromText}
                                    >
                                        <Text style={styles.modalBtnPrimaryText}>Importer</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            // Mode fichier
                            <>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity onPress={() => setImportMode(null)}>
                                        <Text style={styles.backButton}>‹ Retour</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.modalTitle}>Importer un fichier</Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Titre (optionnel)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={importTitre}
                                        onChangeText={setImportTitre}
                                        placeholder="Ex: Annale 2023 - Algo"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Matière</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.chipContainer}>
                                            {matieres.map((m) => (
                                                <TouchableOpacity
                                                    key={m}
                                                    style={[styles.chip, importMatiere === m && styles.chipActive]}
                                                    onPress={() => setImportMatiere(m)}
                                                >
                                                    <Text style={[styles.chipText, importMatiere === m && styles.chipTextActive]}>
                                                        {m}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>

                                <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickFile}>
                                    <Text style={styles.filePickerIcon}>↑</Text>
                                    <Text style={styles.filePickerText}>Sélectionner un fichier</Text>
                                    <Text style={styles.filePickerHint}>PDF ou TXT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalBtnSecondary}
                                    onPress={() => setShowImportModal(false)}
                                >
                                    <Text style={styles.modalBtnSecondaryText}>Annuler</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    headerTitleTablet: {
        fontSize: 28,
    },
    headerCount: {
        marginLeft: 10,
        fontSize: 14,
        color: '#8a8a8a',
        backgroundColor: '#e8e8e8',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    importButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    importButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '300',
        marginTop: -2,
    },
    list: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    qcmCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    deleteButtonText: {
        fontSize: 18,
        color: '#999',
        fontWeight: '300',
        lineHeight: 20,
    },
    qcmMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    qcmIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qcmIconText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    qcmInfo: {
        flex: 1,
        marginLeft: 14,
    },
    qcmTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    qcmMeta: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 3,
    },
    qcmActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        padding: 10,
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyIcon: {
        fontSize: 48,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    emptyTextTablet: {
        fontSize: 22,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#8a8a8a',
        textAlign: 'center',
        marginBottom: 20,
    },
    emptySubtextTablet: {
        fontSize: 16,
    },
    emptyButton: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        fontSize: 18,
        color: '#1a1a2e',
        marginRight: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8a8a8a',
        marginBottom: 24,
        marginTop: 4,
    },
    importOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 12,
    },
    importOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8e8e8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    importOptionIconText: {
        fontSize: 22,
        color: '#1a1a2e',
    },
    importOptionInfo: {
        flex: 1,
    },
    importOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    importOptionDesc: {
        fontSize: 13,
        color: '#8a8a8a',
        marginTop: 2,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: '#1a1a2e',
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    chipContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    chipActive: {
        backgroundColor: '#1a1a2e',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    chipTextActive: {
        color: '#fff',
    },
    filePickerBtn: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    filePickerIcon: {
        fontSize: 32,
        color: '#1a1a2e',
        marginBottom: 8,
    },
    filePickerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    filePickerHint: {
        fontSize: 13,
        color: '#8a8a8a',
        marginTop: 4,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalBtnSecondary: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        marginTop: 8,
    },
    modalBtnSecondaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    modalBtnPrimary: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
    },
    modalBtnPrimaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    importingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    importingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        marginTop: 20,
    },
    importingSubtext: {
        fontSize: 14,
        color: '#8a8a8a',
        marginTop: 8,
    },
});

export default QCMScreen;
