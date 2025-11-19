# 🏗️ Architecture de la Plateforme ECE

## 📊 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR WEB                           │
│                  (React Frontend)                           │
│                 http://localhost:3000                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │ (JSON)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVEUR BACKEND                            │
│               (Node.js + Express)                           │
│                http://localhost:5000                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │  Onboarding  │  │   Future     │     │
│  │   Routes     │  │    Routes    │  │   Routes     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │ Middleware  │                         │
│                    │  JWT Auth   │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │      BASE DE DONNÉES MySQL            │
        │         (phpMyAdmin)                  │
        │      http://localhost/phpmyadmin      │
        │                                       │
        │  ┌─────────────────────────────────┐ │
        │  │ • users                         │ │
        │  │ • student_profiles              │ │
        │  │ • courses                       │ │
        │  │ • qcms                          │ │
        │  │ • flashcards                    │ │
        │  │ • flashcard_progress            │ │
        │  │ • matieres                      │ │
        │  └─────────────────────────────────┘ │
        └───────────────────────────────────────┘
```

## 🔄 Flux de données

### 1. Inscription d'un utilisateur

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌──────────┐
│ React   │──1──▶ │ Express │──2──▶ │  bcrypt  │──3──▶ │  MySQL   │
│Register │       │ /auth/  │       │  Hash    │       │  users   │
│  Page   │◀──6── │register │◀──5── │ password │◀──4── │  INSERT  │
└─────────┘       └─────────┘       └──────────┘       └──────────┘
     │                                                        │
     └──────7─────▶  JWT Token  ◀─────8──────────────────────┘
                    localStorage
```

### 2. Connexion d'un utilisateur

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌──────────┐
│ React   │──1──▶ │ Express │──2──▶ │  bcrypt  │──3──▶ │  MySQL   │
│ Login   │       │ /auth/  │       │ compare  │       │  SELECT  │
│  Page   │◀──6── │  login  │◀──5── │ password │◀──4── │  users   │
└─────────┘       └─────────┘       └──────────┘       └──────────┘
     │                                                        │
     └──────7─────▶  JWT Token  ◀─────8──────────────────────┘
                    localStorage
```

### 3. Onboarding utilisateur

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   React      │──1──▶ │   Express    │──2──▶ │    MySQL     │
│ Onboarding   │       │ /onboarding/ │       │   student_   │
│   4 étapes   │◀──4── │   complete   │◀──3── │   profiles   │
└──────────────┘       └──────────────┘       └──────────────┘
       │                                              │
       └──────5─────▶  Update user  ◀─────6───────────┘
                   onboarding_completed = TRUE
```

### 4. Protection des routes

```
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌─────────┐
│ React   │──1──▶ │ Request  │──2──▶ │   Auth   │──3──▶ │ Route   │
│  App    │       │ + Token  │       │Middleware│       │Handler  │
└─────────┘       └──────────┘       └──────────┘       └─────────┘
     │                                     │                  │
     └───────── 4. Si invalide ────────────┘                  │
                  401 Unauthorized                            │
                                                               │
     ┌───────── 5. Si valide ◀──────────────────────────────┘
         Accès autorisé
```

## 📁 Structure des dossiers

```
PPE Site/
│
├── 📂 backend/                    # Serveur API Node.js
│   ├── 📂 config/
│   │   └── database.js            # Pool MySQL
│   ├── 📂 middleware/
│   │   └── auth.js                # Vérification JWT
│   ├── 📂 routes/
│   │   ├── auth.js                # Endpoints authentification
│   │   └── onboarding.js          # Endpoints profil
│   └── server.js                  # Point d'entrée serveur
│
├── 📂 database/
│   └── schema.sql                 # Schéma MySQL complet
│
├── 📂 frontend/                   # Application React
│   ├── 📂 public/
│   ├── 📂 src/
│   │   ├── 📂 pages/
│   │   │   ├── Login.js           # Page connexion
│   │   │   ├── Register.js        # Page inscription
│   │   │   ├── Onboarding.js      # Onboarding 4 étapes
│   │   │   └── Dashboard.js       # Tableau de bord
│   │   ├── 📂 styles/
│   │   │   └── Auth.css           # Styles auth + onboarding
│   │   ├── 📂 utils/
│   │   │   └── api.js             # Client API
│   │   ├── App.js                 # Router principal
│   │   └── index.js               # Point d'entrée React
│   └── package.json
│
├── 📂 node_modules/               # Dépendances backend
│
├── 📄 .env                        # Variables d'environnement
├── 📄 .env.example                # Template .env
├── 📄 .gitignore                  # Fichiers ignorés par Git
├── 📄 package.json                # Dépendances backend
├── 📄 package-lock.json
│
├── 📘 README.md                   # Documentation complète
├── 📘 INSTALLATION.md             # Guide d'installation
├── 📘 DEMARRAGE_RAPIDE.md         # Quick start
├── 📘 PROJET_SYNTHESE.md          # Vue d'ensemble
├── 📘 ARCHITECTURE.md             # Ce fichier
│
└── 🚀 start.bat                   # Script de démarrage Windows
```

## 🔐 Sécurité et Authentification

### Flow JWT

```
1. INSCRIPTION
   User Input → Backend → Hash password (bcrypt)
   → Insert in DB → Generate JWT → Return token

2. CONNEXION
   Credentials → Backend → Compare hash (bcrypt)
   → Generate JWT → Return token

3. REQUÊTES PROTÉGÉES
   Request + Token → Middleware → Verify JWT
   → If valid: Continue → If invalid: 401 Error

4. TOKEN STOCKAGE
   localStorage.setItem('token', jwt)
   Header: Authorization: Bearer <token>

5. EXPIRATION
   Token expire après 7 jours
   → User doit se reconnecter
```

