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

    const prompt = `Tu es un assistant pédagogique expert pour étudiants en école d'ingénieurs.

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
- IMPORTANT : Le contenu doit être strictement éducatif et approprié pour tous les âges. Ne génère JAMAIS de contenu violent, sexuel, discriminatoire, ou inapproprié.
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

    const prompt = `Tu es un assistant pédagogique expert pour étudiants en école d'ingénieurs.

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
- IMPORTANT : Le contenu doit être strictement éducatif et approprié pour tous les âges. Ne génère JAMAIS de contenu violent, sexuel, discriminatoire, ou inapproprié.

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
 * Extrait le texte d'une image via OCR avec GPT-4o Vision
 */
const extractTextFromImage = async (imageBase64, mimeType = 'image/jpeg') => {
    const prompt = `Tu es un assistant spécialisé dans l'extraction de texte depuis des images de cours et documents académiques.

TÂCHE :
Extrais TOUT le texte visible dans cette image de manière fidèle et structurée.

CONSIGNES :
- Retranscris le texte exactement comme il apparaît
- Conserve la structure (titres, paragraphes, listes, etc.)
- Si c'est un cours manuscrit, fais de ton mieux pour déchiffrer l'écriture
- Si c'est un tableau, conserve la structure tabulaire avec des séparateurs
- Si c'est un schéma ou diagramme, décris-le brièvement puis extrais les textes
- Pour les formules mathématiques, utilise une notation textuelle claire
- Si certaines parties sont illisibles, indique [illisible]

FORMAT :
Retourne uniquement le texte extrait, sans commentaire ni introduction.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${imageBase64}`,
                            detail: 'high'
                        }
                    }
                ]
            }],
            max_tokens: 4000
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Erreur OCR:', error);
        throw new Error('Erreur lors de l\'extraction du texte: ' + error.message);
    }
};

/**
 * Reformate et améliore la mise en page d'un texte de cours
 */
const reformatContent = async (content, options = {}) => {
    const { matiere = '', titre = '' } = options;

    const prompt = `Tu es un assistant spécialisé dans la mise en forme de cours académiques.

CONTEXTE :
${titre ? `Titre du cours : ${titre}` : ''}
${matiere ? `Matière : ${matiere}` : ''}

TEXTE BRUT À REFORMATER :
${content}

TÂCHE :
Reformate ce texte pour qu'il soit parfaitement lisible et bien structuré, tout en conservant TOUT le contenu original.

RÈGLES DE FORMATAGE :
- Identifie et mets en évidence les titres et sous-titres (utilise des lignes vides avant/après)
- Organise le texte en paragraphes logiques
- Crée des listes à puces (•) pour les énumérations
- Corrige les sauts de ligne mal placés (fusionne les lignes qui appartiennent au même paragraphe)
- Ajoute des espaces entre les sections pour améliorer la lisibilité
- Conserve les formules et termes techniques exactement comme ils sont
- Ne modifie PAS le contenu, seulement la mise en forme
- Ne supprime aucune information
- N'ajoute pas d'introduction, de conclusion ou de commentaire

FORMAT DE SORTIE :
Retourne UNIQUEMENT le texte reformaté, sans aucun commentaire, sans balises markdown (pas de # ou **), juste du texte bien structuré.`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.3,
            max_tokens: 4000
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Erreur reformatage:', error);
        throw new Error('Erreur lors du reformatage du contenu');
    }
};

/**
 * Répond à une question sur un passage de cours
 */
