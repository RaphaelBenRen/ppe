import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const updateField = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleRegister = async () => {
        // Validation
        if (!formData.nom || !formData.prenom || !formData.email || !formData.password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            await register({
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                password: formData.password,
            });
            // La navigation vers Onboarding se fait automatiquement via AuthContext
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.logo}>📚</Text>
                    <Text style={styles.title}>Créer un compte</Text>
                    <Text style={styles.subtitle}>Rejoignez MemoryLab</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Votre nom"
                            value={formData.nom}
                            onChangeText={(value) => updateField('nom', value)}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prénom</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Votre prénom"
                            value={formData.prenom}
                            onChangeText={(value) => updateField('prenom', value)}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="exemple@email.com"
                            value={formData.email}
                            onChangeText={(value) => updateField('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={formData.password}
                            onChangeText={(value) => updateField('password', value)}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmer le mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChangeText={(value) => updateField('confirmPassword', value)}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>S'inscrire</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Déjà un compte ? </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            disabled={loading}
                        >
                            <Text style={styles.link}>Se connecter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        fontSize: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    link: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
});

export default RegisterScreen;
