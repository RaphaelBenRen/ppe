import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { summariesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const HIGHLIGHT_COLORS = [
    { name: 'Jaune', color: '#fff59d' },
    { name: 'Vert', color: '#a5d6a7' },
    { name: 'Bleu', color: '#90caf9' },
    { name: 'Rose', color: '#f48fb1' },
    { name: 'Orange', color: '#ffcc80' },
];

const SummaryViewerScreen = ({ route, navigation }) => {
    const { summaryId, summaryTitre } = route.params;
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [content, setContent] = useState('');
    const [highlights, setHighlights] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiQuestion, setAIQuestion] = useState('');
    const [aiResponse, setAIResponse] = useState('');
    const [aiLoading, setAILoading] = useState(false);
    const [selectionContext, setSelectionContext] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [reformatting, setReformatting] = useState(false);
    const webViewRef = useRef(null);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const response = await summariesAPI.getSummary(summaryId);
            if (response.success) {
                setSummaryData(response.data);
                setContent(response.data.content);
            }
        } catch (error) {
            console.error('Erreur chargement résumé:', error);
            Alert.alert('Erreur', 'Impossible de charger le résumé');
        } finally {
            setLoading(false);
        }
    };

    const getHighlightedHTML = () => {
        let processedContent = content || '';

        // Appliquer les surlignages
        highlights.forEach(h => {
            const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedText})`, 'gi');
            processedContent = processedContent.replace(
                regex,
                `<span style="background-color: ${h.color}; padding: 2px 0;">$1</span>`
            );
        });

        // Convertir les sauts de ligne en <br> et formater
        processedContent = processedContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/•/g, '<span style="color: #1a1a2e;">•</span>');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * {
                        -webkit-user-select: text;
                        user-select: text;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        font-size: 16px;
                        line-height: 1.7;
                        color: #333;
                        padding: 16px;
                        margin: 0;
                        background-color: #fff;
                    }
                    strong {
                        color: #1a1a2e;
                    }
                    ::selection {
                        background-color: #b3d4fc;
                    }
                </style>
            </head>
            <body>
                ${processedContent}
                <script>
                    document.addEventListener('selectionchange', function() {
                        const selection = window.getSelection();
                        const selectedText = selection.toString().trim();
                        if (selectedText.length > 0) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'selection',
                                text: selectedText
                            }));
                        }
                    });
                </script>
            </body>
            </html>
        `;
    };

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'selection' && data.text) {
                setSelectedText(data.text);
                setShowColorPicker(true);
            }
        } catch (e) {
            console.log('Erreur parsing message webview:', e);
        }
    };

    const addHighlight = (color) => {
        if (selectedText) {
            setHighlights(prev => [...prev, { text: selectedText, color }]);
            setSelectedText('');
            setShowColorPicker(false);
        }
    };

    const openAIModal = () => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour utiliser l\'IA, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }
        setShowAIModal(true);
    };

    const askAIQuestion = async () => {
        if (!aiQuestion.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer une question');
            return;
        }

        setAILoading(true);
        try {
            const response = await summariesAPI.askQuestion(summaryId, {
                question: aiQuestion,
                context: selectionContext || content
            });
            if (response.success) {
                setAIResponse(response.data.answer);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la question');
        } finally {
            setAILoading(false);
        }
    };

    const handleReformat = async () => {
        if (!user?.has_ai_access) {
            Alert.alert(
                'Accès restreint',
                'Pour reformater avec l\'IA, vous devez entrer un code d\'accès dans les paramètres.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Paramètres', onPress: () => navigation.navigate('Settings') }
                ]
            );
            return;
        }

        Alert.alert(
            'Reformater avec l\'IA',
            'L\'IA va améliorer la mise en page du résumé.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Reformater',
                    onPress: async () => {
                        setReformatting(true);
                        try {
                            const response = await summariesAPI.reformatSummary(summaryId);
                            if (response.success && response.data?.content) {
                                setContent(response.data.content);
                                Alert.alert('Succès', 'Le résumé a été reformaté !');
                            }
                        } catch (error) {
                            Alert.alert('Erreur', error.message || 'Erreur lors du reformatage');
                        } finally {
                            setReformatting(false);
                        }
                    }
                }
            ]
        );
    };

    const startEditing = () => {
        setEditedContent(content);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedContent('');
    };

    const saveEditing = async () => {
        setSaving(true);
        try {
            await summariesAPI.updateContent(summaryId, editedContent);
            setContent(editedContent);
            setIsEditing(false);
            Alert.alert('Succès', 'Modifications enregistrées');
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
                <Text style={styles.loadingText}>Chargement du résumé...</Text>
            </View>
        );
    }

    if (!summaryData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Impossible de charger le résumé</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadSummary}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{summaryData.titre}</Text>
                    <Text style={styles.headerSubtitle}>{summaryData.matiere}</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                    <Text style={styles.editButtonText}>E</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.reformatButton, reformatting && styles.reformatButtonDisabled]}
                    onPress={handleReformat}
                    disabled={reformatting}
                >
                    {reformatting ? (
                        <ActivityIndicator size="small" color="#1a1a2e" />
                    ) : (
                        <Text style={styles.reformatButtonText}>IA</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.aiButton} onPress={() => {
                    setSelectionContext('');
                    setAIQuestion('');
                    openAIModal();
                }}>
                    <Text style={styles.aiButtonText}>?</Text>
                </TouchableOpacity>
            </View>

            {/* Info source */}
            {summaryData.original_course_titre && (
                <View style={styles.sourceBanner}>
                    <Text style={styles.sourceBannerText}>
                        Source: {summaryData.original_course_titre}
                    </Text>
                </View>
            )}

            {/* Content WebView */}
            <WebView
                ref={webViewRef}
                source={{ html: getHighlightedHTML() }}
                style={styles.webview}
                onMessage={handleWebViewMessage}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
            />

            {/* Color Picker Modal */}
            <Modal
                visible={showColorPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <TouchableOpacity
                    style={styles.colorPickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowColorPicker(false)}
                >
                    <View style={styles.colorPickerContent}>
                        <Text style={styles.colorPickerTitle}>Surligner le texte</Text>
                        <Text style={styles.selectedTextPreview} numberOfLines={2}>
                            "{selectedText}"
                        </Text>
                        <View style={styles.colorOptions}>
                            {HIGHLIGHT_COLORS.map((item) => (
                                <TouchableOpacity
                                    key={item.color}
                                    style={[styles.colorOption, { backgroundColor: item.color }]}
                                    onPress={() => addHighlight(item.color)}
                                >
                                    <Text style={styles.colorOptionText}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.askAIButton}
                            onPress={() => {
                                setShowColorPicker(false);
                                setSelectionContext(selectedText);
                                setAIQuestion('');
                                openAIModal();
                            }}
                        >
                            <Text style={styles.askAIButtonText}>Poser une question sur ce texte</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* AI Modal */}
            <Modal
                visible={showAIModal}
                animationType="slide"
                onRequestClose={() => setShowAIModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.aiModalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.aiModalHeader}>
                        <Text style={styles.aiModalTitle}>Assistant IA</Text>
                        {selectionContext && (
                            <Text style={styles.aiContextIndicator}>Contexte sélectionné</Text>
                        )}
                    </View>

                    <ScrollView
                        style={styles.aiModalContent}
                        contentContainerStyle={styles.aiModalContentContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.aiModalLabel}>Posez votre question :</Text>
                        <TextInput
                            style={styles.aiQuestionInput}
                            placeholder="Ex: Explique ce concept plus en détail..."
                            value={aiQuestion}
                            onChangeText={setAIQuestion}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#999"
                        />

                        <TouchableOpacity
                            style={[styles.aiAskButton, aiLoading && styles.aiAskButtonDisabled]}
                            onPress={askAIQuestion}
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.aiAskButtonText}>Demander à l'IA</Text>
                            )}
                        </TouchableOpacity>

                        {aiResponse ? (
                            <View style={styles.aiResponseContainer}>
                                <Text style={styles.aiResponseLabel}>Réponse :</Text>
                                <Text style={styles.aiResponseText}>{aiResponse}</Text>
                            </View>
                        ) : null}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.closeModalButton}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowAIModal(false);
                            setAIResponse('');
                            setAIQuestion('');
                            setSelectionContext('');
                        }}
                    >
                        <Text style={styles.closeModalButtonText}>Fermer</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={isEditing}
                animationType="slide"
                onRequestClose={cancelEditing}
            >
                <KeyboardAvoidingView
                    style={styles.editModalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.editModalHeader}>
                        <TouchableOpacity onPress={cancelEditing}>
                            <Text style={styles.editCancelText}>Annuler</Text>
                        </TouchableOpacity>
                        <Text style={styles.editModalTitle}>Modifier</Text>
                        <TouchableOpacity onPress={saveEditing} disabled={saving}>
                            {saving ? (
                                <ActivityIndicator size="small" color="#1a1a2e" />
                            ) : (
                                <Text style={styles.editSaveText}>Enregistrer</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.editScrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TextInput
                            style={styles.editTextInput}
                            value={editedContent}
                            onChangeText={setEditedContent}
                            multiline
                            textAlignVertical="top"
                            autoFocus={false}
                            placeholder="Contenu du résumé..."
                            placeholderTextColor="#999"
                        />
                    </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 32,
        color: '#1a1a2e',
        fontWeight: '300',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 2,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    editButtonText: {
        color: '#1a1a2e',
        fontSize: 14,
        fontWeight: '600',
    },
    reformatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#a5d6a7',
    },
    reformatButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    reformatButtonText: {
        color: '#2e7d32',
        fontSize: 12,
        fontWeight: '600',
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    sourceBanner: {
        backgroundColor: '#e8f5e9',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    sourceBannerText: {
        fontSize: 12,
        color: '#2e7d32',
        fontStyle: 'italic',
    },
    webview: {
        flex: 1,
        backgroundColor: '#fff',
    },
    colorPickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    colorPickerContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 340,
    },
    colorPickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 12,
    },
    selectedTextPreview: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 16,
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
    },
    colorOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    colorOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    colorOptionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    askAIButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    askAIButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    aiModalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    aiModalHeader: {
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    aiModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    aiContextIndicator: {
        fontSize: 12,
        color: '#2e7d32',
        marginTop: 4,
    },
    aiModalContent: {
        flex: 1,
    },
    aiModalContentContainer: {
        padding: 20,
    },
    aiModalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 10,
    },
    aiQuestionInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    aiAskButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    aiAskButtonDisabled: {
        backgroundColor: '#9e9e9e',
    },
    aiAskButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    aiResponseContainer: {
        marginTop: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    aiResponseLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 10,
    },
    aiResponseText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#333',
    },
    closeModalButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    closeModalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    editModalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    editModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    editCancelText: {
        fontSize: 16,
        color: '#e53e3e',
    },
    editModalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    editSaveText: {
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: '600',
    },
    editScrollView: {
        flex: 1,
    },
    editTextInput: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        fontSize: 15,
        lineHeight: 24,
        minHeight: 400,
    },
});

export default SummaryViewerScreen;
