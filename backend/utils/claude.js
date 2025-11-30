const OpenAI = require('openai');

// Fonction pour obtenir le client OpenAI (lazy initialization)
const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY non configurée');
    }
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

/**
 * Génère un QCM à partir d'un contenu de cours
 */
const generateQCM = async (courseContent, options = {}) => {
    const {
        nombreQuestions = 10,
        difficulte = 'moyen',
        matiere = '',
        annee = ''
    } = options;

    const prompt = `Tu es un assistant pédagogique expert pour l'école d'ingénieurs ECE.

CONTEXTE DES COURS :
${courseContent}

TÂCHE :
Génère ${nombreQuestions} questions à choix multiples (QCM) de niveau ${difficulte} basées UNIQUEMENT sur le contenu fourni ci-dessus.

Matière : ${matiere}
Année : ${annee}

RÈGLES IMPORTANTES :
- Crée des questions pertinentes et pédagogiques
- 4 options de réponse par question (A, B, C, D)
- Une seule bonne réponse par question
- Fournis une explication claire pour chaque bonne réponse
- Adapte la difficulté :
  * Facile : questions de compréhension directe
  * Moyen : questions d'application et d'analyse
  * Difficile : questions de synthèse et de réflexion critique
- Assure-toi que les questions couvrent différents aspects du cours

FORMAT DE RÉPONSE (JSON strict) :
{
  "qcm": [
    {
      "question": "Question ici ?",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correct_answer": "A",
      "explanation": "Explication de pourquoi A est correct",
      "difficulty": "${difficulte}",
      "topic": "Sous-thème du cours"
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0].message.content;
        const qcmData = JSON.parse(responseText);
        return qcmData.qcm;

    } catch (error) {
        console.error('Erreur génération QCM:', error);
        throw new Error('Erreur lors de la génération du QCM');
    }
};

/**
 * Génère des flashcards à partir d'un contenu de cours
 */
const generateFlashcards = async (courseContent, options = {}) => {
    const {
        nombreCartes = 20,
        matiere = '',
        annee = ''
    } = options;

    const prompt = `Tu es un assistant pédagogique expert pour l'école d'ingénieurs ECE.

CONTEXTE DES COURS :
${courseContent}

TÂCHE :
Génère ${nombreCartes} flashcards (cartes mémoire) basées sur le contenu fourni ci-dessus.

Matière : ${matiere}
Année : ${annee}

RÈGLES IMPORTANTES :
- Crée des cartes couvrant les concepts clés du cours
- Recto : Question ou concept à retenir
- Verso : Réponse claire et concise
- Inclus définitions, formules, concepts importants
- Assure-toi que les cartes sont progressives (du simple au complexe)
- Fournis des exemples pratiques quand c'est pertinent

FORMAT DE RÉPONSE (JSON strict) :
{
  "flashcards": [
    {
      "front": "Question ou concept",
      "back": "Réponse ou explication",
      "category": "Catégorie (ex: Définition, Formule, Concept, etc.)",
      "difficulty": "facile|moyen|difficile"
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0].message.content;
        const flashcardsData = JSON.parse(responseText);
        return flashcardsData.flashcards;

    } catch (error) {
        console.error('Erreur génération flashcards:', error);
        throw new Error('Erreur lors de la génération des flashcards');
    }
};

/**
 * Répond à une question sur un passage de cours
 */
const answerQuestion = async (question, context, options = {}) => {
    const { matiere = '', titre = '' } = options;

    const prompt = `Tu es un assistant pédagogique expert pour l'école d'ingénieurs ECE.

CONTEXTE DU COURS :
${titre ? `Titre : ${titre}` : ''}
${matiere ? `Matière : ${matiere}` : ''}

EXTRAIT DU COURS :
${context}

QUESTION DE L'ÉTUDIANT :
${question}

CONSIGNES :
- Réponds de manière claire, pédagogique et concise
- Base ta réponse UNIQUEMENT sur le contenu fourni ci-dessus
- Si la réponse n'est pas dans le contexte, indique-le poliment
- Utilise des exemples du cours si pertinent
- Adapte ton langage pour un étudiant ingénieur

Réponds directement sans introduction.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 1000
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Erreur réponse question:', error);
        throw new Error('Erreur lors de la génération de la réponse');
    }
};

module.exports = {
    generateQCM,
    generateFlashcards,
    answerQuestion
};
