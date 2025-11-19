import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { qcmAPI } from '../utils/api';

const QCMDetailScreen = ({ route, navigation }) => {
    const { qcmId, qcmTitle } = route.params;
    const [loading, setLoading] = useState(true);
    const [qcmData, setQcmData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        loadQCM();
    }, []);

    const loadQCM = async () => {
        setLoading(true);
        try {
            const response = await qcmAPI.getQCM(qcmId);
            if (response.success) {
                // Le backend retourne questions_data, on doit le transformer en questions
                const data = {
                    ...response.data,
                    questions: response.data.questions_data || []
                };
                setQcmData(data);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement du QCM');
            console.error('Erreur chargement QCM:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (answer) => {
        if (showResults) return;

        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestion]: answer
        });
    };

    const handleNext = () => {
        if (currentQuestion < qcmData.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = () => {
        let correctCount = 0;
        qcmData.questions.forEach((q, index) => {
            if (selectedAnswers[index] === q.correct_answer) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setShowResults(true);
    };

    const handleRetry = () => {
        setSelectedAnswers({});
        setShowResults(false);
        setScore(0);
        setCurrentQuestion(0);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Chargement du QCM...</Text>
            </View>
        );
    }

    if (!qcmData || !qcmData.questions || qcmData.questions.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Aucune question disponible</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const question = qcmData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / qcmData.questions.length) * 100;

    if (showResults) {
        const percentage = Math.round((score / qcmData.questions.length) * 100);
        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Retour</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Résultats</Text>
                </View>

                <View style={styles.resultsContainer}>
                    <View style={styles.scoreCard}>
                        <Text style={styles.scoreTitle}>Score final</Text>
                        <Text style={styles.scoreValue}>{percentage}%</Text>
                        <Text style={styles.scoreDetails}>
                            {score} / {qcmData.questions.length} bonnes réponses
                        </Text>
                    </View>

                    <View style={styles.questionsList}>
                        {qcmData.questions.map((q, index) => {
                            const userAnswer = selectedAnswers[index];
                            const isCorrect = userAnswer === q.correct_answer;

                            return (
                                <View key={index} style={styles.resultItem}>
                                    <View style={styles.resultHeader}>
                                        <Text style={styles.resultNumber}>Q{index + 1}</Text>
                                        <View style={[
                                            styles.resultBadge,
                                            { backgroundColor: isCorrect ? '#4caf50' : '#f44336' }
                                        ]}>
                                            <Text style={styles.resultBadgeText}>
                                                {isCorrect ? '✓' : '✗'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.resultQuestion}>{q.question}</Text>
                                    {!isCorrect && (
                                        <View style={styles.answerInfo}>
                                            <Text style={styles.wrongAnswer}>
                                                Votre réponse: {userAnswer || 'Non répondu'}
                                            </Text>
                                            <Text style={styles.correctAnswer}>
                                                Bonne réponse: {q.correct_answer}
                                            </Text>
                                        </View>
                                    )}
                                    {q.explanation && (
                                        <Text style={styles.explanation}>{q.explanation}</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.retryBtn]}
                            onPress={handleRetry}
                        >
                            <Text style={styles.actionBtnText}>🔄 Recommencer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.backBtn]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.actionBtnText}>← Retour</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{qcmTitle}</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.questionCard}>
                    <View style={styles.questionHeader}>
                        <Text style={styles.questionNumber}>
                            Question {currentQuestion + 1}/{qcmData.questions.length}
                        </Text>
                        {question.difficulty && (
                            <View style={[styles.difficultyBadge, getDifficultyColor(question.difficulty)]}>
                                <Text style={styles.difficultyText}>{question.difficulty}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.questionText}>{question.question}</Text>

                    <View style={styles.optionsContainer}>
                        {Object.entries(question.options).map(([key, value]) => {
                            const isSelected = selectedAnswers[currentQuestion] === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.optionButton,
                                        isSelected && styles.optionButtonSelected
                                    ]}
                                    onPress={() => handleSelectAnswer(key)}
                                >
                                    <View style={[
                                        styles.optionCircle,
                                        isSelected && styles.optionCircleSelected
                                    ]}>
                                        <Text style={[
                                            styles.optionLetter,
                                            isSelected && styles.optionLetterSelected
                                        ]}>{key}</Text>
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected
                                    ]}>{value}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.navigationButtons}>
                <TouchableOpacity
                    style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
                    onPress={handlePrevious}
                    disabled={currentQuestion === 0}
                >
                    <Text style={styles.navButtonText}>← Précédent</Text>
                </TouchableOpacity>

                {currentQuestion === qcmData.questions.length - 1 ? (
                    <TouchableOpacity
                        style={[styles.navButton, styles.submitButton]}
                        onPress={handleSubmit}
                    >
                        <Text style={[styles.navButtonText, styles.submitButtonText]}>Terminer</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={handleNext}
                    >
                        <Text style={styles.navButtonText}>Suivant →</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'facile':
            return { backgroundColor: '#4caf50' };
        case 'moyen':
            return { backgroundColor: '#ff9800' };
        case 'difficile':
            return { backgroundColor: '#f44336' };
        default:
            return { backgroundColor: '#999' };
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
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
        backgroundColor: '#f5f7fa',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#667eea',
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
        backgroundColor: '#667eea',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginBottom: 15,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    optionButtonSelected: {
        borderColor: '#667eea',
        backgroundColor: '#f0f3ff',
    },
    optionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionCircleSelected: {
        backgroundColor: '#667eea',
    },
    optionLetter: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    optionLetterSelected: {
        color: '#fff',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    optionTextSelected: {
        color: '#667eea',
        fontWeight: '600',
    },
    navigationButtons: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    navButton: {
        flex: 1,
        backgroundColor: '#667eea',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#ccc',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#4caf50',
    },
    submitButtonText: {
        color: '#fff',
    },
    resultsContainer: {
        padding: 20,
    },
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#667eea',
    },
    scoreDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    questionsList: {
        gap: 15,
        marginBottom: 20,
    },
    resultItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    resultNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    resultBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultBadgeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    answerInfo: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#f5f7fa',
        borderRadius: 8,
    },
    wrongAnswer: {
        fontSize: 13,
        color: '#f44336',
        marginBottom: 5,
    },
    correctAnswer: {
        fontSize: 13,
        color: '#4caf50',
        fontWeight: '600',
    },
    explanation: {
        fontSize: 13,
        color: '#666',
        marginTop: 10,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    actionsContainer: {
        gap: 10,
    },
    actionBtn: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    retryBtn: {
        backgroundColor: '#667eea',
    },
    backBtn: {
        backgroundColor: '#999',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default QCMDetailScreen;
