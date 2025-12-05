import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { summariesAPI } from '../utils/api';

const SummariesScreen = ({ navigation }) => {
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSummaries = async () => {
        try {
            const response = await summariesAPI.getMySummaries();
            if (response.success) {
                setSummaries(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement résumés:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSummaries();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadSummaries();
    };

    const handleDeleteSummary = (summaryId, titre) => {
        Alert.alert(
            'Supprimer ce résumé',
            `Voulez-vous vraiment supprimer "${titre}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await summariesAPI.deleteSummary(summaryId);
                            loadSummaries();
                        } catch (error) {
                            Alert.alert('Erreur', 'Erreur lors de la suppression');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderSummary = ({ item }) => (
        <View style={styles.summaryCard}>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSummary(item.id, item.titre)}
            >
                <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.summaryMain}
                onPress={() => navigation.navigate('SummaryViewer', {
                    summaryId: item.id,
                    summaryTitre: item.titre,
                })}
                activeOpacity={0.7}
            >
                <View style={styles.summaryIcon}>
                    <Text style={styles.summaryIconText}>📝</Text>
                </View>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle} numberOfLines={1}>{item.titre}</Text>
                    <Text style={styles.summaryMeta}>
                        {item.matiere} • {formatDate(item.created_at)}
                    </Text>
                    {item.original_course_titre && (
                        <Text style={styles.summarySource} numberOfLines={1}>
                            Source: {item.original_course_titre}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes Résumés</Text>
                <Text style={styles.headerSubtitle}>
                    {summaries.length} résumé{summaries.length > 1 ? 's' : ''}
                </Text>
            </View>

            {/* Liste des résumés */}
            {summaries.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text style={styles.emptyTitle}>Aucun résumé</Text>
                    <Text style={styles.emptyText}>
                        Générez un résumé depuis un cours pour le retrouver ici
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={summaries}
                    renderItem={renderSummary}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8a8a8a',
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    summaryCard: {
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
    summaryMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryIconText: {
        fontSize: 22,
    },
    summaryInfo: {
        flex: 1,
        marginLeft: 14,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    summaryMeta: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 3,
    },
    summarySource: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
        fontStyle: 'italic',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#8a8a8a',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default SummariesScreen;
