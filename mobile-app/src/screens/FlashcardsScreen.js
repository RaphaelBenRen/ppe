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
} from 'react-native';
import { useData } from '../context/DataContext';
import { flashcardsAPI } from '../utils/api';

const FlashcardsScreen = ({ navigation }) => {
    const { flashcards, refreshFlashcards } = useData();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteFlashcard = (flashcard) => {
        Alert.alert(
            'Supprimer les flashcards',
            `Voulez-vous vraiment supprimer "${flashcard.titre}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(flashcard.id);
                            await flashcardsAPI.deleteFlashcardSet(flashcard.id);
                            await refreshFlashcards();
                        } catch (error) {
                            Alert.alert('Erreur', error.message || 'Impossible de supprimer les flashcards');
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderFlashcardSet = ({ item }) => (
        <View style={styles.flashcardCard}>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteFlashcard(item)}
                disabled={deletingId === item.id}
            >
                {deletingId === item.id ? (
                    <ActivityIndicator size="small" color="#999" />
                ) : (
                    <Text style={styles.deleteButtonText}>×</Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.flashcardMain}
                onPress={() => navigation.navigate('FlashcardDetail', { flashcardId: item.id, flashcardTitle: item.titre })}
                activeOpacity={0.7}
            >
                <View style={styles.flashcardIcon}>
                    <Text style={styles.flashcardIconText}>☆</Text>
                </View>
                <View style={styles.flashcardInfo}>
                    <Text style={styles.flashcardTitle} numberOfLines={1}>{item.titre}</Text>
                    <Text style={styles.flashcardMeta}>
                        {item.nombre_flashcards} cartes • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </TouchableOpacity>
            <View style={styles.flashcardActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('FlashcardDetail', { flashcardId: item.id, flashcardTitle: item.titre })}
                >
                    <Text style={styles.actionBtnText}>Réviser</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Mes Flashcards</Text>
                <Text style={styles.headerCount}>{flashcards.length}</Text>
            </View>

            {flashcards.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>☆</Text>
                    </View>
                    <Text style={[styles.emptyText, isTablet && styles.emptyTextTablet]}>Aucune flashcard générée</Text>
                    <Text style={[styles.emptySubtext, isTablet && styles.emptySubtextTablet]}>
                        Uploadez un cours et générez vos premières flashcards !
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={flashcards}
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 15,
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
    list: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    flashcardCard: {
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
    flashcardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    flashcardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flashcardIconText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    flashcardInfo: {
        flex: 1,
        marginLeft: 14,
    },
    flashcardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    flashcardMeta: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 3,
    },
    flashcardActions: {
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
    },
    emptySubtextTablet: {
        fontSize: 16,
    },
});

export default FlashcardsScreen;
