        // Définition des groupes de verbes
// Définition des groupes de verbes
const verbGroups = [
    // Groupe 1
    [
        ["be", "was/were", "been", "être"],
        ["become", "became", "become", "devenir"],
        ["break", "broke", "broken", "casser"],
        ["build", "built", "built", "construire"],
        ["buy", "bought", "bought", "acheter"],
        ["come", "came", "come", "venir"],
        ["do", "did", "done", "faire"],
        ["fall", "fell", "fallen", "tomber"],
        ["get", "got", "got/gotten", "obtenir"],
        ["give", "gave", "given", "donner"]
    ],
    // Groupe 2
    [
        ["go", "went", "gone", "aller"],
        ["have", "had", "had", "avoir"],
        ["hurt", "hurt", "hurt", "blesser"],
        ["learn", "learned/learnt", "learned/learnt", "apprendre"],
        ["leave", "left", "left", "partir/quitter"],
        ["meet", "met", "met", "rencontrer"],
        ["read", "read", "read", "lire"],
        ["run", "ran", "run", "courir"],
        ["say", "said", "said", "dire"],
        ["see", "saw", "seen", "voir"]
    ],
    // Groupe 3
    [
        ["sleep", "slept", "slept", "dormir"],
        ["spend", "spent", "spent", "dépenser"],
        ["take", "took", "taken", "prendre"],
        ["win", "won", "won", "gagner"],
        ["write", "wrote", "written", "écrire"],
        ["begin", "began", "begun", "commencer"],
        ["bring", "brought", "brought", "apporter"],
        ["choose", "chose", "chosen", "choisir"],
        ["cut", "cut", "cut", "couper"],
        ["draw", "drew", "drawn", "dessiner"]
    ],
    // Groupe 4
    [
        ["dream", "dreamt", "dreamt", "rêver"],
        ["drink", "drank", "drunk", "boire"],
        ["drive", "drove", "driven", "conduire"],
        ["eat", "ate", "eaten", "manger"],
        ["find", "found", "found", "trouver"],
        ["fly", "flew", "flown", "voler"],
        ["forget", "forgot", "forgotten", "oublier"],
        ["hit", "hit", "hit", "frapper"],
        ["know", "knew", "known", "savoir"],
        ["make", "made", "made", "fabriquer"]
    ],
    // Groupe 5 - laissé vide mais correctement défini
    [
        ["pay", "paid", "paid", "payer"],
        ["put", "put", "put", "mettre"],
        ["ride", "rode", "ridden", "aller à vélo, à cheval"],
        ["send", "sent", "sent", "envoyer"],
        ["sing", "sang", "sung", "chanter"],
        ["speak", "spoke", "spoken", "parler"],
        ["tell", "told", "told", "dire, raconter"],
        ["think", "thought", "thought", "penser, réfléchir"],
        ["understand", "understood", "understood", "comprendre"],
        ["wake up", "woke up", "woken up", "se réveiller"]
    ],
];

        // Variables globales
        let activeVerbs = [];
        let currentVerb = null;
        let currentExerciseType = 0;
        let correctAnswer = "";
        let score = 0;
        let totalQuestions = 0;
        let streak = 0;
        let streakGoal = 25;
        let selectedOption = null;
        let selectedGroups = [];

        // Éléments du DOM
        const selectionSection = document.getElementById('selection-section');
        const exerciseSection = document.getElementById('exercise-section');
        const completionSection = document.getElementById('completion-section');
        const questionElement = document.getElementById('question');
        const answerContainer = document.getElementById('answer-container');
        const feedbackContainer = document.getElementById('feedback-container');
        const checkButton = document.getElementById('check-btn');
        const nextButton = document.getElementById('next-btn');
        const scoreElement = document.getElementById('score');
        const totalElement = document.getElementById('total');
        const streakElement = document.getElementById('streak');
        const streakTargetElement = document.getElementById('streak-target');
        const startButton = document.getElementById('start-btn');
        const restartButton = document.getElementById('restart-btn');
        const newSessionButton = document.getElementById('new-session-btn');
        const group1Checkbox = document.getElementById('group1');
        const group2Checkbox = document.getElementById('group2');
        const group3Checkbox = document.getElementById('group3');
		const group4Checkbox = document.getElementById('group4');
		const group5Checkbox = document.getElementById('group5');
        const streakGoalInput = document.getElementById('streak-goal');
        const finalStreakGoalElement = document.getElementById('final-streak-goal');
        const finalScoreElement = document.getElementById('final-score');
        const finalTotalElement = document.getElementById('final-total');
        const finalAccuracyElement = document.getElementById('final-accuracy');

        // Démarrer l'application
        startButton.addEventListener('click', function() {
// Vérifier qu'au moins un groupe est sélectionné
if (!group1Checkbox.checked && !group2Checkbox.checked && !group3Checkbox.checked && !group4Checkbox.checked && !group5Checkbox.checked) {
    alert("Veuillez sélectionner au moins un groupe de verbes.");
    return;
}
            
            // Obtenir l'objectif de streak
            streakGoal = parseInt(streakGoalInput.value);
            if (isNaN(streakGoal) || streakGoal < 1) {
                alert("Veuillez entrer un objectif de série valide (nombre positif).");
                return;
            }
            
// Mémoriser les groupes sélectionnés
selectedGroups = [
    group1Checkbox.checked,
    group2Checkbox.checked,
    group3Checkbox.checked,
    group4Checkbox.checked,
	group5Checkbox.checked
];
            
            // Construire la liste des verbes actifs
            buildActiveVerbsList();
            
            // Passer à l'écran d'exercice
            selectionSection.style.display = 'none';
            exerciseSection.style.display = 'block';
            
            // Mettre à jour l'affichage de l'objectif de streak
            streakTargetElement.textContent = streakGoal;
            
            // Réinitialiser le score
            score = 0;
            totalQuestions = 0;
            streak = 0;
            updateScore();
            
            // Créer le premier exercice
            createNewExercise();
        });

