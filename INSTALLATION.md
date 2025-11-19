# 🚀 Guide d'installation rapide

## Étape 1 : Préparer la base de données

### Option A : Via phpMyAdmin (recommandé)

1. **Démarrer XAMPP** :
   - Ouvrir XAMPP Control Panel
   - Démarrer **Apache** et **MySQL**

2. **Ouvrir phpMyAdmin** :
   - Aller sur http://localhost/phpmyadmin

3. **Créer la base de données** :
   - Cliquer sur "Nouvelle base de données" (ou "New")
   - Nom : `PPE`
   - Interclassement : `utf8mb4_unicode_ci`
   - Cliquer sur "Créer"

4. **Importer le schéma** :
   - Sélectionner la base de données `PPE` dans le panneau de gauche
   - Cliquer sur l'onglet "Importer" (Import)
   - Cliquer sur "Choisir un fichier"
   - Sélectionner le fichier : `database/schema.sql`
   - Faire défiler vers le bas et cliquer sur "Exécuter" (Go)
   - ✅ Vous devriez voir un message de succès

5. **Vérifier** :
   - Dans le panneau de gauche, cliquer sur `PPE`
   - Vous devriez voir 7 tables :
     - ✅ users
     - ✅ student_profiles
     - ✅ courses
     - ✅ qcms
     - ✅ flashcards
     - ✅ flashcard_progress
     - ✅ matieres (avec des données pré-remplies)

### Option B : Ligne de commande MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données
CREATE DATABASE PPE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Utiliser la base de données
USE PPE;

# Importer le schéma
SOURCE database/schema.sql;

# Vérifier
SHOW TABLES;

# Quitter
EXIT;
```

## Étape 2 : Installer les dépendances

Les dépendances sont déjà installées ! Si ce n'est pas le cas :

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

## Étape 3 : Vérifier la configuration

Le fichier `.env` est déjà configuré avec les valeurs par défaut :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=              # Vide par défaut (XAMPP)
DB_NAME=PPE
DB_PORT=3306
```

⚠️ **Si votre MySQL a un mot de passe** :
- Ouvrir le fichier `.env`
- Modifier la ligne : `DB_PASSWORD=votre_mot_de_passe`

## Étape 4 : Démarrer l'application

### Méthode simple (2 terminaux)

**Terminal 1 - Backend** :
```bash
npm run server
```
Attendez de voir :
```
✅ Connexion MySQL réussie à la base de données PPE
🚀 Serveur démarré sur le port 5000
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm start
```
Votre navigateur devrait s'ouvrir automatiquement sur http://localhost:3000

### Méthode avancée (1 terminal)

```bash
npm run dev
```
Cette commande démarre le backend ET le frontend en même temps.

## ✅ Test de l'application

1. **Page d'accueil** : Vous devriez voir la page de connexion
2. **Créer un compte** :
   - Cliquer sur "S'inscrire"
   - Remplir le formulaire
   - Cliquer sur "S'inscrire"

3. **Onboarding** :
   - **Étape 1** : Choisir votre année (ex: Ing3)
   - **Étape 2** : Si Ing4/Ing5, choisir la majeure, sinon choisir vos points forts
   - **Étape 3** : Choisir vos points faibles (optionnel)
   - **Étape 4** : Remplir vos objectifs (optionnel)
   - Cliquer sur "Terminer"

4. **Dashboard** : Vous êtes maintenant sur votre tableau de bord !

## 🐛 Problèmes courants

### ❌ "Erreur de connexion MySQL"
**Solution** :
- Vérifier que MySQL est démarré dans XAMPP
- Vérifier que la base `PPE` existe
- Vérifier le mot de passe dans `.env`

### ❌ "Cannot find module 'express'"
**Solution** :
```bash
npm install
```

### ❌ Le frontend ne se connecte pas
**Solution** :
- Vérifier que le backend tourne (http://localhost:5000/api/health)
- Si vous voyez un message JSON, le backend fonctionne ✅

### ❌ "Email ou mot de passe incorrect" lors de la connexion
**Solution** :
- Créer un nouveau compte avec "S'inscrire"
- Les mots de passe ne sont pas stockés en clair, impossible de les récupérer

### ❌ Port 3000 déjà utilisé
**Solution** :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou utiliser un autre port
set PORT=3001 && npm start
```

## 📊 Vérifier que tout fonctionne

### Test du Backend
Ouvrir http://localhost:5000/api/health dans le navigateur.

Vous devriez voir :
```json
{
  "success": true,
  "message": "API PPE ECE - Serveur opérationnel",
  "timestamp": "2024-..."
}
```

### Test de la Base de données
Dans phpMyAdmin :
1. Aller dans la base `PPE`
2. Onglet "SQL"
3. Exécuter : `SELECT * FROM matieres;`
4. Vous devriez voir 10 matières (Mathématiques, Physique, etc.)

## 🎉 C'est terminé !

Votre plateforme ECE est maintenant opérationnelle !

**Prochaines étapes** :
- Tester l'inscription et l'onboarding
- Explorer le dashboard
- Préparer l'intégration de l'API Claude pour les QCMs

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifier les logs dans les terminaux
2. Vérifier les erreurs dans la console du navigateur (F12)
3. Consulter le README.md pour plus de détails
