import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { qcmAPI } from '../utils/api';

const QCMHistoryScreen = ({ route, navigation }) => {
    const { qcmId, qcmTitle } = route.params;
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        loadAttempts();
    }, []);

    const loadAttempts = async () => {
        setLoading(true);
        try {
            const response = await qcmAPI.getAttempts(qcmId);
            if (response.success) {
                setAttempts(response.data);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors du chargement de l\'historique');
            console.error('Erreur chargement historique:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4caf50';
        if (score >= 60) return '#ff9800';
        return '#f44336';
    };

    const viewAttemptDetail = (attemptId) => {
        navigation.navigate('QCMAttemptDetail', {
            qcmId,
            attemptId,
            qcmTitle
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a2e" />
                <Text style={styles.loadingText}>Chargement de l'historique...</Text>
            </View>
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
                <Text style={styles.headerTitle}>Historique</Text>
                <Text style={styles.headerSubtitle}>{qcmTitle}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {attempts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📊</Text>
                        <Text style={styles.emptyText}>Aucune tentative enregistrée</Text>
                        <Text style={styles.emptySubtext}>
                            Complétez le QCM pour voir vos résultats ici
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsCard}>
                            <Text style={styles.statsTitle}>Statistiques globales</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{attempts.length}</Text>
                                    <Text style={styles.statLabel}>Tentatives</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: getScoreColor(Math.max(...attempts.map(a => a.score))) }]}>
                                        {Math.max(...attempts.map(a => a.score))}%
                                    </Text>
                                    <Text style={styles.statLabel}>Meilleur score</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)}%
                                    </Text>
                                    <Text style={styles.statLabel}>Moyenne</Text>
                                </View>
                            </View>
                        </View>

                        {attempts.length > 1 && (
                            <View style={styles.chartCard}>
                                <Text style={styles.chartTitle}>📈 Graphique de progression</Text>
                                <View style={styles.chartContainer}>
                                    <View style={styles.yAxis}>
                                        <Text style={styles.yAxisLabel}>100%</Text>
                                        <Text style={styles.yAxisLabel}>75%</Text>
                                        <Text style={styles.yAxisLabel}>50%</Text>
                                        <Text style={styles.yAxisLabel}>25%</Text>
                                        <Text style={styles.yAxisLabel}>0%</Text>
                                    </View>
                                    <View style={styles.chartArea}>
                                        <View style={styles.gridLines}>
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                        </View>

                                        {/* Barres de progression simplifiées */}
                                        <View style={styles.barsContainer}>
                                            {[...attempts].reverse().map((attempt, index, arr) => (
                                                <View key={attempt.id} style={styles.barWrapper}>
                                                    <View style={styles.barColumn}>
                                                        <View
                                                            style={[
                                                                styles.progressBar,
                                                                {
                                                                    height: `${attempt.score}%`,
                                                                    backgroundColor: getScoreColor(attempt.score)
                                                                }
                                                            ]}
                                                        >
                                                            <Text style={styles.scoreLabel}>{attempt.score}%</Text>
                                                        </View>
                                                    </View>
                                                    <Text style={styles.attemptLabel}>#{index + 1}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.chartLegend}>Numéro de tentative</Text>
                            </View>
                        )}

                        <View style={styles.attemptsSection}>
                            <Text style={styles.sectionTitle}>Toutes les tentatives</Text>
                            {attempts.map((attempt, index) => (
                                <TouchableOpacity
                                    key={attempt.id}
                                    style={styles.attemptCard}
                                    onPress={() => viewAttemptDetail(attempt.id)}
                                >
                                    <View style={styles.attemptHeader}>
                                        <Text style={styles.attemptNumber}>Tentative #{attempts.length - index}</Text>
                                        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(attempt.score) }]}>
                                            <Text style={styles.scoreText}>{attempt.score}%</Text>
                                        </View>
                                    </View>

                                    <View style={styles.attemptStats}>
                                        <View style={styles.attemptStat}>
                                            <Text style={styles.attemptStatLabel}>✅ Correctes</Text>
                                            <Text style={styles.attemptStatValue}>{attempt.nombre_correctes}</Text>
                                        </View>
                                        <View style={styles.attemptStat}>
                                            <Text style={styles.attemptStatLabel}>❌ Incorrectes</Text>
                                            <Text style={styles.attemptStatValue}>{attempt.nombre_incorrectes}</Text>
                                        </View>
                                        {attempt.temps_ecoule && (
                                            <View style={styles.attemptStat}>
                                                <Text style={styles.attemptStatLabel}>⏱️ Temps</Text>
                                                <Text style={styles.attemptStatValue}>{formatTime(attempt.temps_ecoule)}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.attemptDate}>{formatDate(attempt.completed_at)}</Text>

                                    <View style={styles.viewDetailButton}>
                                        <Text style={styles.viewDetailText}>Voir le détail →</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
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
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: '5%',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButtonText: {
        color: '#1a1a2e',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: '5%',
        paddingVertical: 15,
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 15,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 220,
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 10,
        paddingVertical: 10,
    },
    yAxisLabel: {
        fontSize: 10,
        color: '#999',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
    },
    gridLines: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        bottom: 10,
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 200,
        paddingHorizontal: 10,
        paddingBottom: 5,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 3,
    },
    barColumn: {
        width: '100%',
        height: 200,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        maxWidth: 40,
        borderRadius: 8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 5,
        minHeight: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    scoreLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    attemptLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 5,
        fontWeight: '600',
    },
    chartLegend: {
        textAlign: 'center',
        fontSize: 11,
        color: '#666',
        marginTop: 10,
    },
    attemptsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 15,
    },
    attemptCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    attemptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    attemptNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    scoreText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    attemptStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    attemptStat: {
        alignItems: 'center',
    },
    attemptStatLabel: {
        fontSize: 11,
        color: '#666',
        marginBottom: 4,
    },
    attemptStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    attemptDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    viewDetailButton: {
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    viewDetailText: {
        fontSize: 13,
        color: '#1a1a2e',
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 50,
        marginBottom: 16,
        color: '#1a1a2e',
        fontWeight: '700',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default QCMHistoryScreen;
