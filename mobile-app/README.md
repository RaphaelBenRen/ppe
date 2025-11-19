# ECE Learning - Application Mobile

Application mobile pour les étudiants de l'ECE permettant de générer des QCMs et flashcards à partir de cours uploadés.

## Technologies

- **React Native** avec Expo
- **React Navigation** pour la navigation
- **AsyncStorage** pour le stockage local
- **Expo DocumentPicker** pour l'upload de fichiers
- **Backend**: Node.js + Express + MySQL (API existante)

## Installation

### 1. Installer les dépendances

```bash
cd mobile-app
npm install
```

### 2. Configurer l'API URL

Ouvrez le fichier `src/utils/api.js` et modifiez l'URL de l'API avec votre adresse IP locale:

```javascript
const API_URL = 'http://VOTRE_IP_LOCALE:5001/api';
```

**Pour trouver votre IP locale:**

- **Windows**: Ouvrez CMD et tapez `ipconfig`, cherchez "Adresse IPv4"
- **Mac/Linux**: Tapez `ifconfig` dans le terminal

**Exemple**: Si votre IP est `192.168.1.100`, utilisez:
```javascript
const API_URL = 'http://192.168.1.100:5001/api';
```

## Démarrage

### 1. Démarrer le backend

Dans un terminal:

```bash
cd "c:\Users\33628\OneDrive - Groupe INSEEC (POCE)\Bureau\Ece Ing 3\PPE\PPE Site"
npm run server
```

Le backend doit tourner sur le port 5001.

### 2. Démarrer l'application mobile

Dans un autre terminal:

```bash
cd "c:\Users\33628\OneDrive - Groupe INSEEC (POCE)\Bureau\Ece Ing 3\PPE\PPE Site\mobile-app"
npm start
```

### 3. Tester sur Expo Go

1. Installer **Expo Go** sur votre smartphone (iOS/Android)
2. Scanner le QR code qui apparaît dans le terminal
3. L'application se lance automatiquement

**Note**: Votre téléphone et votre ordinateur doivent être sur le même réseau WiFi!

## Fonctionnalités

### Authentification
- Inscription avec nom, prénom, email, mot de passe
- Connexion sécurisée avec JWT
- Déconnexion

### Onboarding
- Configuration du profil étudiant
- Sélection de l'année (Ing1 à Ing5)
- Majeure (pour Ing4/Ing5)
- Points forts et à améliorer
- Objectifs et préférences

### Dashboard
- Upload de cours (PDF, DOCX, TXT)
- Liste des cours uploadés
- Génération de QCMs avec options:
  - Nombre de questions: 5, 10, 15, 20
  - Difficulté: facile, moyen, difficile
- Génération de Flashcards avec options:
  - Nombre de cartes: 10, 20, 30, 50
- Suppression de cours

### QCMs
- Liste des QCMs générés
- Affichage par difficulté

### Flashcards
- Liste des sets de flashcards générés
- Nombre de cartes par set

## Structure du projet

```
mobile-app/
├── App.js                      # Point d'entrée
├── src/
│   ├── screens/               # Écrans de l'app
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── QCMScreen.js
│   │   └── FlashcardsScreen.js
│   ├── navigation/            # Configuration navigation
│   │   └── AppNavigator.js
│   ├── context/              # Context API
│   │   └── AuthContext.js
│   └── utils/                # Utilitaires
│       └── api.js            # Appels API
└── package.json
```

## Problèmes courants

### L'app ne se connecte pas au backend

1. Vérifiez que le backend tourne sur le port 5001
2. Vérifiez que vous avez bien configuré votre IP locale dans `src/utils/api.js`
3. Vérifiez que votre téléphone et votre PC sont sur le même WiFi
4. Testez l'API dans le navigateur: `http://VOTRE_IP:5001/api/health`

### L'upload de fichiers ne marche pas

1. Vérifiez que le dossier `uploads/` existe dans le backend
2. Vérifiez les permissions du dossier
3. Vérifiez la taille du fichier (limite: 10MB)

### Erreur de réseau

1. Désactivez votre pare-feu temporairement
2. Vérifiez que le port 5001 n'est pas bloqué
3. Essayez de redémarrer Expo avec `npm start -- --reset-cache`

## Commandes utiles

```bash
# Démarrer en mode développement
npm start

# Démarrer avec reset du cache
npm start -- --reset-cache

# Démarrer en mode tunnel (si même WiFi ne marche pas)
npm start -- --tunnel

# Build pour Android
npm run android

# Build pour iOS (Mac uniquement)
npm run ios
```

## Prochaines étapes

- [ ] Passer les QCMs de manière interactive
- [ ] Réviser les flashcards avec flip des cartes
- [ ] Système de spaced repetition
- [ ] Statistiques et progression
- [ ] Mode hors ligne
- [ ] Notifications de révision

## Support

Pour toute question ou problème, vérifiez d'abord:
1. Le backend tourne correctement
2. L'IP est bien configurée
3. Le téléphone et le PC sont sur le même réseau

---

**Développé pour l'ECE - Propulsé par Claude AI**
