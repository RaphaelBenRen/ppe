import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI, authAPI } from '../utils/api';

const SettingsScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await onboardingAPI.getProfile();
            if (response.success && response.data) {
                setProfile(response.data);
                setEditedProfile(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer mon compte',
            'Cette action est IRRÉVERSIBLE. Toutes vos données seront définitivement supprimées :\n\n• Vos cours\n• Vos QCMs\n• Vos flashcards\n• Votre profil',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer définitivement',
                    style: 'destructive',
                    onPress: confirmDeleteAccount,
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
        setDeleting(true);
        try {
            const response = await authAPI.deleteAccount();
            if (response.success) {
                Alert.alert(
                    'Compte supprimé',
                    'Votre compte et toutes vos données ont été supprimés.',
                    [{ text: 'OK', onPress: logout }]
                );
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte');
        } finally {
            setDeleting(false);
        }
    };

    const SettingItem = ({ icon, title, subtitle, onPress, danger, showArrow = true }) => (
        <TouchableOpacity
            style={[styles.settingItem, danger && styles.settingItemDanger]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>{icon}</Text>
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
                    {title}
                </Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {showArrow && <Text style={styles.settingArrow}>›</Text>}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
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
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profil utilisateur */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                            {user?.prenom} {user?.nom}
                        </Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
                        {profile?.annee && (
                            <Text style={styles.profileYear}>{profile.annee}</Text>
                        )}
                    </View>
                </View>

                {/* Section Compte */}
                <SectionHeader title="COMPTE" />
                <View style={styles.settingsGroup}>
                    <SettingItem
                        icon="👤"
                        title="Modifier le profil"
                        subtitle="Nom, prénom, année"
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                    <SettingItem
                        icon="🔒"
                        title="Sécurité"
                        subtitle="Modifier le mot de passe"
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                    <SettingItem
                        icon="📧"
                        title="Email"
                        subtitle={user?.email}
                        showArrow={false}
                    />
                </View>

                {/* Section Préférences */}
                <SectionHeader title="PRÉFÉRENCES" />
                <View style={styles.settingsGroup}>
                    <SettingItem
                        icon="📚"
                        title="Matières favorites"
                        subtitle={profile?.matieres_favorites?.join(', ') || 'Non définies'}
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                    <SettingItem
                        icon="🎯"
                        title="Objectifs d'apprentissage"
                        subtitle={profile?.objectifs || 'Non définis'}
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                </View>

                {/* Section Données */}
                <SectionHeader title="DONNÉES" />
                <View style={styles.settingsGroup}>
                    <SettingItem
                        icon="📊"
                        title="Statistiques"
                        subtitle="Voir vos progrès"
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                    <SettingItem
                        icon="🗑️"
                        title="Supprimer mon compte"
                        subtitle="Supprime toutes vos données"
                        onPress={handleDeleteAccount}
                        danger
                    />
                </View>

                {/* Section À propos */}
                <SectionHeader title="À PROPOS" />
                <View style={styles.settingsGroup}>
                    <SettingItem
                        icon="ℹ️"
                        title="Version"
                        subtitle="1.0.0"
                        showArrow={false}
                    />
                    <SettingItem
                        icon="📄"
                        title="Conditions d'utilisation"
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                    <SettingItem
                        icon="🔐"
                        title="Politique de confidentialité"
                        onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
                    />
                </View>

                {/* Déconnexion */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>ECE Learning v1.0</Text>
                </View>
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
    header: {
        backgroundColor: '#f8f9fa',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    backButtonText: {
        color: '#1a1a2e',
        fontSize: 24,
        fontWeight: '300',
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: '#fff',
        margin: 20,
        marginBottom: 10,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    profileInfo: {
        marginLeft: 15,
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    profileYear: {
        fontSize: 12,
        color: '#4a5568',
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8a8a8a',
        letterSpacing: 1,
        marginLeft: 20,
        marginTop: 25,
        marginBottom: 10,
    },
    settingsGroup: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingItemDanger: {
        backgroundColor: '#fff5f5',
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingIconText: {
        fontSize: 18,
    },
    settingContent: {
        flex: 1,
        marginLeft: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a2e',
    },
    settingTitleDanger: {
        color: '#e53e3e',
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#8a8a8a',
        marginTop: 2,
    },
    settingArrow: {
        fontSize: 22,
        color: '#c0c0c0',
        fontWeight: '300',
    },
    logoutSection: {
        marginHorizontal: 20,
        marginTop: 30,
    },
    logoutButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e53e3e',
    },
    logoutButtonText: {
        color: '#e53e3e',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 25,
    },
    footerText: {
        fontSize: 12,
        color: '#c0c0c0',
    },
});

export default SettingsScreen;
