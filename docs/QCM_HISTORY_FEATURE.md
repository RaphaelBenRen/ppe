# Feature: QCM History Tracking

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de sauvegarder et consulter l'historique complet de leurs tentatives de QCM, leur permettant de suivre leur progression au fil du temps.

## Fonctionnalités principales

1. **Sauvegarde automatique des tentatives** - Chaque fois qu'un utilisateur complète un QCM, ses réponses sont enregistrées dans l'historique
2. **Tentatives multiples** - Les utilisateurs peuvent refaire un QCM autant de fois qu'ils le souhaitent
3. **Statistiques de progression** - Vue d'ensemble avec meilleur score, moyenne et nombre total de tentatives
4. **Détail des réponses** - Consultation détaillée de chaque tentative avec réponses correctes/incorrectes
5. **Visualisation colorée** - Code couleur pour identifier rapidement les performances (vert ≥80%, orange ≥60%, rouge <60%)

## Architecture de la solution

### 1. Base de données

**Nouvelle table: `qcm_attempts`**

```sql
CREATE TABLE IF NOT EXISTS qcm_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    qcm_id INT NOT NULL,
    user_id INT NOT NULL,
    answers_data JSON NOT NULL,          -- Données complètes des réponses
    score INT NOT NULL,                   -- Score en pourcentage
    pourcentage DECIMAL(5,2) NOT NULL,    -- Pourcentage précis
    nombre_correctes INT NOT NULL,        -- Nombre de réponses correctes
    nombre_incorrectes INT NOT NULL,      -- Nombre de réponses incorrectes
    temps_ecoule INT NULL,                -- Temps en secondes
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qcm_id) REFERENCES qcms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_qcm_user (qcm_id, user_id),
    INDEX idx_user_date (user_id, completed_at)
);
```

**Structure du champ JSON `answers_data`:**
```json
[
  {
    "questionIndex": 0,
    "question": "Texte de la question",
    "userAnswer": "A",
    "correctAnswer": "B",
    "isCorrect": false,
    "explanation": "Explication de la réponse",
    "options": {
      "A": "Option A",
      "B": "Option B",
      "C": "Option C",
      "D": "Option D"
    }
  }
]
```

### 2. Backend API

**Fichier modifié:** `backend/routes/qcm.js`

#### Routes ajoutées:

1. **GET `/qcm/:id/attempts`** - Récupère toutes les tentatives d'un QCM
   - Retourne: liste des tentatives avec scores et dates
   - Ordre: du plus récent au plus ancien

2. **GET `/qcm/:id/attempts/:attemptId`** - Récupère le détail d'une tentative
   - Retourne: données complètes de la tentative avec toutes les réponses

#### Route modifiée:

**POST `/qcm/:id/submit`** - Soumission d'un QCM
- Maintenant sauvegarde chaque tentative dans `qcm_attempts`
- Stocke les données complètes (questions, réponses, options)
- Met à jour le meilleur score du QCM seulement si le nouveau score est supérieur
- Accepte le paramètre `tempsEcoule` (optionnel)

### 3. Mobile App

#### API Client (`mobile-app/src/utils/api.js`)

**Méthodes ajoutées:**
```javascript
getAttempts: async (id) => {
    return apiRequest(`/qcm/${id}/attempts`);
},

getAttemptDetail: async (id, attemptId) => {
    return apiRequest(`/qcm/${id}/attempts/${attemptId}`);
}
```

**Méthode modifiée:**
```javascript
submitQCM: async (id, answers, tempsEcoule) => {
    return apiRequest(`/qcm/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, tempsEcoule }),
    });
}
```

#### Nouveaux écrans

##### QCMHistoryScreen (`mobile-app/src/screens/QCMHistoryScreen.js`)

**Fonctionnalités:**
- Affiche une carte de statistiques globales:
  - Nombre total de tentatives
  - Meilleur score (avec code couleur)
  - Score moyen
- Liste toutes les tentatives avec:
  - Numéro de tentative
  - Score avec badge coloré
  - Nombre de réponses correctes/incorrectes
  - Temps écoulé
  - Date de complétion
- Bouton pour voir le détail de chaque tentative

**Navigation:**
```javascript
navigation.navigate('QCMAttemptDetail', {
    qcmId: qcmId,
    attemptId: attempt.id,
    qcmTitle: qcmTitle
})
```

##### QCMAttemptDetailScreen (`mobile-app/src/screens/QCMAttemptDetailScreen.js`)

**Fonctionnalités:**
- Cercle de score avec code couleur
- Statistiques résumées (correctes/incorrectes)
- Liste détaillée de toutes les questions avec:
  - Texte de la question
  - Toutes les options (colorées selon correct/incorrect)
  - Indication visuelle (✓ et ✗)
  - Comparaison réponse utilisateur vs réponse correcte
  - Explications (si disponibles)

**Code couleur:**
```javascript
const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // Vert
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336';                   // Rouge
};
```

#### Navigation (`mobile-app/src/navigation/AppNavigator.js`)

**Routes ajoutées:**
```javascript
<Stack.Screen name="QCMHistory" component={QCMHistoryScreen} />
<Stack.Screen name="QCMAttemptDetail" component={QCMAttemptDetailScreen} />
```

#### Écran modifié: QCMDetailScreen

**Bouton ajouté** dans la section résultats:
```javascript
<TouchableOpacity
    style={[styles.actionBtn, styles.historyBtn]}
    onPress={() => navigation.navigate('QCMHistory', {
        qcmId: qcmId,
        qcmTitle: qcmTitle
    })}
