# ⚡ Démarrage Rapide - 5 minutes

## 🎯 Checklist avant de commencer

- [ ] XAMPP installé
- [ ] Node.js installé (version 14+)
- [ ] Base de données `PPE` créée dans phpMyAdmin

## 🚀 Étapes rapides

### 1️⃣ Importer la base de données (30 secondes)

1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Sélectionner la base `PPE` (à gauche)
3. Onglet "Importer" → Choisir `database/schema.sql` → Exécuter

### 2️⃣ Démarrer l'application (10 secondes)

**Option A : Double-clic sur `start.bat`** ✨
- Deux fenêtres vont s'ouvrir (backend + frontend)
- Attendre que le navigateur s'ouvre automatiquement

**Option B : Ligne de commande**
```bash
# Terminal 1
npm run server

# Terminal 2 (nouveau terminal)
cd frontend
npm start
```

### 3️⃣ Tester (2 minutes)

1. **Page de connexion** apparaît → http://localhost:3000
2. Cliquer sur **"S'inscrire"**
3. Remplir le formulaire
4. **Onboarding** :
   - Choisir votre année (ex: Ing3)
   - Choisir vos points forts
   - Cliquer sur "Suivant" puis "Terminer"
5. **Dashboard** → Vous êtes connecté ! 🎉

## ✅ Vérifications rapides

### Le backend fonctionne ?
Ouvrir : http://localhost:5000/api/health

Vous devriez voir :
```json
{
  "success": true,
  "message": "API PPE ECE - Serveur opérationnel"
}
```

### La base de données est prête ?
Dans phpMyAdmin :
- Base `PPE` → 7 tables visibles
- Table `matieres` → 10 lignes de données

## ❌ Problème ?

### Backend ne démarre pas
→ Vérifier que MySQL est démarré dans XAMPP

### "Cannot find module"
→ Exécuter : `npm install`

### Le frontend affiche une erreur
→ Vérifier que le backend tourne (localhost:5000)

## 📂 Structure simplifiée

```
PPE Site/
├── backend/          → API Node.js
├── frontend/         → Interface React
├── database/         → Schéma SQL
├── start.bat         → Démarrage automatique
└── .env              → Configuration (déjà prête)
```

## 🎓 Utilisation

1. **S'inscrire** → Créer un compte
2. **Onboarding** → Renseigner votre profil
3. **Dashboard** → Accéder aux fonctionnalités

## 📚 Documentation complète

- `INSTALLATION.md` → Guide détaillé
- `README.md` → Documentation technique
- `PROJET_SYNTHESE.md` → Vue d'ensemble

## 🎉 C'est tout !

Votre plateforme ECE est prête en **5 minutes** !

**Prochaines étapes** :
- Tester l'inscription et l'onboarding
- Explorer le code source
- Préparer l'intégration de l'API Claude

---

**Besoin d'aide ?** Consulter `INSTALLATION.md` pour plus de détails.
