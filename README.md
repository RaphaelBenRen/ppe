# PPE ECE - Application Mobile

Application mobile de révision pour étudiants ECE, développée avec React Native / Expo.

## Structure du projet

```
├── backend/          # API Node.js + Express + Supabase
├── mobile-app/       # Application React Native / Expo
├── database/         # Scripts SQL pour Supabase
└── docs/            # Documentation
```

## Prérequis

- Node.js 18+
- Expo Go sur votre téléphone (Android/iOS)
- Compte Supabase (base de données)

## Installation

### 1. Backend

```bash
cd backend
npm install
```

Configurer le fichier `.env`:
```env
PORT=5001
JWT_SECRET=votre-secret-jwt
SUPABASE_URL=votre-url-supabase
SUPABASE_KEY=votre-cle-supabase
```

Lancer le backend:
```bash
npm start
```

### 2. Application Mobile

```bash
cd mobile-app
npm install
npx expo start
```

Scanner le QR code avec Expo Go sur votre téléphone.

**Important**: Votre téléphone et votre PC doivent être sur le même réseau Wi-Fi.

## Base de données Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Exécuter le contenu de `database/supabase_schema.sql`

## Fonctionnalités

- Inscription / Connexion
- Upload de cours (PDF, Word, TXT)
- Génération de QCM avec IA (Claude)
- Historique des tentatives de QCM
- Graphique de progression
- Flashcards

## Technologies

- **Mobile**: React Native, Expo
- **Backend**: Node.js, Express
- **Base de données**: Supabase (PostgreSQL)
- **IA**: Claude API (Anthropic)

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérification du token

### QCM
- `GET /api/qcm/my-qcms` - Liste des QCMs
- `GET /api/qcm/:id` - Détail d'un QCM
- `POST /api/qcm/:id/submit` - Soumettre les réponses
- `GET /api/qcm/:id/attempts` - Historique des tentatives
- `POST /api/qcm/generate-from-text` - Générer un QCM

## Licence

Projet étudiant ECE - 2024
