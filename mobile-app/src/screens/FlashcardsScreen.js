import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    useWindowDimensions,
} from 'react-native';
import { useData } from '../context/DataContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FlashcardsScreen = ({ navigation }) => {
    const { flashcards } = useData();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

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
                <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Mes Flashcards</Text>
            </View>

            {flashcards.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>F</Text>
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
                    contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
                    numColumns={isTablet ? 2 : 1}
                    key={isTablet ? 'tablet' : 'phone'}
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
        paddingHorizontal: '5%',
        paddingTop: 55,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    headerTitleTablet: {
        fontSize: 28,
        textAlign: 'center',
    },
    list: {
        paddingHorizontal: '5%',
        paddingTop: 10,
        paddingBottom: 20,
    },
    listTablet: {
        paddingHorizontal: '3%',
    },
    flashcardCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        marginHorizontal: SCREEN_WIDTH >= 768 ? 8 : 0,
        flex: SCREEN_WIDTH >= 768 ? 1 : undefined,
        maxWidth: SCREEN_WIDTH >= 768 ? '48%' : '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        flex: 1,
    },
    cardCount: {
        fontSize: 12,
        color: '#1a1a2e',
        backgroundColor: '#e8eaed',
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
        paddingHorizontal: '10%',
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
        color: '#1a1a2e',
        fontWeight: '700',
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
        color: '#666',
        textAlign: 'center',
    },
    emptySubtextTablet: {
        fontSize: 16,
    },
});

export default FlashcardsScreen;
