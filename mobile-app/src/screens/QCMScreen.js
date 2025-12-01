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
import { qcmAPI } from '../utils/api';

const QCMScreen = ({ navigation }) => {
    const { qcms, refreshQCMs } = useData();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteQCM = (qcm) => {
        Alert.alert(
            'Supprimer le QCM',
            `Voulez-vous vraiment supprimer "${qcm.titre}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(qcm.id);
                            await qcmAPI.deleteQCM(qcm.id);
                            await refreshQCMs();
                        } catch (error) {
                            Alert.alert('Erreur', error.message || 'Impossible de supprimer le QCM');
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    const getDifficultyLabel = (difficulte) => {
        switch (difficulte) {
            case 'facile': return 'Facile';
            case 'moyen': return 'Moyen';
            case 'difficile': return 'Difficile';
            default: return difficulte;
        }
    };

    const renderQCM = ({ item }) => (
        <View style={styles.qcmCard}>
            <TouchableOpacity
                style={styles.qcmMain}
                onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
                activeOpacity={0.7}
            >
                <View style={styles.qcmIcon}>
                    <Text style={styles.qcmIconText}>★</Text>
                </View>
                <View style={styles.qcmInfo}>
                    <Text style={styles.qcmTitle} numberOfLines={1}>{item.titre}</Text>
                    <Text style={styles.qcmMeta}>
                        {item.nombre_questions} questions • {getDifficultyLabel(item.difficulte)}
                    </Text>
                </View>
                <Text style={styles.qcmArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.qcmActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('QCMDetail', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionBtnText}>Commencer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('QCMHistory', { qcmId: item.id, qcmTitle: item.titre })}
                >
                    <Text style={styles.actionBtnText}>Historique</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteQCM(item)}
                    disabled={deletingId === item.id}
                >
                    {deletingId === item.id ? (
                        <ActivityIndicator size="small" color="#e53e3e" />
                    ) : (
                        <Text style={styles.deleteBtnText}>Suppr.</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Mes QCMs</Text>
                <Text style={styles.headerCount}>{qcms.length}</Text>
            </View>

            {qcms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>★</Text>
                    </View>
                    <Text style={[styles.emptyText, isTablet && styles.emptyTextTablet]}>Aucun QCM généré</Text>
                    <Text style={[styles.emptySubtext, isTablet && styles.emptySubtextTablet]}>
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
    qcmCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    qcmMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    qcmIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qcmIconText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    qcmInfo: {
        flex: 1,
        marginLeft: 14,
    },
    qcmTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    qcmMeta: {
        fontSize: 12,
        color: '#8a8a8a',
        marginTop: 3,
    },
    qcmArrow: {
        fontSize: 24,
        color: '#c0c0c0',
        fontWeight: '300',
    },
    qcmActions: {
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
    deleteBtn: {
        backgroundColor: '#fff5f5',
        flex: 0.6,
    },
    deleteBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#e53e3e',
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

export default QCMScreen;