>
    <Text style={styles.actionBtnText}>📊 Voir l'historique</Text>
</TouchableOpacity>
```

## Flux utilisateur

### Option 1: Commencer un QCM
1. **Liste des QCMs**
   - L'utilisateur voit la liste de ses QCMs
   - Chaque carte affiche deux boutons: "▶ Commencer" et "📊 Historique"

2. **Faire le QCM**
   - Clique sur "▶ Commencer"
   - Répond aux questions
   - Clique sur "Terminer"
   - Voit ses résultats

3. **Consulter l'historique depuis les résultats**
   - Depuis l'écran de résultats, clique sur "📊 Voir l'historique"
   - Accède à l'historique complet

### Option 2: Consulter l'historique directement
1. **Accès direct**
   - Depuis la liste des QCMs, clique sur "📊 Historique"
   - Accède directement à l'historique sans faire le QCM

2. **Voir les statistiques**
   - Consulte les statistiques globales (tentatives, meilleur score, moyenne)
   - Visualise le graphique de progression (si plusieurs tentatives)
   - Voit la liste de toutes ses tentatives

3. **Voir le détail d'une tentative**
   - Clique sur "Voir le détail" d'une tentative
   - Voit toutes les questions avec ses réponses
   - Compare avec les bonnes réponses
   - Lit les explications

## Migration de base de données

**Fichier:** `database/migrations/add_qcm_attempts_table.sql`

Pour les bases de données existantes, exécutez:
```bash
mysql -u username -p database_name < database/migrations/add_qcm_attempts_table.sql
```

## Fichiers modifiés

### Base de données
- ✅ `database/schema.sql` - Ajout table qcm_attempts
- ✅ `database/migrations/add_qcm_attempts_table.sql` - Script de migration

### Backend
- ✅ `backend/routes/qcm.js` - Nouvelles routes + modification submit

### Mobile App
- ✅ `mobile-app/src/utils/api.js` - Nouvelles méthodes API
- ✅ `mobile-app/src/screens/QCMScreen.js` - Ajout boutons "Commencer" et "Historique"
- ✅ `mobile-app/src/screens/QCMHistoryScreen.js` - Nouveau (liste des tentatives + graphique)
- ✅ `mobile-app/src/screens/QCMAttemptDetailScreen.js` - Nouveau (détail d'une tentative)
- ✅ `mobile-app/src/screens/QCMDetailScreen.js` - Ajout bouton historique dans résultats
- ✅ `mobile-app/src/navigation/AppNavigator.js` - Enregistrement nouvelles routes

## Tests recommandés

1. **Test de sauvegarde**
   - Compléter un QCM
   - Vérifier que la tentative est enregistrée en base de données

2. **Test tentatives multiples**
   - Refaire le même QCM plusieurs fois
   - Vérifier que toutes les tentatives sont sauvegardées
   - Vérifier que seul le meilleur score met à jour le QCM

3. **Test navigation**
   - Accéder à l'historique depuis les résultats
   - Naviguer vers le détail d'une tentative
   - Revenir en arrière

4. **Test affichage**
   - Vérifier le code couleur des scores
   - Vérifier l'affichage des réponses correctes/incorrectes
   - Vérifier les statistiques calculées

## Fonctionnalités implémentées

1. ✅ **Graphique de progression** - Visualisation en barres de l'évolution des scores
   - Affichage uniquement si 2+ tentatives
   - Barres colorées selon le score (vert/orange/rouge)
   - Axe Y avec graduations (0-100%)
   - Numérotation des tentatives sur l'axe X

2. ✅ **Accès direct à l'historique** - Bouton "📊 Historique" sur chaque QCM
   - Visible dès la liste des QCMs
   - Permet de consulter l'historique sans refaire le QCM

3. ✅ **Bouton "Commencer"** - Séparation claire des actions
   - Bouton "▶ Commencer" pour faire le QCM
   - Bouton "📊 Historique" pour voir les tentatives

## Améliorations futures possibles

1. **Graphique en ligne** - Courbe d'évolution au lieu de barres
2. **Filtres et tri** - Filtrer par date, score, etc.
3. **Comparaison de tentatives** - Comparer 2 tentatives côte à côte
4. **Export PDF** - Télécharger un rapport de tentative
5. **Statistiques avancées** - Temps moyen par question, questions les plus difficiles
6. **Recommandations** - Suggestions de révision basées sur les erreurs récurrentes
7. **Graphique interactif** - Cliquer sur une barre pour voir le détail de la tentative

## Notes techniques

- La table `qcm_attempts` utilise `ON DELETE CASCADE` pour nettoyer automatiquement les tentatives si un QCM ou un utilisateur est supprimé
- Les index sur `(qcm_id, user_id)` et `(user_id, completed_at)` optimisent les requêtes fréquentes
- Le stockage JSON permet une flexibilité maximale pour les données de réponses
- La séparation entre `score` (entier) et `pourcentage` (décimal) permet précision et simplicité
