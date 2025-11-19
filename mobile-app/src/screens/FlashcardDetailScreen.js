import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { flashcardsAPI } from '../utils/api';

const FlashcardDetailScreen = ({ route, navigation }) => {
    const { flashcardId, flashcardTitle } = route.params;
    const [loading, setLoading] = useState(true);
    const [flashcardData, setFlashcardData] = useState(null);
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flipAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        loadFlashcards();
    }, []);

    const loadFlashcards = async () => {
        setLoading(true);
        try {
            const response = await flashcardsAPI.getFlashcardSet(flashcardId);
            if (response.success) {
                // Le backend retourne cards_data, on doit le transformer en cards
                const data = {
                    ...response.data,
                    cards: response.data.cards_data || []
                };
                setFlashcardData(data);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement des flashcards');
            console.error('Erreur chargement flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    const flipCard = () => {
        if (isFlipped) {
            Animated.spring(flipAnimation, {
                toValue: 0,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(flipAnimation, {
                toValue: 180,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start();
        }
        setIsFlipped(!isFlipped);
    };

    const handleNext = () => {
        if (currentCard < flashcardData.cards.length - 1) {
            setCurrentCard(currentCard + 1);
            if (isFlipped) {
                flipCard();
            }
        }
    };

    const handlePrevious = () => {
        if (currentCard > 0) {
            setCurrentCard(currentCard - 1);
            if (isFlipped) {
                flipCard();
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#764ba2" />
                <Text style={styles.loadingText}>Chargement des flashcards...</Text>
            </View>
        );
    }

    if (!flashcardData || !flashcardData.cards || flashcardData.cards.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Aucune flashcard disponible</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const card = flashcardData.cards[currentCard];
    const progress = ((currentCard + 1) / flashcardData.cards.length) * 100;

    const frontInterpolate = flipAnimation.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnimation.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnimation.interpolate({
        inputRange: [0, 90, 90, 180],
        outputRange: [1, 1, 0, 0],
    });

    const backOpacity = flipAnimation.interpolate({
        inputRange: [0, 90, 90, 180],
        outputRange: [0, 0, 1, 1],
    });

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'facile':
                return '#4caf50';
            case 'moyen':
                return '#ff9800';
            case 'difficile':
                return '#f44336';
            default:
                return '#999';
        }
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
                <Text style={styles.headerTitle}>{flashcardTitle}</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.content}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardCounter}>
                        Carte {currentCard + 1}/{flashcardData.cards.length}
                    </Text>
                    {card.difficulty && (
                        <View style={[
                            styles.difficultyBadge,
                            { backgroundColor: getDifficultyColor(card.difficulty) }
                        ]}>
                            <Text style={styles.difficultyText}>{card.difficulty}</Text>
                        </View>
                    )}
                </View>

                {card.category && (
                    <View style={styles.categoryContainer}>
                        <Text style={styles.categoryLabel}>📚 {card.category}</Text>
                    </View>
                )}

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={flipCard}
                    style={styles.cardContainer}
                >
                    <Animated.View
                        style={[
                            styles.card,
                            styles.cardFront,
                            {
                                transform: [{ rotateY: frontInterpolate }],
                                opacity: frontOpacity,
                            },
                        ]}
                    >
                        <Text style={styles.cardLabel}>Question</Text>
                        <Text style={styles.cardContent}>{card.front}</Text>
                        <Text style={styles.tapHint}>👆 Appuyez pour retourner</Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.card,
                            styles.cardBack,
                            {
                                transform: [{ rotateY: backInterpolate }],
                                opacity: backOpacity,
                            },
                        ]}
                    >
                        <Text style={styles.cardLabel}>Réponse</Text>
                        <Text style={styles.cardContent}>{card.back}</Text>
                        <Text style={styles.tapHint}>👆 Appuyez pour retourner</Text>
                    </Animated.View>
                </TouchableOpacity>

                <View style={styles.helpText}>
                    <Text style={styles.helpTextContent}>
                        💡 Astuce : Essayez de répondre avant de retourner la carte
                    </Text>
                </View>
            </View>

            <View style={styles.navigationButtons}>
                <TouchableOpacity
                    style={[styles.navButton, currentCard === 0 && styles.navButtonDisabled]}
                    onPress={handlePrevious}
                    disabled={currentCard === 0}
                >
                    <Text style={styles.navButtonText}>← Précédent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, currentCard === flashcardData.cards.length - 1 && styles.navButtonDisabled]}
                    onPress={handleNext}
                    disabled={currentCard === flashcardData.cards.length - 1}
                >
                    <Text style={styles.navButtonText}>Suivant →</Text>
                </TouchableOpacity>
            </View>
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
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#764ba2',
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
        backgroundColor: '#764ba2',
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
        backgroundColor: '#764ba2',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    cardInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardCounter: {
        fontSize: 16,
        fontWeight: '600',
        color: '#764ba2',
    },
    difficultyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    difficultyText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    categoryContainer: {
        marginBottom: 15,
    },
    categoryLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    cardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    card: {
        width: '100%',
        height: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        backfaceVisibility: 'hidden',
    },
    cardFront: {
        position: 'absolute',
    },
    cardBack: {
        position: 'absolute',
        backgroundColor: '#764ba2',
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    cardContent: {
        fontSize: 20,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
        lineHeight: 32,
    },
    tapHint: {
        position: 'absolute',
        bottom: 30,
        fontSize: 12,
        color: '#999',
    },
    helpText: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#764ba2',
    },
    helpTextContent: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
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
        backgroundColor: '#764ba2',
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
});

export default FlashcardDetailScreen;
