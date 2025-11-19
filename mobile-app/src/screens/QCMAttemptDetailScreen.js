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

const QCMAttemptDetailScreen = ({ route, navigation }) => {
    const { qcmId, attemptId, qcmTitle } = route.params;
    const [loading, setLoading] = useState(true);
    const [attemptData, setAttemptData] = useState(null);

    useEffect(() => {
        loadAttemptDetail();
    }, []);

    const loadAttemptDetail = async () => {
        setLoading(true);
        try {
            const response = await qcmAPI.getAttemptDetail(qcmId, attemptId);
            if (response.success) {
                setAttemptData(response.data);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement du détail');
            console.error('Erreur chargement détail tentative:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Chargement du détail...</Text>
            </View>
        );
    }

    if (!attemptData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Tentative non trouvée</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getScoreColor = (score) => {
        if (score >= 80) return '#4caf50';
        if (score >= 60) return '#ff9800';
        return '#f44336';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détail de la tentative</Text>
                <Text style={styles.headerSubtitle}>{qcmTitle}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.summaryCard}>
                    <View style={styles.scoreCircle}>
                        <Text style={[styles.scoreValue, { color: getScoreColor(attemptData.score) }]}>
                            {attemptData.score}%
                        </Text>
                        <Text style={styles.scoreLabel}>Score obtenu</Text>
                    </View>

                    <View style={styles.summaryStats}>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatValue}>{attemptData.nombre_correctes}</Text>
                            <Text style={[styles.summaryStatLabel, { color: '#4caf50' }]}>✅ Correctes</Text>
                        </View>
                        <View style={styles.summaryStatItem}>
                            <Text style={styles.summaryStatValue}>{attemptData.nombre_incorrectes}</Text>
                            <Text style={[styles.summaryStatLabel, { color: '#f44336' }]}>❌ Incorrectes</Text>
                        </View>
                    </View>

                    <Text style={styles.attemptDate}>
                        Complété le {formatDate(attemptData.completed_at)}
                    </Text>
                </View>

                <View style={styles.questionsSection}>
                    <Text style={styles.sectionTitle}>Détail des réponses</Text>
                    {attemptData.answers_data.map((answer, index) => (
                        <View key={index} style={[
                            styles.answerCard,
                            answer.isCorrect ? styles.answerCardCorrect : styles.answerCardIncorrect
                        ]}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                <View style={[
                                    styles.answerBadge,
                                    { backgroundColor: answer.isCorrect ? '#4caf50' : '#f44336' }
                                ]}>
                                    <Text style={styles.answerBadgeText}>
                                        {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.questionText}>{answer.question}</Text>

                            <View style={styles.answersSection}>
                                {Object.entries(answer.options).map(([key, value]) => {
                                    const isUserAnswer = answer.userAnswer === key;
                                    const isCorrectAnswer = answer.correctAnswer === key;

                                    return (
                                        <View
                                            key={key}
                                            style={[
                                                styles.optionItem,
                                                isCorrectAnswer && styles.optionCorrect,
                                                isUserAnswer && !isCorrectAnswer && styles.optionIncorrect
                                            ]}
                                        >
                                            <View style={styles.optionCircle}>
                                                <Text style={styles.optionLetter}>{key}</Text>
                                                {isCorrectAnswer && <Text style={styles.checkmark}>✓</Text>}
                                                {isUserAnswer && !isCorrectAnswer && <Text style={styles.cross}>✗</Text>}
                                            </View>
                                            <Text style={styles.optionText}>{value}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {!answer.isCorrect && answer.userAnswer && (
                                <View style={styles.answerInfo}>
                                    <Text style={styles.yourAnswer}>
                                        Votre réponse: {answer.userAnswer}
                                    </Text>
                                    <Text style={styles.correctAnswerText}>
                                        Bonne réponse: {answer.correctAnswer}
                                    </Text>
                                </View>
                            )}

                            {answer.explanation && (
                                <View style={styles.explanationBox}>
                                    <Text style={styles.explanationTitle}>💡 Explication</Text>
                                    <Text style={styles.explanationText}>{answer.explanation}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
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
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
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
    headerSubtitle: {
        fontSize: 14,
        color: '#e0e7ff',
        marginTop: 5,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreCircle: {
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    summaryStats: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        marginBottom: 15,
    },
    summaryStatItem: {
        alignItems: 'center',
    },
    summaryStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    summaryStatLabel: {
        fontSize: 12,
        marginTop: 5,
    },
    attemptDate: {
        fontSize: 12,
        color: '#999',
    },
    questionsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    answerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    answerCardCorrect: {
        borderLeftColor: '#4caf50',
    },
    answerCardIncorrect: {
        borderLeftColor: '#f44336',
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    questionNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
    },
    answerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    answerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        lineHeight: 22,
    },
    answersSection: {
        marginBottom: 10,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    optionCorrect: {
        backgroundColor: '#e8f5e9',
        borderWidth: 1,
        borderColor: '#4caf50',
    },
    optionIncorrect: {
        backgroundColor: '#ffebee',
        borderWidth: 1,
        borderColor: '#f44336',
    },
    optionCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        position: 'relative',
    },
    optionLetter: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    checkmark: {
        position: 'absolute',
        top: -6,
        right: -6,
        fontSize: 16,
        color: '#4caf50',
    },
    cross: {
        position: 'absolute',
        top: -6,
        right: -6,
        fontSize: 16,
        color: '#f44336',
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    answerInfo: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginTop: 8,
    },
    yourAnswer: {
        fontSize: 13,
        color: '#f44336',
        marginBottom: 4,
    },
    correctAnswerText: {
        fontSize: 13,
        color: '#4caf50',
        fontWeight: '600',
    },
    explanationBox: {
        marginTop: 10,
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2196f3',
    },
    explanationTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 5,
    },
    explanationText: {
        fontSize: 13,
        color: '#333',
        lineHeight: 20,
    },
});

export default QCMAttemptDetailScreen;
