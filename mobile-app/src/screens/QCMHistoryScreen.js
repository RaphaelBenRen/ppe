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
import Svg, { Path, Circle, Line } from 'react-native-svg';
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

    const getScoreColor = () => {
        return '#e8eaed';
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
                                    <Text style={styles.statValue}>
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

                        {attempts.length > 1 && (() => {
                            const reversedAttempts = [...attempts].reverse();
                            const graphHeight = 160; // Hauteur totale de la zone (alignée avec yAxis)
                            const graphWidth = 250; // Largeur de la zone de graphique
                            const marginLeft = 15; // Marge pour le premier point
                            const marginRight = 15; // Marge pour le dernier point
                            const pointRadius = 7; // Rayon du point
                            const usableWidth = graphWidth - marginLeft - marginRight;
                            // On réserve de l'espace en haut et en bas pour que les points ne soient pas coupés
                            const usableHeight = graphHeight - (pointRadius * 2);

                            // Calcul des positions des points
                            const points = reversedAttempts.map((attempt, index) => {
                                const x = reversedAttempts.length === 1
                                    ? graphWidth / 2
                                    : marginLeft + (index / (reversedAttempts.length - 1)) * usableWidth;
                                // y = pointRadius pour 100%, y = graphHeight - pointRadius pour 0%
                                const y = pointRadius + usableHeight - (attempt.score / 100) * usableHeight;
                                return { x, y, score: attempt.score };
                            });

                            return (
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
                                            {/* Grille de fond */}
                                            <View style={[styles.gridLines, { height: graphHeight }]}>
                                                <View style={styles.gridLine} />
                                                <View style={styles.gridLine} />
                                                <View style={styles.gridLine} />
                                                <View style={styles.gridLine} />
                                                <View style={styles.gridLine} />
                                            </View>

                                            {/* SVG pour le graphique linéaire */}
                                            <Svg
                                                width={graphWidth}
                                                height={graphHeight}
                                                style={{ position: 'absolute', top: 0, left: 0 }}
                                            >
                                                {/* Lignes de connexion */}
                                                {points.map((point, index) => {
                                                    if (index === points.length - 1) return null;
                                                    const nextPoint = points[index + 1];
                                                    return (
                                                        <Line
                                                            key={`line-${index}`}
                                                            x1={point.x}
                                                            y1={point.y}
                                                            x2={nextPoint.x}
                                                            y2={nextPoint.y}
                                                            stroke="#4CAF50"
                                                            strokeWidth={3}
                                                            strokeLinecap="round"
                                                        />
                                                    );
                                                })}

                                                {/* Points */}
                                                {points.map((point, index) => (
                                                    <Circle
                                                        key={`point-${index}`}
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={7}
                                                        fill="#4CAF50"
                                                        stroke="#fff"
                                                        strokeWidth={3}
                                                    />
                                                ))}
                                            </Svg>

                                            {/* Labels des scores au-dessus des points */}
                                            {points.map((point, index) => (
                                                <View
                                                    key={`label-${index}`}
                                                    style={[
                                                        styles.scoreTooltip,
                                                        {
                                                            position: 'absolute',
                                                            left: point.x - 20,
                                                            top: point.y - 28,
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.scoreTooltipText}>{point.score}%</Text>
                                                </View>
                                            ))}

                                            {/* Labels des numéros de tentative en bas */}
                                            {points.map((point, index) => (
                                                <View
                                                    key={`xlabel-${index}`}
                                                    style={{
                                                        position: 'absolute',
                                                        left: point.x - 15,
                                                        top: graphHeight + 5,
                                                        width: 30,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={styles.attemptLabel}>
                                                        #{index + 1}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                    <Text style={styles.chartLegend}>Numéro de tentative</Text>
                                </View>
                            );
                        })()}

                        <View style={styles.attemptsSection}>
                            <Text style={styles.sectionTitle}>Toutes les tentatives</Text>
                            {attempts.map((attempt, index) => {
                                const totalQuestions = attempt.nombre_correctes + attempt.nombre_incorrectes;
                                const scorePercent = attempt.score / 100;
                                const circleSize = 60;
                                const strokeWidth = 5;
                                const radius = (circleSize - strokeWidth) / 2;
                                const circumference = 2 * Math.PI * radius;
                                const strokeDashoffset = circumference * (1 - scorePercent);

                                return (
                                    <TouchableOpacity
                                        key={attempt.id}
                                        style={styles.attemptCard}
                                        onPress={() => viewAttemptDetail(attempt.id)}
                                    >
                                        <View style={styles.attemptCardContent}>
                                            {/* Cercle de progression */}
                                            <View style={styles.scoreCircleContainer}>
                                                <Svg width={circleSize} height={circleSize}>
                                                    {/* Cercle de fond */}
                                                    <Circle
                                                        cx={circleSize / 2}
                                                        cy={circleSize / 2}
                                                        r={radius}
                                                        stroke="#e8eaed"
                                                        strokeWidth={strokeWidth}
                                                        fill="none"
                                                    />
                                                    {/* Cercle de progression */}
                                                    <Circle
                                                        cx={circleSize / 2}
                                                        cy={circleSize / 2}
                                                        r={radius}
                                                        stroke="#4CAF50"
                                                        strokeWidth={strokeWidth}
                                                        fill="none"
                                                        strokeLinecap="round"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={strokeDashoffset}
                                                        transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                                                    />
                                                </Svg>
                                                <View style={styles.scoreCircleText}>
                                                    <Text style={styles.scoreCircleValue}>{attempt.nombre_correctes}/{totalQuestions}</Text>
                                                </View>
                                            </View>

                                            {/* Infos de la tentative */}
                                            <View style={styles.attemptInfo}>
                                                <Text style={styles.attemptNumber}>Tentative #{attempts.length - index}</Text>
                                                <Text style={styles.attemptDate}>{formatDate(attempt.completed_at)}</Text>
                                                {attempt.temps_ecoule && (
                                                    <Text style={styles.attemptTime}>⏱️ {formatTime(attempt.temps_ecoule)}</Text>
                                                )}
                                            </View>

                                            {/* Flèche */}
                                            <Text style={styles.attemptArrow}>→</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
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
        overflow: 'visible',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 15,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 200,
        overflow: 'visible',
        marginTop: 35,
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 8,
        paddingTop: 7,
        paddingBottom: 7,
        height: 160,
    },
    yAxisLabel: {
        fontSize: 10,
        color: '#999',
        lineHeight: 10,
        textAlignVertical: 'center',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 7,
        paddingBottom: 7,
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    scoreTooltip: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
    },
    scoreTooltipText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    attemptLabel: {
        fontSize: 11,
        color: '#666',
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
    attemptCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreCircleContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    scoreCircleText: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreCircleValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    attemptInfo: {
        flex: 1,
    },
    attemptNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 4,
    },
    attemptDate: {
        fontSize: 12,
        color: '#999',
    },
    attemptTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    attemptArrow: {
        fontSize: 20,
        color: '#ccc',
        marginLeft: 10,
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
