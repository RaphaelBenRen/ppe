# 🎓 Plateforme d'Apprentissage ECE

Plateforme web permettant aux étudiants de l'ECE de générer des QCMs et flashcards personnalisés à partir de leurs cours, avec intelligence artificielle (Claude API).

## 📋 Fonctionnalités

### ✅ Phase 1 - Implémentée
- 🔐 **Authentification complète** (inscription/connexion)
- 👤 **Onboarding personnalisé** pour les étudiants ECE
  - Sélection de l'année d'études (Ing1 à Ing5)
  - Choix de la majeure (pour Ing4 et Ing5)
  - Points forts et points faibles
  - Objectifs d'apprentissage
  - Préférences de difficulté
- 📊 **Dashboard** (base)

### 🚧 Phase 2 - À développer
- 📤 Upload de cours (PDF, DOCX, etc.)
- 🤖 Génération de QCMs avec IA
- 🗂️ Génération de flashcards
- 📈 Statistiques et suivi de progression
- 🔍 Recherche sémantique dans les cours (ChromaDB)

## 🛠️ Technologies utilisées

### Backend
- **Node.js** + Express
- **MySQL** (via phpMyAdmin)
- **JWT** pour l'authentification
- **ChromaDB** pour les embeddings (prévu)
- **Claude API** (Anthropic) pour la génération de contenu (prévu)

### Frontend
- **React**
- **React Router** pour la navigation
- **CSS** personnalisé

## 📦 Installation

### Prérequis
- Node.js (version 14+)
- MySQL / phpMyAdmin
- XAMPP (ou équivalent pour MySQL)

### Étape 1 : Cloner et installer les dépendances

```bash
# Installer les dépendances du backend
npm install

# Installer les dépendances du frontend
cd frontend
npm install
cd ..
```

### Étape 2 : Configuration de la base de données

1. **Démarrer XAMPP** (Apache et MySQL)
2. **Ouvrir phpMyAdmin** : http://localhost/phpmyadmin
3. **Créer la base de données** :
   - Cliquer sur "Nouvelle base de données"
   - Nom : `PPE`
   - Interclassement : `utf8mb4_unicode_ci`
   - Cliquer sur "Créer"

4. **Importer le schéma** :
   - Sélectionner la base `PPE`
   - Onglet "Importer"
   - Choisir le fichier `database/schema.sql`
   - Cliquer sur "Exécuter"

### Étape 3 : Configuration de l'environnement

Le fichier `.env` est déjà créé avec la configuration par défaut :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=PPE
DB_PORT=3306
JWT_SECRET=ece_secret_key_super_securise_2024
PORT=5000
```

⚠️ **Si votre MySQL a un mot de passe**, modifier `DB_PASSWORD` dans le fichier `.env`

### Étape 4 : Démarrer l'application

#### Option 1 : Démarrage séparé (recommandé pour le développement)

**Terminal 1 - Backend :**
```bash
npm run server
```
Le backend démarrera sur http://localhost:5000

**Terminal 2 - Frontend :**
```bash
cd frontend
npm start
```
Le frontend démarrera sur http://localhost:3000

#### Option 2 : Démarrage simultané
```bash
npm run dev
```

## 🚀 Utilisation

1. **Ouvrir** http://localhost:3000
2. **S'inscrire** avec un nouveau compte
3. **Compléter l'onboarding** :
   - Choisir votre année d'études
   - Sélectionner votre majeure (si Ing4/Ing5)
   - Indiquer vos points forts
   - (Optionnel) Indiquer vos points faibles
   - (Optionnel) Définir vos objectifs
4. **Accéder au dashboard**

## 📁 Structure du projet

```
PPE Site/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuration MySQL
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   ├── routes/
│   │   ├── auth.js               # Routes authentification
│   │   └── onboarding.js         # Routes onboarding
│   └── server.js                 # Serveur Express
├── database/
│   └── schema.sql                # Schéma de la base de données
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js          # Page de connexion
│   │   │   ├── Register.js       # Page d'inscription
│   │   │   ├── Onboarding.js     # Onboarding multi-étapes
│   │   │   └── Dashboard.js      # Dashboard principal
│   │   ├── styles/
│   │   │   └── Auth.css          # Styles authentification
│   │   ├── utils/
│   │   │   └── api.js            # Fonctions API
│   │   └── App.js                # Composant principal
│   └── package.json
├── .env                          # Variables d'environnement
├── .gitignore
├── package.json
└── README.md
```

## 🗄️ Schéma de base de données

### Tables principales

- **users** : Utilisateurs (email, mot de passe, nom, prénom)
- **student_profiles** : Profils étudiants (année, majeure, points forts/faibles)
- **courses** : Cours uploadés
- **qcms** : QCMs générés
- **flashcards** : Flashcards générées
- **flashcard_progress** : Progression (spaced repetition)
- **matieres** : Liste des matières ECE

## 🔐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérification du token

### Onboarding
- `POST /api/onboarding/complete` - Sauvegarder le profil
- `GET /api/onboarding/profile` - Récupérer le profil
- `GET /api/onboarding/matieres` - Liste des matières

## 🎯 Prochaines étapes

1. **Système d'upload de cours**
   - Parser PDF/DOCX
   - Stocker dans ChromaDB
   - Créer des embeddings

2. **Génération de QCMs**
   - Intégrer l'API Claude
   - Créer des prompts optimisés
   - Interface de génération

3. **Génération de flashcards**
   - Système de spaced repetition
   - Interface interactive

4. **Statistiques et progression**
   - Graphiques de performance
   - Historique des QCMs

## 🔧 Configuration ChromaDB (pour plus tard)

ChromaDB sera utilisé pour stocker les embeddings des cours et permettre la recherche sémantique.

```bash
# Installation
pip install chromadb

# Démarrage du serveur ChromaDB (optionnel)
chroma run --host localhost --port 8000
```

## 📝 Notes importantes

- ✅ Le projet fonctionne actuellement en **local uniquement**
- ✅ **ChromaDB** peut être utilisé en mode embedded (pas besoin de serveur séparé)
- ✅ Migration vers production : ChromaDB peut tourner sur le même serveur
- ⚠️ **Sécurité** : Changer le JWT_SECRET en production
- ⚠️ **API Claude** : Ajouter la clé API quand nécessaire

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifier que MySQL est démarré (XAMPP)
- Vérifier les credentials dans `.env`
- Vérifier que la base `PPE` existe

### Le frontend ne se connecte pas au backend
- Vérifier que le backend tourne sur le port 5000
- Vérifier les CORS dans `backend/server.js`

### Erreur lors de l'onboarding
- Vérifier que les tables sont bien créées
- Vérifier que la table `matieres` contient des données

## 👨‍💻 Développement

Pour ajouter de nouvelles fonctionnalités :

1. **Backend** : Ajouter les routes dans `backend/routes/`
2. **Frontend** : Créer les composants dans `frontend/src/pages/`
3. **API** : Ajouter les fonctions dans `frontend/src/utils/api.js`

## 📄 Licence

Projet étudiant ECE - 2024
