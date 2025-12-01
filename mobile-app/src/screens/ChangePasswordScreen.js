import React, { useState } from 'react';
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
import { onboardingAPI } from '../utils/api';

const ChangePasswordScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        // Validations
        if (!currentPassword) {
            Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel.');
            return;
        }

        if (!newPassword) {
            Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'ancien.');
            return;
        }

        setSaving(true);
        try {
            const response = await onboardingAPI.changePassword(currentPassword, newPassword);

            if (response.success) {
                Alert.alert('Succès', 'Mot de passe modifié avec succès !', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Impossible de modifier le mot de passe.');
        } finally {
            setSaving(false);
        }
    };

    const PasswordInput = ({ value, onChangeText, placeholder, show, onToggle }) => (
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                secureTextEntry={!show}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={onToggle}>
                <Text style={styles.eyeIcon}>{show ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier le mot de passe</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mot de passe actuel</Text>
                            <PasswordInput
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Entrez votre mot de passe actuel"
                                show={showCurrentPassword}
                                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nouveau mot de passe</Text>
                            <PasswordInput
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Minimum 6 caractères"
                                show={showNewPassword}
                                onToggle={() => setShowNewPassword(!showNewPassword)}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                            <PasswordInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Retapez le nouveau mot de passe"
                                show={showConfirmPassword}
                                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                            />
                        </View>

                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
                        )}

                        {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                            <Text style={styles.errorText}>Minimum 6 caractères requis</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Modifier le mot de passe</Text>
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    passwordInput: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: '#1a1a2e',
    },
    eyeButton: {
        padding: 15,
    },
    eyeIcon: {
        fontSize: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
    },
    errorText: {
        color: '#e53e3e',
        fontSize: 13,
        marginTop: -10,
        marginBottom: 10,
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

export default ChangePasswordScreen;