// Construire la liste des verbes actifs
function buildActiveVerbsList() {
    activeVerbs = [];
    if (group1Checkbox.checked) activeVerbs = activeVerbs.concat(verbGroups[0]);
    if (group2Checkbox.checked) activeVerbs = activeVerbs.concat(verbGroups[1]);
    if (group3Checkbox.checked) activeVerbs = activeVerbs.concat(verbGroups[2]);
    if (group4Checkbox.checked) activeVerbs = activeVerbs.concat(verbGroups[3]);
    if (group5Checkbox.checked) activeVerbs = activeVerbs.concat(verbGroups[4]);
}


        // Mettre à jour l'affichage du score
        function updateScore() {
            scoreElement.textContent = score;
            totalElement.textContent = totalQuestions;
            streakElement.textContent = streak;
        }

        // Créer un nouvel exercice
        function createNewExercise() {
            // Réinitialiser l'interface
            answerContainer.innerHTML = '';
            feedbackContainer.innerHTML = '';
            checkButton.style.display = 'block';
            nextButton.style.display = 'none';
            selectedOption = null;
            
            // Sélectionner un verbe aléatoire
            currentVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
            
            // Sélectionner un type d'exercice aléatoire (0-3)
            // currentExerciseType = Math.floor(Math.random() * 4);
			
			// Définir les probabilités pour chaque type d'exercice (total doit être 100)
const probabilities = {
    qcm: 20,           // Type 0: QCM - 10% de chance
    textInput: 30,     // Type 1: Saisie de texte - 30% de chance
    enToFr: 25,        // Type 2: Anglais vers Français - 30% de chance
    frToEn: 25         // Type 3: Français vers Anglais - 30% de chance
};

// Sélectionner un type d'exercice selon les probabilités
const randomValue = Math.random() * 100;
let cumulativeProbability = 0;

if (randomValue < probabilities.qcm) {
    currentExerciseType = 0; // QCM
} else if (randomValue < probabilities.qcm + probabilities.textInput) {
    currentExerciseType = 1; // Saisie de texte
} else if (randomValue < probabilities.qcm + probabilities.textInput + probabilities.enToFr) {
    currentExerciseType = 2; // Anglais vers Français
} else {
    currentExerciseType = 3; // Français vers Anglais
}

            
            // Créer l'exercice selon le type
            switch (currentExerciseType) {
                case 0: // Prétérit ou participe passé (QCM)
                    createFormExercise();
                    break;
                case 1: // Prétérit ou participe passé (texte)
                    createFormInputExercise();
                    break;
                case 2: // Anglais vers Français
                    createEnglishToFrenchExercise();
                    break;
                case 3: // Français vers Anglais
                    createFrenchToEnglishExercise();
                    break;
            }
        }

        // Exercice: forme du verbe (QCM)
        function createFormExercise() {
            // Choisir prétérit ou participe passé
            const askForPast = Math.random() > 0.5;
            const formIndex = askForPast ? 1 : 2;
            
            correctAnswer = currentVerb[formIndex];
            
            // Créer la question
            questionElement.textContent = askForPast 
                ? `Quel est le prétérit du verbe "${currentVerb[0]}" (${currentVerb[3]}) ?`
                : `Quel est le participe passé du verbe "${currentVerb[0]}" (${currentVerb[3]}) ?`;
            
            // Créer les options
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
            
            // Préparer les options (1 correcte, 3 incorrectes)
            let options = [correctAnswer];
            
            while (options.length < 4) {
                const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
                if (randomVerb !== currentVerb) {
                    const wrongOption = randomVerb[formIndex];
                    if (!options.includes(wrongOption)) {
                        options.push(wrongOption);
                    }
                }
            }
            
            // Mélanger les options
            options.sort(() => Math.random() - 0.5);
            
            // Créer les boutons d'option
            options.forEach(option => {
                const optionButton = document.createElement('div');
                optionButton.className = 'option';
                optionButton.textContent = option;
                
                optionButton.addEventListener('click', function() {
                    // Désélectionner l'option précédente
                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }
                    
                    // Sélectionner cette option
                    this.classList.add('selected');
                    selectedOption = this;
                });
                
                optionsDiv.appendChild(optionButton);
            });
            
            answerContainer.appendChild(optionsDiv);
        }

        // Exercice: forme du verbe (input texte)
        function createFormInputExercise() {
            // Choisir prétérit ou participe passé
            const askForPast = Math.random() > 0.5;
            const formIndex = askForPast ? 1 : 2;
            
            correctAnswer = currentVerb[formIndex];
            
            // Créer la question
            questionElement.textContent = askForPast 
                ? `Écrivez le prétérit du verbe "${currentVerb[0]}" (${currentVerb[3]}) :`
                : `Écrivez le participe passé du verbe "${currentVerb[0]}" (${currentVerb[3]}) :`;
            
            // Créer l'input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'input-answer';
            input.placeholder = 'Votre réponse...';
            input.id = 'text-answer';
            
            // Ajouter un événement pour vérifier quand l'utilisateur appuie sur Entrée
            input.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    checkAnswer();
                }
            });
            
            answerContainer.appendChild(input);
            
            // Mettre le focus sur l'input
            setTimeout(() => input.focus(), 100);
        }

        // Exercice: Anglais vers Français
        function createEnglishToFrenchExercise() {
            correctAnswer = currentVerb[3]; // Traduction française
            
            // Créer la question
            questionElement.textContent = `Comment se dit "${currentVerb[0]}" en français ?`;
            
            // Créer les options
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
            
            // Préparer les options (1 correcte, 3 incorrectes)
            let options = [correctAnswer];
            
            while (options.length < 4) {
                const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
                if (randomVerb !== currentVerb) {
                    const wrongOption = randomVerb[3];
                    if (!options.includes(wrongOption)) {
                        options.push(wrongOption);
                    }
                }
            }
            
            // Mélanger les options
            options.sort(() => Math.random() - 0.5);
            
            // Créer les boutons d'option
            options.forEach(option => {
                const optionButton = document.createElement('div');
                optionButton.className = 'option';
                optionButton.textContent = option;
                
                optionButton.addEventListener('click', function() {
                    // Désélectionner l'option précédente
                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }
                    
                    // Sélectionner cette option
                    this.classList.add('selected');
                    selectedOption = this;
                });
                
                optionsDiv.appendChild(optionButton);
            });
            
            answerContainer.appendChild(optionsDiv);
        }

        // Exercice: Français vers Anglais
        function createFrenchToEnglishExercise() {
            correctAnswer = currentVerb[0]; // Forme infinitive anglaise
            
            // Créer la question
            questionElement.textContent = `Comment se dit "${currentVerb[3]}" en anglais ?`;
            
            // Créer les options
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';
            
            // Préparer les options (1 correcte, 3 incorrectes)
            let options = [correctAnswer];
            
            while (options.length < 4) {
                const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
                if (randomVerb !== currentVerb) {
                    const wrongOption = randomVerb[0];
                    if (!options.includes(wrongOption)) {
                        options.push(wrongOption);
                    }
                }
            }
            
            // Mélanger les options
            options.sort(() => Math.random() - 0.5);
            
            // Créer les boutons d'option
            options.forEach(option => {
                const optionButton = document.createElement('div');
                optionButton.className = 'option';
                optionButton.textContent = option;
                
                optionButton.addEventListener('click', function() {
                    // Désélectionner l'option précédente
                    if (selectedOption) {
                        selectedOption.classList.remove('selected');
                    }
                    
                    // Sélectionner cette option
                    this.classList.add('selected');
                    selectedOption = this;
                });
                
                optionsDiv.appendChild(optionButton);
            });
            
            answerContainer.appendChild(optionsDiv);
        }

        // Vérifier la réponse
        function checkAnswer() {
            let userAnswer = "";
            let isCorrect = false;
            
            // Obtenir la réponse de l'utilisateur selon le type d'exercice
            if (currentExerciseType === 1) { // Input texte
                const textInput = document.getElementById('text-answer');
                if (textInput) {
                    userAnswer = textInput.value.trim().toLowerCase();
                    
                    // Pour les cas comme "was/were"
                    const possibleAnswers = correctAnswer.split('/').map(a => a.trim().toLowerCase());
                    isCorrect = possibleAnswers.includes(userAnswer);
                    
                    // Désactiver l'input
                    textInput.disabled = true;
                    
                    // Styliser l'input selon la réponse
                    if (isCorrect) {
                        textInput.style.borderColor = '#58a700';
                        textInput.style.backgroundColor = '#eaf7d8';
                    } else {
                        textInput.style.borderColor = '#ff4b4b';
                        textInput.style.backgroundColor = '#ffdbdb';
                    }
                }
            } else { // QCM
                if (!selectedOption) {
                    // Aucune option sélectionnée
                    alert("Veuillez sélectionner une réponse");
                    return;
                }
                
                userAnswer = selectedOption.textContent;
                isCorrect = userAnswer === correctAnswer;
                
                // Marquer visuellement les options
                const options = document.querySelectorAll('.option');
                options.forEach(option => {
                    if (option.textContent === correctAnswer) {
                        option.classList.add('correct');
                    } else if (option === selectedOption && !isCorrect) {
                        option.classList.add('incorrect');
                    }
                });
            }
            
            // Mettre à jour le score
            totalQuestions++;
            if (isCorrect) {
                score++;
                streak++;
                
                // Afficher le feedback positif
                const feedback = document.createElement('div');
                feedback.className = 'feedback correct';
                feedback.textContent = '✅ Correct !';
                feedbackContainer.appendChild(feedback);
                
                // Vérifier si l'objectif est atteint
                if (streak >= streakGoal) {
                    showCompletionScreen();
                    return;
                }
            } else {
                streak = 0;
                
                // Afficher le feedback négatif
                const feedback = document.createElement('div');
                feedback.className = 'feedback incorrect';
                feedback.textContent = `❌ Incorrect. La bonne réponse est : ${correctAnswer}`;
                feedbackContainer.appendChild(feedback);
            }
            
            // Mettre à jour l'affichage du score
            updateScore();
            
            // Afficher le bouton pour passer à la question suivante
            checkButton.style.display = 'none';
            nextButton.style.display = 'block';
        }

        // Afficher l'écran de félicitations
        function showCompletionScreen() {
            // Mettre à jour les statistiques finales
            finalStreakGoalElement.textContent = streakGoal;
            finalScoreElement.textContent = score;
            finalTotalElement.textContent = totalQuestions;
            
            // Calculer la précision
            const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            finalAccuracyElement.textContent = accuracy;
            
            // Afficher l'écran de félicitations
            exerciseSection.style.display = 'none';
            completionSection.style.display = 'block';
        }

        // Redémarrer avec les mêmes paramètres
        function restart() {
            // Réinitialiser les scores
            score = 0;
            totalQuestions = 0;
            streak = 0;
            
            // Revenir à l'écran d'exercice
            completionSection.style.display = 'none';
            exerciseSection.style.display = 'block';
            
            // Mettre à jour l'affichage du score
            updateScore();
            
            // Créer un nouvel exercice
            createNewExercise();
        }

        // Nouvelle session
        function newSession() {
            // Revenir à l'écran de sélection
            completionSection.style.display = 'none';
            selectionSection.style.display = 'block';
        }

        // Passer à la question suivante
        function nextQuestion() {
            createNewExercise();
        }

        // Événements des boutons
        checkButton.addEventListener('click', checkAnswer);
        nextButton.addEventListener('click', nextQuestion);
        restartButton.addEventListener('click', restart);
        newSessionButton.addEventListener('click', newSession);