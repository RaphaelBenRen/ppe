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

const QCMScreen = ({ navigation }) => {
    const { qcms } = useData();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

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

    const getDifficultyColor = () => {
        return { backgroundColor: '#e8eaed' };
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Mes QCMs</Text>
            </View>

            {qcms.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>Q</Text>
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
    qcmCard: {
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
    qcmHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    qcmTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#333',
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
        backgroundColor: '#1a1a2e',
    },
    historyButton: {
        backgroundColor: '#4a5568',
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

export default QCMScreen;
