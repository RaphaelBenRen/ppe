import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI } from '../utils/api';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [anneeEtude, setAnneeEtude] = useState('');

    const annees = ['Ing1', 'Ing2', 'Ing3', 'Ing4', 'Ing5'];

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await onboardingAPI.getProfile();
            if (response.success && response.data) {
                setProfile(response.data);
                setNom(response.data.nom || '');
                setPrenom(response.data.prenom || '');
                setAnneeEtude(response.data.annee_etude || '');
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!nom.trim() || !prenom.trim()) {
            Alert.alert('Erreur', 'Le nom et le prénom sont requis.');
            return;
        }

        setSaving(true);
        try {
            const response = await onboardingAPI.updateProfile({
                nom: nom.trim(),
                prenom: prenom.trim(),
                annee_etude: anneeEtude,
            });

            if (response.success) {
                // Mettre à jour le contexte utilisateur
                if (updateUser) {
                    updateUser({ ...user, nom: nom.trim(), prenom: prenom.trim() });
                }
                Alert.alert('Succès', 'Profil mis à jour avec succès !', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil.');
        } finally {
            setSaving(false);
        }
    };

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
                <Text style={styles.headerTitle}>Modifier le profil</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Prénom</Text>
                            <TextInput
                                style={styles.input}
                                value={prenom}
                                onChangeText={setPrenom}
                                placeholder="Votre prénom"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom</Text>
                            <TextInput
                                style={styles.input}
                                value={nom}
                                onChangeText={setNom}
                                placeholder="Votre nom"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Année d'étude</Text>
                            <View style={styles.anneeContainer}>
                                {annees.map((annee) => (
                                    <TouchableOpacity
                                        key={annee}
                                        style={[
                                            styles.anneeButton,
                                            anneeEtude === annee && styles.anneeButtonActive
                                        ]}
                                        onPress={() => setAnneeEtude(annee)}
                                    >
                                        <Text style={[
                                            styles.anneeButtonText,
                                            anneeEtude === annee && styles.anneeButtonTextActive
                                        ]}>
                                            {annee}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.emailGroup}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.emailValue}>{user?.email}</Text>
                            <Text style={styles.emailNote}>L'email ne peut pas être modifié</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Enregistrer</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: 20,
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    anneeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    anneeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    anneeButtonActive: {
        backgroundColor: '#1a1a2e',
        borderColor: '#1a1a2e',
    },
    anneeButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    anneeButtonTextActive: {
        color: '#fff',
    },
    emailGroup: {
        marginTop: 10,
    },
    emailValue: {
        fontSize: 16,
        color: '#666',
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 12,
    },
    emailNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    saveButton: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditProfileScreen;
