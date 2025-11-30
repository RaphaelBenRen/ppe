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
    useWindowDimensions,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { coursesAPI } from '../utils/api';

const CHARS_PER_PAGE = 3000;

const HIGHLIGHT_COLORS = [
    { name: 'Jaune', color: '#fff59d' },
    { name: 'Vert', color: '#a5d6a7' },
    { name: 'Bleu', color: '#90caf9' },
    { name: 'Rose', color: '#f48fb1' },
    { name: 'Orange', color: '#ffcc80' },
];

const CourseViewerScreen = ({ route, navigation }) => {
    const { courseId, courseTitre } = route.params;
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState([]);
    const [highlights, setHighlights] = useState({});
    const [selectedText, setSelectedText] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiQuestion, setAIQuestion] = useState('');
    const [aiResponse, setAIResponse] = useState('');
    const [aiLoading, setAILoading] = useState(false);
    const [selectionContext, setSelectionContext] = useState('');
    const webViewRef = useRef(null);
    const { width } = useWindowDimensions();

    useEffect(() => {
        loadCourseContent();
        loadHighlights();
    }, []);

    // Sauvegarder les surlignages quand ils changent
    useEffect(() => {
        if (Object.keys(highlights).length > 0) {
            saveHighlightsToServer();
        }
    }, [highlights]);

    const loadHighlights = async () => {
        try {
            const response = await coursesAPI.getHighlights(courseId);
            if (response.success && response.data) {
                // Convertir les surlignages du serveur en format local
                const highlightsByPage = {};
                response.data.forEach(h => {
                    const pageNum = (h.page_number || 1) - 1; // Convertir en index 0-based
                    if (!highlightsByPage[pageNum]) {
                        highlightsByPage[pageNum] = [];
                    }
                    highlightsByPage[pageNum].push({
                        text: h.text_content,
                        color: h.color,
                        id: h.id
                    });
                });
                setHighlights(highlightsByPage);
            }
        } catch (error) {
            console.log('Erreur chargement surlignages:', error);
        }
    };

    const saveHighlightsToServer = async () => {
        try {
            // Convertir les surlignages locaux en format serveur
            const allHighlights = [];
            Object.entries(highlights).forEach(([pageIndex, pageHighlights]) => {
                pageHighlights.forEach(h => {
                    allHighlights.push({
                        text: h.text,
                        color: h.color,
                        pageNumber: parseInt(pageIndex) + 1 // Convertir en 1-based
                    });
                });
            });
            await coursesAPI.saveHighlights(courseId, allHighlights);
        } catch (error) {
            console.log('Erreur sauvegarde surlignages:', error);
        }
    };

    const formatContent = (text) => {
        if (!text) return '';
        let formatted = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[^\S\n]+/g, ' ')
            .replace(/\.(\s*)([A-Z])/g, '.\n\n$2')
            .replace(/:(\s*)([-•])/g, ':\n$2')
            .replace(/\n\s*[-•]/g, '\n\n•')
            .replace(/\n([A-Z][A-Z\s]{5,})\n/g, '\n\n$1\n\n')
            .replace(/\n{4,}/g, '\n\n\n')
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .trim();
        return formatted;
    };

    const paginateContent = (content) => {
        const formatted = formatContent(content);
        const paragraphs = formatted.split('\n\n');
        const pagesArray = [];
        let currentPageContent = '';

        for (const paragraph of paragraphs) {
            if ((currentPageContent + '\n\n' + paragraph).length > CHARS_PER_PAGE && currentPageContent.length > 0) {
                pagesArray.push(currentPageContent.trim());
                currentPageContent = paragraph;
            } else {
                currentPageContent += (currentPageContent ? '\n\n' : '') + paragraph;
            }
        }

        if (currentPageContent.trim()) {
            pagesArray.push(currentPageContent.trim());
        }

        return pagesArray.length > 0 ? pagesArray : [formatted];
    };

    const loadCourseContent = async () => {
        setLoading(true);
        try {
            const response = await coursesAPI.getCourseContent(courseId);
            if (response.success && response.data) {
                if (!response.data.content || response.data.content.trim() === '') {
                    Alert.alert('Attention', 'Ce cours ne contient pas de texte lisible.');
                }
                setCourseData(response.data);
                const paginatedContent = paginateContent(response.data.content);
                setPages(paginatedContent);
            } else {
                Alert.alert('Erreur', 'Impossible de charger le contenu du cours');
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement du cours');
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'selection') {
                setSelectedText(data.text);
                setSelectionContext(data.text);
                setShowColorPicker(true);
            }
        } catch (e) {
            console.error('Error parsing WebView message:', e);
        }
    };

    const addHighlight = (color) => {
        if (selectedText) {
            const pageHighlights = highlights[currentPage] || [];
            const newHighlight = {
                text: selectedText,
                color: color.color,
                id: Date.now()
            };
            setHighlights({
                ...highlights,
                [currentPage]: [...pageHighlights, newHighlight]
            });

            // Inject highlight into WebView
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    highlightSelection('${color.color}');
                    true;
                `);
            }
        }
        setShowColorPicker(false);
        setSelectedText('');
    };

    const askAIWithSelection = () => {
        setShowColorPicker(false);
        setAIQuestion(`Peux-tu m'expliquer ce passage : "${selectedText}"`);
        setShowAIModal(true);
    };

    const askAI = async () => {
        if (!aiQuestion.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer une question');
            return;
        }

        setAILoading(true);
        try {
            const response = await coursesAPI.askQuestion(courseId, {
                question: aiQuestion,
                context: selectionContext || pages[currentPage]
            });

            if (response.success) {
                setAIResponse(response.data.answer);
            } else {
                setAIResponse('Désolé, je n\'ai pas pu répondre à cette question.');
            }
        } catch (error) {
            setAIResponse('Erreur: ' + (error.message || 'Impossible de contacter l\'IA'));
        } finally {
            setAILoading(false);
        }
    };

    const goToNextPage = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const getWebViewHTML = (content, pageHighlights = []) => {
        // Escape HTML entities
        const escapeHtml = (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .replace(/\n/g, '<br>');
        };

        let htmlContent = escapeHtml(content);

        // Apply existing highlights
        pageHighlights.forEach(h => {
            const escapedText = escapeHtml(h.text);
            htmlContent = htmlContent.replace(
                escapedText,
                `<span style="background-color: ${h.color}; padding: 2px 0;">${escapedText}</span>`
            );
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * {
                        -webkit-touch-callout: default;
                        -webkit-user-select: text;
                        user-select: text;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        font-size: 16px;
                        line-height: 1.8;
                        color: #333;
                        padding: 20px;
                        margin: 0;
                        background-color: #fff;
                    }
                    ::selection {
                        background-color: #b3d4fc;
                    }
                    .highlight-btn {
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background-color: #1a1a2e;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-size: 14px;
                        font-weight: 600;
                        display: none;
                        z-index: 1000;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        cursor: pointer;
                    }
                    .highlight-btn.visible {
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div id="content">${htmlContent}</div>
                <div id="highlightBtn" class="highlight-btn" ontouchend="sendSelection()">
                    Surligner / Demander à l'IA
                </div>
                <script>
                    let selectedText = '';

                    document.addEventListener('selectionchange', function() {
                        const selection = window.getSelection();
                        const text = selection.toString().trim();
                        const btn = document.getElementById('highlightBtn');

                        if (text.length > 0) {
                            selectedText = text;
                            btn.classList.add('visible');
                        } else {
                            btn.classList.remove('visible');
                        }
                    });

                    function sendSelection() {
                        if (selectedText.length > 0) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'selection',
                                text: selectedText
                            }));
                        }
                    }

                    function highlightSelection(color) {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const span = document.createElement('span');
                            span.style.backgroundColor = color;
                            span.style.padding = '2px 0';
                            try {
                                range.surroundContents(span);
                            } catch(e) {
                                // Handle complex selections
                                const fragment = range.extractContents();
                                span.appendChild(fragment);
                                range.insertNode(span);
                            }
                            selection.removeAllRanges();
                            document.getElementById('highlightBtn').classList.remove('visible');
                        }
                    }
                </script>
            </body>
            </html>
        `;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
                <Text style={styles.loadingText}>Chargement du cours...</Text>
            </View>
        );
    }

    if (!courseData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Impossible de charger le cours</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadCourseContent}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentContent = pages[currentPage] || 'Aucun contenu disponible.';
    const pageHighlights = highlights[currentPage] || [];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{courseData.titre}</Text>
                    <Text style={styles.headerSubtitle}>{courseData.matiere}</Text>
                </View>
                <TouchableOpacity style={styles.aiButton} onPress={() => {
                    setSelectionContext('');
                    setAIQuestion('');
                    setShowAIModal(true);
                }}>
                    <Text style={styles.aiButtonText}>?</Text>
                </TouchableOpacity>
            </View>

            {/* Page indicator */}
            <View style={styles.pageIndicator}>
                <Text style={styles.pageText}>Page {currentPage + 1} / {pages.length}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentPage + 1) / pages.length) * 100}%` }]} />
                </View>
            </View>

            {/* WebView Content */}
            <View style={styles.webViewContainer}>
                <WebView
                    ref={webViewRef}
                    key={currentPage}
                    source={{ html: getWebViewHTML(currentContent, pageHighlights) }}
                    style={styles.webView}
                    onMessage={handleWebViewMessage}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                />
            </View>

            {/* Navigation */}
            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
                    onPress={goToPreviousPage}
                    disabled={currentPage === 0}
                >
                    <Text style={styles.navButtonText}>← Précédent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, currentPage === pages.length - 1 && styles.navButtonDisabled]}
                    onPress={goToNextPage}
                    disabled={currentPage === pages.length - 1}
                >
                    <Text style={styles.navButtonText}>Suivant →</Text>
                </TouchableOpacity>
            </View>

            {/* Color Picker Modal */}
            <Modal
                visible={showColorPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowColorPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowColorPicker(false)}
                >
                    <View style={styles.colorPickerModal} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Texte sélectionné</Text>
                        <View style={styles.selectedTextBox}>
                            <Text style={styles.selectedTextPreview} numberOfLines={3}>
                                "{selectedText}"
                            </Text>
                        </View>

                        <Text style={styles.sectionLabel}>Surligner avec :</Text>
                        <View style={styles.colorOptions}>
                            {HIGHLIGHT_COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c.name}
                                    style={[styles.colorOption, { backgroundColor: c.color }]}
                                    onPress={() => addHighlight(c)}
                                >
                                    <Text style={styles.colorOptionText}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.askAIButton} onPress={askAIWithSelection}>
                            <Text style={styles.askAIButtonText}>Demander à l'IA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowColorPicker(false)}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* AI Modal */}
            <Modal
                visible={showAIModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    Keyboard.dismiss();
                    setShowAIModal(false);
                    setAIResponse('');
                    setAIQuestion('');
                    setSelectionContext('');
                }}
            >
                <KeyboardAvoidingView
                    style={styles.aiModalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.aiModal}>
                        <View style={styles.aiModalHeader}>
                            <Text style={styles.aiModalTitle}>Poser une question</Text>
                            <TouchableOpacity
                                style={styles.closeButtonContainer}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowAIModal(false);
                                    setAIResponse('');
                                    setAIQuestion('');
                                    setSelectionContext('');
                                }}
                            >
                                <Text style={styles.closeButton}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.aiModalContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={true}
                        >
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View>
                                    <Text style={styles.aiContextInfo}>
                                        {selectionContext
                                            ? "L'IA répondra en se basant sur le texte sélectionné"
                                            : "L'IA répondra en se basant sur le contenu de la page"
                                        }
                                    </Text>

                                    <TextInput
                                        style={styles.aiQuestionInput}
                                        placeholder="Ex: Qu'est-ce que cela signifie ?"
                                        placeholderTextColor="#999"
                                        value={aiQuestion}
                                        onChangeText={setAIQuestion}
                                        multiline
                                        numberOfLines={3}
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                        onSubmitEditing={Keyboard.dismiss}
                                    />

                                    <TouchableOpacity
                                        style={[styles.askButton, aiLoading && styles.askButtonDisabled]}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            askAI();
                                        }}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.askButtonText}>Demander à l'IA</Text>
                                        )}
                                    </TouchableOpacity>

                                    {aiResponse ? (
                                        <View style={styles.aiResponseContainer}>
                                            <Text style={styles.aiResponseTitle}>Réponse :</Text>
                                            <Text style={styles.aiResponseText}>{aiResponse}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableWithoutFeedback>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#8a8a8a',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    errorText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    backButtonText: {
        color: '#1a1a2e',
        fontSize: 24,
        fontWeight: '300',
        marginTop: -2,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#8a8a8a',
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    pageIndicator: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    pageText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
        textAlign: 'center',
    },
    progressBar: {
        height: 3,
        backgroundColor: '#e8eaed',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#1a1a2e',
        borderRadius: 2,
    },
    webViewContainer: {
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    webView: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navigationContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 30,
        gap: 10,
        backgroundColor: '#f8f9fa',
    },
    navButton: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#ccc',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    colorPickerModal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 12,
    },
    selectedTextBox: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    selectedTextPreview: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
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
        fontWeight: '600',
        color: '#333',
    },
    askAIButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },
    askAIButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 15,
        fontWeight: '500',
    },
    aiModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    aiModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 24,
        maxHeight: '85%',
    },
    aiModalContent: {
        flexGrow: 0,
    },
    aiModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    closeButtonContainer: {
        padding: 8,
        marginRight: -8,
    },
    closeButton: {
        fontSize: 28,
        color: '#666',
        fontWeight: '300',
    },
    closeModalButton: {
        marginTop: 16,
        paddingVertical: 16,
        paddingBottom: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    closeModalButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    aiContextInfo: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
    aiQuestionInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    askButton: {
        backgroundColor: '#1a1a2e',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    askButtonDisabled: {
        backgroundColor: '#ccc',
    },
    askButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    aiResponseContainer: {
        marginTop: 20,
        marginBottom: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 16,
    },
    aiResponseTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    aiResponseText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 24,
    },
});

export default CourseViewerScreen;
