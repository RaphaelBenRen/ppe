import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { qcmAPI } from '../utils/api';

const QCMScreen = ({ navigation }) => {
    const [qcms, setQcms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQCMs();
    }, []);

    const loadQCMs = async () => {
        setLoading(true);
        try {
            const response = await qcmAPI.getMyQCMs();
            if (response.success) {
                setQcms(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement QCMs:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderQCM = ({ item }) => (
        <View style={styles.qcmCard}>
            <TouchableOpacity
                onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
            >
                <View style={styles.qcmHeader}>
                    <Text style={styles.qcmTitle}>{item.titre}</Text>
                    <View style={[styles.badge, getDifficultyColor(item.difficulte)]}>
                        <Text style={styles.badgeText}>{item.difficulte}</Text>
                    </View>
                </View>
                <Text style={styles.qcmInfo}>
                    {item.nombre_questions} questions • Créé le {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </TouchableOpacity>

            <View style={styles.qcmActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.startButton]}
                    onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionButtonText}>▶ Commencer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.historyButton]}
                    onPress={() => navigation.navigate('QCMHistory', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionButtonText}>📊 Historique</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const getDifficultyColor = (difficulte) => {
        switch (difficulte) {
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📝 Mes QCMs</Text>
            </View>

            {loading ? (
                <ActivityIndicator color="#667eea" style={{ marginTop: 50 }} />
            ) : qcms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text style={styles.emptyText}>Aucun QCM généré</Text>
                    <Text style={styles.emptySubtext}>
                        Uploadez un cours et générez votre premier QCM !
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={qcms}
                    renderItem={renderQCM}
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
        backgroundColor: '#667eea',
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
    qcmCard: {
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
    qcmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    qcmTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    qcmInfo: {
        fontSize: 12,
        color: '#666',
    },
    qcmActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#667eea',
    },
    historyButton: {
        backgroundColor: '#2196f3',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
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

export default QCMScreen;
