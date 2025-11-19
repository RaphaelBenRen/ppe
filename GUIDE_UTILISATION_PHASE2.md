# 📖 Guide d'Utilisation - Phase 2

## 🚀 Démarrage Rapide

### Étape 1 : Démarrer les Serveurs

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd frontend
npm start
```

Attendre que les deux serveurs démarrent :
- Backend : http://localhost:5001
- Frontend : http://localhost:3000

### Étape 2 : Se Connecter

1. Ouvrir http://localhost:3000
2. Se connecter avec votre compte
3. Vous arrivez sur le nouveau Dashboard ✨

---

## 📚 Uploader un Cours

### Méthode 1 : Clic

1. Dans la section **"Uploader un cours"**
2. Cliquer sur la zone de upload
3. Sélectionner un fichier (PDF, DOCX ou TXT)
4. Remplir le formulaire :
   - **Titre** : Ex: "Cours de Mathématiques Chapitre 1"
   - **Matière** : Choisir dans la liste
   - **Année** : Ing1 à Ing5
   - **Type** : cours, annale, TD, TP, résumé
   - **Description** : (optionnel)
5. Cliquer sur **"Uploader le cours"**

### Méthode 2 : Drag & Drop

1. Glisser un fichier sur la zone de upload
2. Remplir le formulaire
3. Uploader !

### ✅ Confirmation

Vous verrez :
- ✅ Message "Cours uploadé avec succès !"
- Le cours apparaît dans **"Mes cours"**

---

## 🎯 Générer un QCM

### Étape 1 : Choisir un Cours

Dans la section **"Mes cours"**, cliquer sur le bouton **"QCM"** du cours souhaité.

### Étape 2 : Configurer le QCM

Une modal s'ouvre avec les options :

- **Nombre de questions** :
  - 5 questions (rapide)
  - 10 questions (standard)
  - 15 questions (approfondi)
  - 20 questions (complet)

- **Difficulté** :
  - Facile : Questions de compréhension directe
  - Moyen : Questions d'application et d'analyse
  - Difficile : Questions de synthèse et réflexion

### Étape 3 : Générer

1. Cliquer sur **"Générer le QCM avec IA"**
2. Attendre (10-30 secondes) ⏳
3. Claude analyse votre cours et génère les questions

### Étape 4 : Prévisualiser

Vous verrez :
- ✅ "QCM généré avec succès !"
- Les 3 premières questions en aperçu
- La bonne réponse est surlignée en vert

### 📊 Format des Questions

Chaque question contient :
- **Question** : Énoncé clair
- **4 Options** : A, B, C, D
- **Bonne réponse** : Indiquée
- **Explication** : Pourquoi cette réponse est correcte
- **Difficulté** : facile/moyen/difficile
- **Topic** : Sous-thème du cours

---

## 🗂️ Générer des Flashcards

### Étape 1 : Choisir un Cours

Dans **"Mes cours"**, cliquer sur le bouton **"Flash"** du cours.

### Étape 2 : Configurer

Choisir le nombre de flashcards :
- 10 cartes (révision rapide)
- 20 cartes (standard)
- 30 cartes (complet)
- 50 cartes (exhaustif)

### Étape 3 : Générer

1. Cliquer sur **"Générer les Flashcards avec IA"**
2. Attendre (10-30 secondes) ⏳
3. Claude crée des flashcards optimisées

### Étape 4 : Prévisualiser

Vous verrez :
- ✅ "Flashcards générées avec succès !"
- Les 5 premières cartes en aperçu
- Format Recto/Verso

### 📇 Format des Flashcards

Chaque carte contient :
- **Recto** : Question ou concept à retenir
- **Verso** : Réponse ou explication
- **Catégorie** : Définition, Formule, Concept, etc.
- **Difficulté** : facile/moyen/difficile

---

## 🎓 Exemples Concrets

### Exemple 1 : Upload d'un Cours de Maths

```
Titre : Dérivées et Primitives
Matière : Mathématiques
Année : Ing2
Type : Cours
Description : Chapitre 3 - Calcul différentiel
```

### Exemple 2 : QCM Généré

**Question 1** (Moyen)
*Quelle est la dérivée de f(x) = x² ?*

A) x
B) 2x ✅
C) x²
D) 2

**Explication** : La dérivée d'une fonction puissance x^n est n·x^(n-1). Pour x², cela donne 2x.

### Exemple 3 : Flashcard Générée

**Recto**
Qu'est-ce qu'une primitive ?

**Verso**
Une primitive de f est une fonction F telle que F'(x) = f(x). C'est l'opération inverse de la dérivation.

**Catégorie** : Définition

---

## 💡 Astuces & Bonnes Pratiques

### Pour de Meilleurs QCMs

✅ **Uploadez des cours complets**
Plus le cours est détaillé, meilleurs seront les QCMs.

✅ **Choisissez le bon niveau**
- Avant exam : Difficile
- Révision : Moyen
- Découverte : Facile

✅ **Formats recommandés**
PDF avec texte (pas de scan d'images)

### Pour de Meilleures Flashcards

✅ **Cours structurés**
Avec définitions, formules, concepts clairs

✅ **Nombre adapté**
- Chapitre court : 10-20 cartes
- Chapitre complet : 30-50 cartes

✅ **Relecture recommandée**
Claude est performant mais vérifiez toujours !

### Fichiers PDF

✅ **Privilégiez** : PDF avec texte sélectionnable
❌ **Évitez** : Scans d'images (non reconnus)

Si vous avez un scan :
1. Utiliser un OCR (ex: Adobe, Google Drive)
2. Exporter en texte
3. Uploader le fichier texte

---

## 🐛 Résolution de Problèmes

### Le QCM ne se génère pas

**Cause possible** : Fichier trop long

**Solution** :
- Diviser le cours en plusieurs fichiers plus courts
- Générer plusieurs QCMs de 5-10 questions

**Cause possible** : Erreur API Claude

**Solution** :
- Vérifier la console (F12)
- Réessayer dans quelques secondes
- Vérifier la clé API dans `.env`

### L'upload échoue

**Cause** : Fichier trop gros (> 10 MB)

**Solution** :
- Compresser le PDF
- Diviser en plusieurs fichiers

**Cause** : Format non supporté

**Solution** :
- Convertir en PDF, DOCX ou TXT
- Vérifier l'extension du fichier

### Aucun cours n'apparaît

**Cause** : Erreur de chargement

**Solution** :
- Rafraîchir la page (F5)
- Vérifier la console
- Se déconnecter/reconnecter

---

## 📊 Statistiques

### Ce que vous pouvez suivre :

- Nombre de cours uploadés
- Nombre de QCMs générés (bientôt)
- Scores moyens (bientôt)
- Temps de révision (bientôt)

---

## 🎯 Cas d'Usage

### 1. Préparation d'Examen

1. Uploader tous les cours du semestre
2. Générer des QCMs difficiles
3. Générer des flashcards pour révision
4. Passer les QCMs
5. Réviser avec les flashcards

### 2. Révision Rapide

1. Uploader le résumé de cours
2. Générer 10 flashcards
3. Réviser quotidiennement

### 3. Annales

1. Uploader les annales des années précédentes
2. Générer des QCMs similaires
3. S'entraîner sur des questions types

---

## ✨ Fonctionnalités à Venir (Phase 3)

### Passage de QCM Interactif
- Timer par question
- Score en temps réel
- Correction détaillée
- Historique des scores

### Révision Flashcards
- Mode révision interactive
- Flip des cartes
- Spaced repetition
- Statistiques de mémorisation

### Statistiques
- Graphiques de progression
- Matières à améliorer
- Temps de révision
- Comparaison avec la classe

---

## 📞 Support

### En cas de problème :

1. **Consulter ce guide** 📖
2. **Vérifier la console** (F12 dans le navigateur)
3. **Vérifier les logs serveur** (terminal backend)
4. **Relancer les serveurs**

### Logs à partager si besoin :

```bash
# Backend
npm run server

# Frontend
cd frontend
npm start
```

---

**Bon apprentissage avec l'IA ! 🚀**

*La plateforme ECE - Propulsé par Claude AI*