## 🗄️ Schéma de base de données

```sql
users
├── id (PK)
├── email (UNIQUE)
├── password (HASHED)
├── nom
├── prenom
├── onboarding_completed (BOOLEAN)
└── created_at

student_profiles
├── id (PK)
├── user_id (FK → users.id)
├── annee_etude (ENUM)
├── majeure (VARCHAR, nullable)
├── points_forts (JSON)
├── points_faibles (JSON)
├── objectifs_apprentissage (TEXT)
├── preferences_difficulte (ENUM)
└── created_at

matieres
├── id (PK)
├── nom
├── description
├── annees_concernees (JSON)
└── created_at

courses (prévu pour Phase 2)
├── id (PK)
├── titre
├── annee_cible
├── matiere
├── file_path
├── chroma_collection_id
└── uploaded_by (FK → users.id)

qcms (prévu pour Phase 2)
├── id (PK)
├── user_id (FK)
├── questions_data (JSON)
├── score
└── completed

flashcards (prévu pour Phase 2)
├── id (PK)
├── user_id (FK)
├── cards_data (JSON)
└── created_at

flashcard_progress (prévu pour Phase 2)
├── id (PK)
├── user_id (FK)
├── flashcard_id (FK)
├── niveau_maitrise
└── prochaine_revision
```

## 🎨 Architecture Frontend

```
App.js (Router)
    │
    ├── Public Routes
    │   ├── /login → Login.js
    │   └── /register → Register.js
    │
    └── Protected Routes (require auth)
        ├── /onboarding → Onboarding.js
        │   └── 4 Steps Component
        │       ├── StepAnnee
        │       ├── StepMajeure (if Ing4/5)
        │       ├── StepPointsForts
        │       └── StepObjectifs
        │
        └── /dashboard → Dashboard.js
            └── (require onboarding completed)
```

## 🔌 API Endpoints

```
PUBLIC ENDPOINTS
├── POST   /api/auth/register
│   Body: { email, password, nom, prenom }
│   Return: { token, user }
│
└── POST   /api/auth/login
    Body: { email, password }
    Return: { token, user }

PROTECTED ENDPOINTS (require JWT)
├── GET    /api/auth/verify
│   Header: Authorization: Bearer <token>
│   Return: { user }
│
├── POST   /api/onboarding/complete
│   Header: Authorization: Bearer <token>
│   Body: { annee_etude, majeure, points_forts, ... }
│   Return: { success }
│
├── GET    /api/onboarding/profile
│   Header: Authorization: Bearer <token>
│   Return: { profile }
│
└── GET    /api/onboarding/matieres
    Header: Authorization: Bearer <token>
    Return: { matieres[] }

SYSTEM
└── GET    /api/health
    Return: { success, message, timestamp }
```

## 🚀 Flow d'utilisation complet

```
1. PREMIÈRE VISITE
   └─▶ Redirect to /login

2. CLIC "S'INSCRIRE"
   └─▶ /register
       └─▶ Form validation
           └─▶ POST /api/auth/register
               └─▶ Store token in localStorage
                   └─▶ Redirect to /onboarding

3. ONBOARDING
   └─▶ Step 1: Année d'études
       └─▶ Step 2: Majeure (si Ing4/5) ou Points forts
           └─▶ Step 3: Points forts (si Ing4/5) ou Points faibles
               └─▶ Step 4: Objectifs
                   └─▶ POST /api/onboarding/complete
                       └─▶ Update user.onboarding_completed
                           └─▶ Redirect to /dashboard

4. DASHBOARD
   └─▶ User authentifié + onboarding complété
       └─▶ Accès aux fonctionnalités

5. VISITE SUIVANTE
   └─▶ Check localStorage.token
       └─▶ GET /api/auth/verify
           └─▶ If valid + onboarding done
               └─▶ Redirect to /dashboard
```

## 🔄 État de l'application (React)

```javascript
App State
├── user
│   ├── userId
│   ├── email
│   ├── nom
│   ├── prenom
│   ├── token
│   └── onboardingCompleted
│
└── loading (boolean)

LocalStorage
├── token (JWT string)
└── user (JSON stringified)
```

## 🎯 Prochaine Phase : ChromaDB + Claude

```
FUTURE ARCHITECTURE (Phase 2)

Frontend
    ↓
Backend API
    ├─→ MySQL (métadonnées)
    ├─→ ChromaDB (embeddings)
    └─→ Claude API (génération)

FLOW GÉNÉRATION QCM:
1. User upload cours.pdf
2. Backend parse PDF → texte
3. Texte → ChromaDB (embeddings)
4. User demande QCM
5. ChromaDB → recherche similaire
6. Contexte + Prompt → Claude API
7. Claude → génère QCM JSON
8. Backend → stocke dans MySQL
9. Frontend → affiche QCM
```

## 📊 Performance & Scalabilité

### Actuel (Local)
- ✅ Pool MySQL (10 connexions)
- ✅ JWT stateless (pas de session)
- ✅ React optimisé

### Production (Futur)
- Load balancer
- Redis cache
- CDN pour assets
- PM2 cluster mode
- ChromaDB serveur séparé

## 🔒 Sécurité

### Implémenté
- ✅ Bcrypt (10 rounds)
- ✅ JWT avec expiration
- ✅ CORS configuré
- ✅ Input validation
- ✅ SQL paramétrisé (injection protection)

### À ajouter
- Rate limiting
- HTTPS (production)
- CSRF tokens
- XSS sanitization
- 2FA

---

**Version**: 1.0.0 - Phase 1
**Dernière mise à jour**: 16 Novembre 2024