const answerQuestion = async (question, context, options = {}) => {
    const { matiere = '', titre = '' } = options;

    const prompt = `Tu es un assistant pédagogique expert pour étudiants en école d'ingénieurs.

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
- IMPORTANT : Le contenu doit être strictement éducatif et approprié. Ne génère JAMAIS de contenu violent, sexuel, discriminatoire, ou inapproprié.

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

/**
 * Parse un QCM existant (annales, exercices) depuis du texte brut
 */
const parseQCM = async (textContent, options = {}) => {
    const { titre = '', matiere = '' } = options;

    const prompt = `Tu es un assistant expert dans l'extraction et le parsing de QCM depuis des documents académiques (annales, exercices, etc.).

TEXTE À ANALYSER :
${textContent}

TÂCHE :
Extrais TOUTES les questions à choix multiples présentes dans ce texte et structure-les au format JSON.

RÈGLES D'EXTRACTION :
- Identifie chaque question et ses options de réponse (A, B, C, D ou 1, 2, 3, 4 ou similaire)
- Si les bonnes réponses sont indiquées dans le document (corrigé), récupère-les
- Si les bonnes réponses NE SONT PAS indiquées dans le document, TU DOIS ANALYSER LA QUESTION ET DÉTERMINER LA BONNE RÉPONSE toi-même en utilisant tes connaissances
- IMPORTANT : correct_answer ne doit JAMAIS être null. Tu dois TOUJOURS fournir une réponse correcte (A, B, C ou D)
- Si tu détermines la réponse toi-même, fournis une explication claire de pourquoi c'est la bonne réponse
- Numérote les questions dans l'ordre où elles apparaissent
- Ignore les textes qui ne sont pas des questions QCM

FORMAT DE RÉPONSE (JSON strict) :
{
  "titre_detecte": "Titre du QCM si détecté dans le texte, sinon null",
  "matiere_detectee": "Matière si détectée, sinon null",
  "answers_from_document": true si les réponses étaient dans le document, false si tu les as déterminées,
  "qcm": [
    {
      "question": "Texte complet de la question",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correct_answer": "A",
      "explanation": "Explication de pourquoi c'est la bonne réponse"
    }
  ]
}

IMPORTANT :
- Réponds UNIQUEMENT avec le JSON valide
- correct_answer doit TOUJOURS contenir une lettre (A, B, C ou D), JAMAIS null
- Si le texte ne contient pas de QCM, retourne {"qcm": [], "error": "Aucun QCM détecté dans le texte"}`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const responseText = completion.choices[0].message.content;
        const parsedData = JSON.parse(responseText);

        if (parsedData.error) {
            throw new Error(parsedData.error);
        }

        // Normaliser le format des questions
        const questions = parsedData.qcm.map((q, index) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || null,
            difficulty: 'moyen',
            topic: matiere || parsedData.matiere_detectee || 'Général'
        }));

        return {
            titre: titre || parsedData.titre_detecte || 'QCM importé',
            matiere: matiere || parsedData.matiere_detectee || 'Autre',
            answers_from_document: parsedData.answers_from_document || false,
            questions
        };

    } catch (error) {
        console.error('Erreur parsing QCM:', error);
        throw new Error('Erreur lors de l\'extraction du QCM: ' + error.message);
    }
};

/**
 * Résume un cours en gardant uniquement les notions essentielles
 */
const summarizeCourse = async (courseContent, options = {}) => {
    const { titre = '', matiere = '' } = options;

    const prompt = `Tu es un assistant pédagogique expert en synthèse de cours pour étudiants en école d'ingénieurs.

COURS À RÉSUMER :
${courseContent}

${titre ? `Titre du cours : ${titre}` : ''}
${matiere ? `Matière : ${matiere}` : ''}

OBJECTIF :
Crée un résumé TRÈS CONCIS du cours qui ne garde que les notions ESSENTIELLES à retenir.

RÈGLES DE RÉSUMÉ :
1. **Sois extrêmement synthétique** - Chaque phrase doit apporter une information cruciale
2. **Identifie les concepts clés** - Définitions, formules, théorèmes, principes fondamentaux
3. **Structure clairement** - Utilise des titres, sous-titres et listes à puces
4. **Priorise** - Garde uniquement ce qui serait dans une fiche de révision d'examen
5. **Formules importantes** - Conserve les formules mathématiques/scientifiques essentielles
6. **Pas de blabla** - Évite les introductions, transitions et conclusions inutiles

FORMAT ATTENDU :
- Utilise des **titres en gras** pour les sections
- Utilise des • pour les listes à puces
- Mets en évidence les termes importants
- Le résumé doit faire environ 20-30% de la taille originale maximum

Génère le résumé maintenant :`;

    try {
        const openai = getOpenAIClient();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.3,
            max_tokens: 2000,
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error('Erreur résumé cours:', error);
        throw new Error('Erreur lors de la génération du résumé: ' + error.message);
    }
};

module.exports = {
    generateQCM,
    generateFlashcards,
    answerQuestion,
    extractTextFromImage,
    reformatContent,
    parseQCM,
    summarizeCourse
};
