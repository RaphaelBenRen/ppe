import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { flashcardsAPI } from '../utils/api';

const FlashcardsScreen = ({ navigation }) => {
    const [flashcardSets, setFlashcardSets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFlashcards();
    }, []);

    const loadFlashcards = async () => {
        setLoading(true);
        try {
            const response = await flashcardsAPI.getMyFlashcards();
            if (response.success) {
                setFlashcardSets(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderFlashcardSet = ({ item }) => (
        <TouchableOpacity
            style={styles.flashcardCard}
            onPress={() => navigation.navigate('FlashcardDetail', { flashcardId: item.id, flashcardTitle: item.titre })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.titre}</Text>
                <Text style={styles.cardCount}>{item.nombre_flashcards} cartes</Text>
            </View>
            <Text style={styles.cardInfo}>
                Créé le {new Date(item.created_at).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🗂️ Mes Flashcards</Text>
            </View>

            {loading ? (
                <ActivityIndicator color="#764ba2" style={{ marginTop: 50 }} />
            ) : flashcardSets.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🗂️</Text>
                    <Text style={styles.emptyText}>Aucune flashcard générée</Text>
                    <Text style={styles.emptySubtext}>
                        Uploadez un cours et générez vos premières flashcards !
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={flashcardSets}
                    renderItem={renderFlashcardSet}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        backgroundColor: '#764ba2',
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        padding: 20,
    },
    flashcardCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    cardCount: {
        fontSize: 12,
        color: '#764ba2',
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontWeight: '600',
    },
    cardInfo: {
        fontSize: 12,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default FlashcardsScreen;
