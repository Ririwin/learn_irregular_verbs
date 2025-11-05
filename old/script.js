// ========== MODE SOMBRE ========== 
// À AJOUTER AU DÉBUT DU FICHIER script.js

function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const controlsContainer = document.getElementById('top-right-controls');
  
  // On déplace le bouton dans son conteneur fixe
  if (darkModeToggle && controlsContainer) {
      controlsContainer.appendChild(darkModeToggle);
  }
  
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  if (savedDarkMode) {
      document.body.classList.add('dark-mode');
      if(darkModeToggle) darkModeToggle.textContent = '☀️';
  } else {
      document.body.classList.remove('dark-mode');
      if(darkModeToggle) darkModeToggle.textContent = '🌙';
  }

  if(darkModeToggle) {
      darkModeToggle.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
  console.log('Dark mode toggled:', isDarkMode);
}


const helpButton = document.getElementById('help-btn');
if (helpButton) {
    helpButton.addEventListener('click', showHelpModal);
}


// ========== MODES D'APPRENTISSAGE ==========

let isTimedMode = false;
let timerDuration = 10;
let isHardMode = false;
let isRevisionMode = false;
let currentTimer = null;
let timeRemaining = 0;

// ========== SYSTÈME DE PROGRESSION ==========

class ProgressionSystem {
  constructor() {
    this.storageKey = 'verbsTrainingProgress';
    this.loadProgress();
  }

  loadProgress() {
    const data = localStorage.getItem(this.storageKey);
    this.data = data ? JSON.parse(data) : { sessions: [], verbStats: {} };
  }

  saveProgress() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  recordAttempt(verbBase, isCorrect) {
    if (!this.data.verbStats[verbBase]) {
      this.data.verbStats[verbBase] = { correct: 0, total: 0, lastAttempt: 0 };
    }
    this.data.verbStats[verbBase].total++;
    if (isCorrect) this.data.verbStats[verbBase].correct++;
    this.data.verbStats[verbBase].lastAttempt = Date.now();
    this.saveProgress();
  }

  recordSession(score, total, accuracy, groupsUsed, streakReached) {
    this.data.sessions.push({
      date: new Date().toISOString(),
      score, total, accuracy, groups: groupsUsed, streakReached
    });
    this.saveProgress();
  }

  getGlobalStats() {
    if (this.data.sessions.length === 0) return null;
    const totalSessions = this.data.sessions.length;
    const totalQuestions = this.data.sessions.reduce((sum, s) => sum + s.total, 0);
    const totalCorrect = this.data.sessions.reduce((sum, s) => sum + s.score, 0);
    const avgAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
    return { totalSessions, totalQuestions, totalCorrect, avgAccuracy };
  }

  getDifficultVerbs() {
    return Object.entries(this.data.verbStats)
      .filter(([verb, stats]) => stats.total >= 3 && (stats.correct / stats.total) * 100 < 60)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
      .map(([verb, stats]) => ({
        verb, correct: stats.correct, total: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        errors: stats.total - stats.correct
      }));
  }

  getSessionsByGroup(groups) {
    const groupNames = ["Groupe 1", "Groupe 2", "Groupe 3", "Groupe 4", "Groupe 5", "Groupe 6", 
                        "Groupe 7", "Groupe 8", "Groupe 9", "Groupe 10", "Groupe 11", "Groupe 12"];
    const sessionsByDate = {};
    this.data.sessions.forEach(session => {
      const date = session.date.split('T')[0];
      session.groups.forEach((used, groupIndex) => {
        if (used) {
          const groupName = groupNames[groupIndex] || `Groupe ${groupIndex + 1}`;
          if (!sessionsByDate[date]) sessionsByDate[date] = {};
          if (!sessionsByDate[date][groupName]) sessionsByDate[date][groupName] = [];
          sessionsByDate[date][groupName].push(session.accuracy);
        }
      });
    });
    return { sessionsByDate };
  }

  getGroupStats(groups) {
    const groupStats = {};
    groups.forEach((group, groupIndex) => {
      groupStats[groupIndex] = { correct: 0, total: 0, accuracy: 0 };
      group.forEach(verb => {
        const stats = this.data.verbStats[verb[0]];
        if (stats) {
          groupStats[groupIndex].total += stats.total;
          groupStats[groupIndex].correct += stats.correct;
        }
      });
      if (groupStats[groupIndex].total > 0) {
        groupStats[groupIndex].accuracy = Math.round(
          (groupStats[groupIndex].correct / groupStats[groupIndex].total) * 100
        );
      }
    });
    return groupStats;
  }

  clearAllData() {
    this.data = { sessions: [], verbStats: {} };
    this.saveProgress();
  }

  getRawData() {
    return this.data;
  }
}

const progressionSystem = new ProgressionSystem();

// ========== VARIABLES GLOBALES ==========
let verbsData = [];
let groups = [];
let groupCheckboxes = [];
let activeVerbs = [];
let currentVerb = null;
let currentExerciseType = 0;
let correctAnswer = "";
let correctAnswerPretrite = "";
let correctAnswerParticiple = "";
let score = 0;
let totalQuestions = 0;
let streak = 0;
let streakGoal = 25;
let selectedGroups = [];
let isCheckingAnswer = false;
let useDifficultMode = false;
let keyboardListenerAttached = false;
let globalKeyboardListener = null;

window.addEventListener('load', initDarkMode); // ajout pour mise en route dark

function attachGlobalKeyboardListener() {
  if (keyboardListenerAttached) return;
  globalKeyboardListener = function(event) {
    handleKeyboardEvent(event);
  };
  document.addEventListener('keydown', globalKeyboardListener);
  keyboardListenerAttached = true;
}

function detachGlobalKeyboardListener() {
  if (keyboardListenerAttached && globalKeyboardListener) {
    document.removeEventListener('keydown', globalKeyboardListener);
    keyboardListenerAttached = false;
    globalKeyboardListener = null;
  }
}

function handleKeyboardEvent(event) {
  const textInput = document.getElementById('text-answer');
  const checkBtn = document.getElementById('check-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (textInput && event.target === textInput && event.key === 'Enter' && checkBtn.style.display === 'block') {
    event.preventDefault();
    checkAnswer();
    return;
  }
  
  if (!textInput && checkBtn.style.display === 'block' && ['1','2','3','4'].includes(event.key)) {
    event.preventDefault();
    const index = parseInt(event.key) - 1;
    const options = document.querySelectorAll('.option');
    if (index < options.length) {
      const selectedOption = document.querySelector('.option.selected');
      if (selectedOption) selectedOption.classList.remove('selected');
      options[index].classList.add('selected');
    }
    return;
  }

  if (!textInput && event.key === 'Enter' && checkBtn.style.display === 'block') {
    event.preventDefault();
    checkAnswer();
    return;
  }
  
  if (event.key === 'Enter' && nextBtn.style.display === 'block') {
    event.preventDefault();
    nextQuestion();
    return;
  }
}

// ========== DOM ELEMENTS ==========
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
// const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');
const newSessionButton = document.getElementById('new-session-btn');
// const streakGoalInput = document.getElementById('streak-goal');
const finalStreakGoalElement = document.getElementById('final-streak-goal');
const finalScoreElement = document.getElementById('final-score');
const finalTotalElement = document.getElementById('final-total');
const finalAccuracyElement = document.getElementById('final-accuracy');
const groupsContainer = document.getElementById('verb-groups-container');
let streakGoalInput; // Sera créé dynamiquement
let startButton; // Sera créé dynamiquement

// ========== INTERFACE DES MODES ==========

const modeOptionsDiv = document.createElement('div');
modeOptionsDiv.style.cssText = 'padding:20px;border-radius:8px;margin:15px 0;';
modeOptionsDiv.classList.add('mode-options-container');

const modeTitle = document.createElement('h3');
modeTitle.textContent = '⚙️ Options d\'apprentissage';
modeTitle.style.cssText = 'margin-top:0;';
modeTitle.classList.add('mode-title');

// Mode chronométré
const timedModeDiv = document.createElement('div');
timedModeDiv.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;';

const timedCheckbox = document.createElement('input');
timedCheckbox.type = 'checkbox';
timedCheckbox.id = 'timed-mode-checkbox';
timedCheckbox.addEventListener('change', (e) => {
  isTimedMode = e.target.checked;
});

const timedLabel = document.createElement('label');
timedLabel.htmlFor = 'timed-mode-checkbox';
timedLabel.textContent = '⏱️ Mode chronométré : ';
timedLabel.style.cssText = 'cursor:pointer;font-weight:bold;';

const timedDurationInput = document.createElement('input');
timedDurationInput.type = 'number';
timedDurationInput.min = '5';
timedDurationInput.max = '60';
timedDurationInput.value = '10';
timedDurationInput.style.cssText = 'width:60px;padding:5px;border:1px solid #ccc;border-radius:3px;';
timedDurationInput.addEventListener('change', (e) => {
  timerDuration = parseInt(e.target.value) || 10;
});

const timedSec = document.createElement('span');
timedSec.textContent = ' secondes';

timedModeDiv.appendChild(timedCheckbox);
timedModeDiv.appendChild(timedLabel);
timedModeDiv.appendChild(timedDurationInput);
timedModeDiv.appendChild(timedSec);
modeOptionsDiv.appendChild(timedModeDiv);

// Mode difficile
const hardModeDiv = document.createElement('div');
hardModeDiv.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;align-items:center;';

const hardCheckbox = document.createElement('input');
hardCheckbox.type = 'checkbox';
hardCheckbox.id = 'hard-mode-checkbox';
hardCheckbox.addEventListener('change', (e) => {
  isHardMode = e.target.checked;
  revisionCheckbox.disabled = e.target.checked;
  if (e.target.checked) revisionCheckbox.checked = false;
});

const hardLabel = document.createElement('label');
hardLabel.htmlFor = 'hard-mode-checkbox';
hardLabel.textContent = '🔥 Mode difficile (pas d\'indice, distracteurs proches)';
hardLabel.style.cssText = 'cursor:pointer;font-weight:bold;';

hardModeDiv.appendChild(hardCheckbox);
hardModeDiv.appendChild(hardLabel);
modeOptionsDiv.appendChild(hardModeDiv);

// Mode révision
const revisionModeDiv = document.createElement('div');
revisionModeDiv.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;align-items:center;';

const revisionCheckbox = document.createElement('input');
revisionCheckbox.type = 'checkbox';
revisionCheckbox.id = 'revision-mode-checkbox';
revisionCheckbox.addEventListener('change', (e) => {
  isRevisionMode = e.target.checked;
  hardCheckbox.disabled = e.target.checked;
  if (e.target.checked) hardCheckbox.checked = false;
});

const revisionLabel = document.createElement('label');
revisionLabel.htmlFor = 'revision-mode-checkbox';
revisionLabel.textContent = '📝 Révision complète (3 formes à compléter)';
revisionLabel.style.cssText = 'cursor:pointer;font-weight:bold;';

revisionModeDiv.appendChild(revisionCheckbox);
revisionModeDiv.appendChild(revisionLabel);
modeOptionsDiv.appendChild(revisionModeDiv);

// ========== BOUTONS D'ACTIONS ==========

const selectAllBtn = document.createElement('button');
selectAllBtn.className = 'btn';
selectAllBtn.textContent = 'Tout sélectionner';
selectAllBtn.style.width = '31%';
selectAllBtn.style.marginRight = '2%';
selectAllBtn.addEventListener('click', () => {
  groupCheckboxes.forEach(cb => cb.checked = true);
});

const deselectAllBtn = document.createElement('button');
deselectAllBtn.className = 'btn';
deselectAllBtn.textContent = 'Tout déselectionner';
deselectAllBtn.style.width = '31%';
deselectAllBtn.style.marginRight = '2%';
deselectAllBtn.addEventListener('click', () => {
  groupCheckboxes.forEach(cb => cb.checked = false);
});

const exportBtn = document.createElement('button');
exportBtn.className = 'btn';
exportBtn.textContent = '💾 Statistiques';
exportBtn.style.width = '31%';
exportBtn.classList.add('stats-btn-export');
exportBtn.addEventListener('click', showExportModal);

const difficultModeBtn = document.createElement('button');
difficultModeBtn.className = 'btn';
difficultModeBtn.textContent = '⚠️ Verbes difficiles';
difficultModeBtn.style.width = '48%';
difficultModeBtn.style.marginRight = '4%';
difficultModeBtn.classList.add('stats-btn-difficult');
difficultModeBtn.style.display = 'block';
difficultModeBtn.addEventListener('click', startDifficultMode);

const resetDataBtn = document.createElement('button');
resetDataBtn.className = 'btn';
resetDataBtn.textContent = '🗑️ Réinitialiser données';
resetDataBtn.style.width = '48%';
resetDataBtn.classList.add('stats-btn-reset');
resetDataBtn.style.display = 'none';
resetDataBtn.addEventListener('click', () => {
  if (confirm('⚠️ Êtes-vous sûr? Cette action est irréversible.')) {
    progressionSystem.clearAllData();
    construireCasesGroupesDynamiques();
    updateResetButtonVisibility();
    alert('✅ Données supprimées.');
  }
});

const selectionControlsDiv = document.createElement('div');
selectionControlsDiv.style.marginTop = '10px';
selectionControlsDiv.style.display = 'flex';
selectionControlsDiv.style.gap = '2%';
selectionControlsDiv.style.flexWrap = 'wrap';
selectionControlsDiv.appendChild(selectAllBtn);
selectionControlsDiv.appendChild(deselectAllBtn);
selectionControlsDiv.appendChild(exportBtn);

const difficultModeControlsDiv = document.createElement('div');
difficultModeControlsDiv.style.marginTop = '10px';
difficultModeControlsDiv.style.display = 'flex';
difficultModeControlsDiv.style.gap = '4%';
difficultModeControlsDiv.appendChild(difficultModeBtn);
difficultModeControlsDiv.appendChild(resetDataBtn);

groupsContainer.parentNode.insertBefore(modeOptionsDiv, groupsContainer);
groupsContainer.parentNode.insertBefore(difficultModeControlsDiv, groupsContainer);
groupsContainer.parentNode.insertBefore(selectionControlsDiv, groupsContainer);

// ========== OBJECTIF ET BOUTON COMMENCER ==========

const objectiveDiv = document.createElement('div');
objectiveDiv.style.cssText = 'margin-top:20px;padding:15px;border-radius:4px;';
objectiveDiv.classList.add('objective-div');

const objectiveLabel = document.createElement('label');
objectiveLabel.textContent = '🎯 Objectif : ';
objectiveLabel.style.cssText = 'font-weight:bold;display:inline-block;margin-right:10px;';

streakGoalInput = document.createElement('input');
streakGoalInput.type = 'number';
streakGoalInput.value = '25';
streakGoalInput.min = '1';
streakGoalInput.max = '100';
streakGoalInput.style.cssText = 'width:80px;padding:5px;border:1px solid #999;border-radius:3px;';

const objectiveText = document.createElement('span');
objectiveText.textContent = ' réponses correctes consécutives';

objectiveDiv.appendChild(objectiveLabel);
objectiveDiv.appendChild(streakGoalInput);
objectiveDiv.appendChild(objectiveText);
selectionSection.appendChild(objectiveDiv);

// Bouton Commencer
startButton = document.createElement('button');
startButton.id = 'start-btn';
startButton.className = 'btn';
startButton.textContent = '🚀 Commencer';
startButton.style.cssText = 'width:100%;margin-top:20px;';
selectionSection.appendChild(startButton);


// ========== EXPORT MODAL ==========

function updateDifficultModeButtonVisibility() {
  const difficultVerbs = progressionSystem.getDifficultVerbs();
  if (difficultVerbs && difficultVerbs.length > 0) {
    difficultModeBtn.style.display = 'block';
  } else {
    difficultModeBtn.style.display = 'none';
  }
}


function showExportModal() {
  const rawData = progressionSystem.getRawData();
  
  if (rawData.sessions.length === 0 && Object.keys(rawData.verbStats).length === 0) {
    alert('Aucune donnée.');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;z-index:1000;';
  modal.classList.add('modal-overlay');
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = 'border-radius:10px;padding:30px;max-width:900px;max-height:85vh;overflow-y:auto;';
  modalContent.classList.add('modal-content');

  const title = document.createElement('h2');
  title.textContent = '📊 Résumé de progression';
  modalContent.appendChild(title);

  // Sessions
  const sessionsDiv = document.createElement('div');
  sessionsDiv.style.cssText = 'padding:20px;border-radius:8px;margin-bottom:20px;';
  sessionsDiv.classList.add('modal-sessions-div');

  const sessionsTitle = document.createElement('h3');
  sessionsTitle.textContent = '📅 Historique';
  sessionsDiv.appendChild(sessionsTitle);

  const { sessionsByDate } = progressionSystem.getSessionsByGroup(groups);
  Object.keys(sessionsByDate).sort().forEach(date => {
    const dateHeader = document.createElement('strong');
    dateHeader.textContent = `📆 ${date}`;
    dateHeader.style.cssText = 'display:block;margin:10px 0 5px 0;';
    sessionsDiv.appendChild(dateHeader);

    const dateContent = sessionsByDate[date];
    Object.keys(dateContent).forEach(groupName => {
      const count = dateContent[groupName].length;
      const avg = Math.round(dateContent[groupName].reduce((a,b) => a+b,0) / count);
      const line = document.createElement('div');
      line.style.cssText = 'margin-left:20px;padding:5px;';
      line.textContent = `${groupName}: ${count}x (${avg}%)`;
      sessionsDiv.appendChild(line);
    });
  });
  modalContent.appendChild(sessionsDiv);

  // Verbes difficiles
  const difficultVerbs = progressionSystem.getDifficultVerbs();
  if (difficultVerbs && difficultVerbs.length > 0) {
    const verbsDiv = document.createElement('div');
    verbsDiv.style.cssText = 'padding:20px;border-radius:8px;margin-bottom:20px;';
    verbsDiv.classList.add('modal-difficult-verbs-div');

    const verbsTitle = document.createElement('h3');
    verbsTitle.textContent = '⚠️ Verbes à réviser';
    verbsDiv.appendChild(verbsTitle);

    difficultVerbs.forEach(({verb, correct, total, accuracy}) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:5px;';
      item.textContent = `${verb}: ${correct}/${total} (${accuracy}%)`;
      verbsDiv.appendChild(item);
    });
    modalContent.appendChild(verbsDiv);
  }

  // Stats globales
  const globalStats = progressionSystem.getGlobalStats();
  if (globalStats) {
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = 'padding:20px;border-radius:8px;';
    statsDiv.classList.add('modal-global-stats-div');
	
    const statsTitle = document.createElement('h3');
    statsTitle.textContent = '📈 Global';
    statsDiv.appendChild(statsTitle);
    const statsContent = document.createElement('div');
    statsContent.innerHTML = `Sessions: ${globalStats.totalSessions} | Questions: ${globalStats.totalQuestions} | Correctes: ${globalStats.totalCorrect} | Précision: ${globalStats.avgAccuracy}%`;
    statsDiv.appendChild(statsContent);
    modalContent.appendChild(statsDiv);
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fermer';
  closeBtn.style.cssText = 'margin-top:20px;padding:10px 20px;color:white;border:none;border-radius:5px;cursor:pointer;';
  closeBtn.classList.add('modal-close-btn');

  closeBtn.addEventListener('click', () => document.body.removeChild(modal));
  modalContent.appendChild(closeBtn);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// ========== INIT ==========

function updateResetButtonVisibility() {
  const rawData = progressionSystem.getRawData();
  resetDataBtn.style.display = (rawData.sessions.length > 0 || Object.keys(rawData.verbStats).length > 0) ? 'block' : 'none';
}

fetch('verbes.json')
  .then(response => response.json())
  .then(data => {
    verbsData = data;
    const maxGroup = Math.max(...verbsData.map(v => v.group || 1));
    groups = Array.from({length: maxGroup}, () => []);
    verbsData.forEach(v => {
      const groupIndex = (v.group || 1) - 1;
      if (groupIndex >= 0 && groupIndex < groups.length) {
        groups[groupIndex].push([v.base, v.preterite, v.participle, v.fr]);
      }
    });
    construireCasesGroupesDynamiques();
	updateDifficultModeButtonVisibility();  // <-- AJOUTEZ CETTE LIGNE
    updateResetButtonVisibility();
  });

function construireCasesGroupesDynamiques() {
  const container = groupsContainer;
  container.innerHTML = '';
  groupCheckboxes = [];
  
  const groupNames = ["Groupe 1 (courir, rêver, saigner...)", "Groupe 2 (jeter, raconter...)", 
                      "Groupe 3 (être, voler, dire...)", "Groupe 4 (fermer, aller, gagner...)",
                      "Groupe 5 (pleurer, s'asseoir, envoyer...)", "Groupe 6 (mettre, casser, avoir...)",
                      "Groupe 7 (épeler, dormir...)", "Groupe 8 (retirer, devenir, tirer...)",
                      "Groupe 9 (lire, pousser, voir...)", "Groupe 10 (tenir, éclater, nourrir...)",
                      "Groupe 11 (faire, perdre, chanter...)", "Groupe 12 (tomber, sentir, nager...)"];
  
  const groupStats = progressionSystem.getGroupStats(groups);
  
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length === 0) continue;
    
    const div = document.createElement('div');
    div.className = 'verb-group';
    
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = false;
    groupCheckboxes.push(cb);
    
    label.appendChild(cb);
    const stats = groupStats[i];
    const percent = stats.total > 0 ? stats.accuracy : 0;
    const bar = '▓'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));
    
    label.appendChild(document.createTextNode(` ${groupNames[i]} - ${groups[i].length} verbes [${bar}] ${percent}%`));
    div.appendChild(label);
    container.appendChild(div);
  }
}

function startDifficultMode() {
  useDifficultMode = true;
  const difficultVerbs = progressionSystem.getDifficultVerbs();
  
  console.log('🔴 DIFFICULT MODE STARTED');
  console.log('Difficult verbs found:', difficultVerbs.length);
  console.log('Difficult verbs:', difficultVerbs);
  
  if (!difficultVerbs || difficultVerbs.length === 0) {
    alert("Aucun verbe difficile identifié.");
    return;
  }

  activeVerbs = difficultVerbs.map(dv => {
    const fullVerb = verbsData.find(v => v.base === dv.verb);
    return [fullVerb.base, fullVerb.preterite, fullVerb.participle, fullVerb.fr];
  });

  console.log('Active verbs count:', activeVerbs.length);
  console.log('Active verbs:', activeVerbs);

  startExercise();
}

startButton.addEventListener('click', function() {
  if (useDifficultMode) {
    useDifficultMode = false;
    return;
  }

  if (!groupCheckboxes.some(cb => cb.checked)) {
    alert("Sélectionnez au moins un groupe.");
    return;
  }
  
  streakGoal = parseInt(streakGoalInput.value) || 25;
  selectedGroups = groupCheckboxes.map(cb => cb.checked);
  
  activeVerbs = [];
  for (let i = 0; i < groupCheckboxes.length; i++) {
    if (groupCheckboxes[i].checked) {
      activeVerbs = activeVerbs.concat(groups[i]);
    }
  }
  
  if (activeVerbs.length === 0) {
    alert("Aucun verbe sélectionné.");
    return;
  }
  
  startExercise();
});

function showHelpModal() {
  // Crée le fond semi-transparent
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';

  // Crée le contenu de la fenêtre
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content help-modal-content';

  modalContent.innerHTML = `
    <h2>💡 Aide et Fonctionnalités</h2>
    
    <h3>Modes d'Apprentissage</h3>
    <p><strong>⏱️ Mode Chronométré :</strong> Chaque question a un temps limité pour y répondre. Pression et rapidité !</p>
    <p><strong>🔥 Mode Difficile :</strong> Pas d'indice de traduction et les choix de réponse sont plus proches de la bonne réponse pour un défi supplémentaire.</p>
    <p><strong>📝 Révision Complète :</strong> Au lieu d'un QCM, vous devez écrire les 3 formes du verbe (base, prétérit, participe passé).</p>

    <h3>Raccourcis Clavier</h3>
    <p><strong>Touches 1, 2, 3, 4 :</strong> Sélectionnez directement une des quatre options de réponse.</p>
    <p><strong>Touche Entrée :</strong> Validez votre réponse (équivalent au bouton "Vérifier") ou passez à la question suivante.</p>

    <h3>Fonctionnalités Spéciales</h3>
    <p><strong>⚠️ Verbes difficiles :</strong> Ce bouton apparaît quand l'application détecte que vous faites régulièrement des erreurs sur certains verbes. Cliquez dessus pour lancer une session ciblée sur vos points faibles !</p>
    <p><strong>Aa (Slider) :</strong> Utilisez le curseur en bas pour ajuster la taille de la police à votre convenance.</p>
    
    <button id="close-help-btn" class="btn">Fermer</button>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Ajoute l'événement pour fermer la fenêtre
  document.getElementById('close-help-btn').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
         document.body.removeChild(modalOverlay);
    }
  });
}

function startExercise() {
  selectionSection.style.display = 'none';
  exerciseSection.style.display = 'block';
  streakTargetElement.textContent = streakGoal;
  score = 0;
  totalQuestions = 0;
  streak = 0;
  isCheckingAnswer = false;
  updateScore();
  attachGlobalKeyboardListener();
  createNewExercise();
}

function updateScore() {
  scoreElement.textContent = score;
  totalElement.textContent = totalQuestions;
  streakElement.textContent = streak;
}

function cleanTranslateTags(text) {
  return text.replace(/\[translate:(.*?)\]/g, '$1');
}

// ========== TIMER FUNCTIONS ==========

function stopTimer() {
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
}

function startTimer() {
  if (!isTimedMode) return;
  
  timeRemaining = timerDuration;
  const timerDisplay = document.getElementById('timer-display');
  
  stopTimer();
  
  currentTimer = setInterval(() => {
    timeRemaining--;
    if (timerDisplay) {
      timerDisplay.textContent = timeRemaining + 's';
      if (timeRemaining <= 4) {
        timerDisplay.classList.add('urgent');
	  } else {
		 timerDisplay.classList.remove('urgent'); 
      }
    }
    
    if (timeRemaining <= 0) {
      stopTimer();
      timeoutAnswer();
    }
  }, 1000);
}

function timeoutAnswer() {
  progressionSystem.recordAttempt(currentVerb[0], false);
  totalQuestions++;
  streak = 0;
  
  const fb = document.createElement('div');
  fb.className = 'feedback incorrect';
  fb.textContent = '⏰ Temps écoulé! Réponse: ' + correctAnswer;
  feedbackContainer.appendChild(fb);
  
  updateScore();
  checkButton.style.display = 'none';
  nextButton.style.display = 'block';
  isCheckingAnswer = true;
  
  const inputs = document.querySelectorAll('input[type="text"]');
  inputs.forEach(inp => inp.disabled = true);
}

// ========== DISTRACTEURS INTELLIGENTS ==========

function getSimilarOptions(correctOption, allVerbs, count = 3) {
  console.log('getSimilarOptions called');
  console.log('correctOption:', correctOption);
  console.log('allVerbs count:', allVerbs.length);
	
  const similar = [];
  const correctLength = correctOption.length;
  
  for (let verb of allVerbs) {
    if (verb[0] === currentVerb[0]) continue;
    const form1 = verb[1];
    const form2 = verb[2];
    
    if (Math.abs(form1.length - correctLength) <= 2 || Math.abs(form2.length - correctLength) <= 2) {
      similar.push(form1);
      similar.push(form2);
    }
  }
  
  const result = [...new Set(similar)].filter(v => v !== correctOption).slice(0, count);
  console.log('getSimilarOptions result:', result);
  return result;
}

const fontSizeSlider = document.getElementById('font-size-slider');
fontSizeSlider.addEventListener('input', function() {
  document.body.style.fontSize = this.value+'px';
});
document.body.style.fontSize = fontSizeSlider.value + 'px';


// ========== EXERCICES ==========

function createNewExercise() {
  stopTimer();
  
  answerContainer.innerHTML = '';
  feedbackContainer.innerHTML = '';
  
  checkButton.style.display = 'block';
  nextButton.style.display = 'none';
  isCheckingAnswer = false;
  
  // ✅ NETTOYER L'ANCIEN TIMER
  const oldTimer = document.getElementById('timer-display');
  if (oldTimer) oldTimer.remove(); // On garde ça pour l'instant, c'est plus simple

  stopTimer(); 
  
  currentVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
  
  if (isRevisionMode) {
    createRevisionExercise();
    if (isTimedMode) {
      createTimerDisplay();
      startTimer();
    }
    return;
  }
  
  const rand = Math.random() * 100;
  if (rand < 20) currentExerciseType = 0;
  else if (rand < 50) currentExerciseType = 1;
  else if (rand < 75) currentExerciseType = 2;
  else currentExerciseType = 3;
  
  switch (currentExerciseType) {
    case 0: createFormExercise(); break;
    case 1: createFormInputExercise(); break;
    case 2: createEnglishToFrenchExercise(); break;
    case 3: createFrenchToEnglishExercise(); break;
  }
  
  if (isTimedMode) {
    createTimerDisplay();
    startTimer();
  }
}

function createTimerDisplay() {
  const controlsContainer = document.getElementById('top-right-controls');
  if (!controlsContainer) return; // Sécurité

  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'timer-display';
  timerDisplay.classList.add('timer-display');
  timerDisplay.textContent = timerDuration + 's';
    
  // Ajoute le timer au début du conteneur
  controlsContainer.prepend(timerDisplay);
}



function createRevisionExercise() {
  const verbText = cleanTranslateTags(currentVerb[0]);
  correctAnswerPretrite = currentVerb[1];
  correctAnswerParticiple = currentVerb[2];
  
  questionElement.textContent = `Complétez les 3 formes du verbe "${verbText}" (${currentVerb[3]})`;
  
  const container = answerContainer;
  container.style.display = 'grid';
  container.style.gridTemplateColumns = '1fr 1fr 1fr';
  container.style.gap = '15px';
  
  const baseDiv = document.createElement('div');
  const baseLabel = document.createElement('label');
  baseLabel.textContent = 'Base';
  baseLabel.style.cssText = 'display:block;font-weight:bold;margin-bottom:5px;';
  const baseInput = document.createElement('input');
  baseInput.type = 'text';
  baseInput.value = verbText;
  baseInput.disabled = true;
  baseInput.style.cssText = 'width:100%;padding:8px;';
  baseInput.classList.add('base-input-disabled');

  baseDiv.appendChild(baseLabel);
  baseDiv.appendChild(baseInput);
  container.appendChild(baseDiv);
  
  const pretDiv = document.createElement('div');
  const pretLabel = document.createElement('label');
  pretLabel.textContent = 'Prétérit';
  pretLabel.style.cssText = 'display:block;font-weight:bold;margin-bottom:5px;';
  const pretInput = document.createElement('input');
  pretInput.type = 'text';
  pretInput.id = 'pret-input';
  pretInput.placeholder = 'ex: ' + correctAnswerPretrite;
  pretInput.style.cssText = 'width:100%;padding:8px;';
  pretDiv.appendChild(pretLabel);
  pretDiv.appendChild(pretInput);
  container.appendChild(pretDiv);
  
  const partDiv = document.createElement('div');
  const partLabel = document.createElement('label');
  partLabel.textContent = 'Participe Passé';
  partLabel.style.cssText = 'display:block;font-weight:bold;margin-bottom:5px;';
  const partInput = document.createElement('input');
  partInput.type = 'text';
  partInput.id = 'part-input';
  partInput.placeholder = 'ex: ' + correctAnswerParticiple;
  partInput.style.cssText = 'width:100%;padding:8px;';
  partDiv.appendChild(partLabel);
  partDiv.appendChild(partInput);
  container.appendChild(partDiv);
  
  setTimeout(() => document.getElementById('pret-input').focus(), 100);
}

function createFormExercise() {

  console.log('🟢 createFormExercise called');
  console.log('useDifficultMode:', useDifficultMode);
  console.log('isHardMode:', isHardMode);
  console.log('currentVerb:', currentVerb);

  const askForPast = Math.random() > 0.5;
  const formIndex = askForPast ? 1 : 2;
  correctAnswer = currentVerb[formIndex];
  
  const verbText = cleanTranslateTags(currentVerb[0]);
  const question = isHardMode 
    ? `Quel est le ${askForPast ? 'prétérit' : 'participe passé'} du verbe "${verbText}"?`
    : `Quel est le ${askForPast ? 'prétérit' : 'participe passé'} du verbe "${verbText}" (${currentVerb[3]})?`;
  
  questionElement.textContent = question;
  
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'options';
  
  let options = [correctAnswer];
  console.log('Initial options:', options);
  
  // ✅ EN MODE DIFFICILE: ajouter l'AUTRE FORME du même verbe
  if (useDifficultMode) {
    const otherFormIndex = formIndex === 1 ? 2 : 1;
    const otherForm = currentVerb[otherFormIndex];
    if (!options.includes(otherForm)) {
      options.push(otherForm);
    }
  }
  console.log('Options after difficultMode:', options);
  
  // ✅ Remplir les 4 options CORRECTEMENT
  if (isHardMode) {
    const similar = getSimilarOptions(correctAnswer, activeVerbs, 3);
	console.log('isHardMode -> similar options from getSimilarOptions:', similar);
    options = options.concat(similar).slice(0, 4);  // ← AVEC .slice(0, 4) ICI!!!
	console.log('Final options after slice:', options);
  } else {
	let loopCount = 0;  // <-- DÉFINI ici!  
    while (options.length < 4) {
	  loopCount++;
      if (loopCount > 100) {
        console.error('⚠️ BOUCLE INFINIE DÉTECTÉE DANS createFormExercise!');
        console.error('activeVerbs:', activeVerbs);
        console.error('currentVerb:', currentVerb);
        break;
      }
      const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
      if (randomVerb !== currentVerb) {
        const wrongOption = randomVerb[formIndex];
        if (!options.includes(wrongOption)) options.push(wrongOption);
		console.log(`Added option: ${wrongOption}, now ${options.length}/4`);
      }
    }
  }
  
  console.log('Final options to display:', options);
  console.log('='.repeat(50));
  
  options.sort(() => Math.random() - 0.5);
  
  options.forEach((option, index) => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = option;
    btn.addEventListener('click', function() {
      const selected = document.querySelector('.option.selected');
      if (selected) selected.classList.remove('selected');
      this.classList.add('selected');
    });
    optionsDiv.appendChild(btn);
  });
  
  answerContainer.appendChild(optionsDiv);
}

function createFormInputExercise() {
  const askForPast = Math.random() > 0.5;
  const formIndex = askForPast ? 1 : 2;
  correctAnswer = currentVerb[formIndex];
  
  const verbText = cleanTranslateTags(currentVerb[0]);
  const question = isHardMode
    ? `Écrivez le ${askForPast ? 'prétérit' : 'participe passé'} du verbe "${verbText}":`
    : `Écrivez le ${askForPast ? 'prétérit' : 'participe passé'} du verbe "${verbText}" (${currentVerb[3]}):`;
  
  questionElement.textContent = question;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input-answer';
  input.placeholder = 'Votre réponse...';
  input.id = 'text-answer';
  input.autocomplete = 'off';
  
  answerContainer.appendChild(input);
  setTimeout(() => input.focus(), 100);
}

function createEnglishToFrenchExercise() {
  correctAnswer = currentVerb[3];
  const verbText = cleanTranslateTags(currentVerb[0]);
  
  questionElement.textContent = `Comment se dit "${verbText}" en français?`;
  
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'options';
  
  let options = [correctAnswer];
  let loopCount = 0;  // <-- DÉFINI ici!
  while (options.length < 4) {
    const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
    if (randomVerb !== currentVerb && !options.includes(randomVerb[3])) {
      options.push(randomVerb[3]);
    }
  }
  
  options.sort(() => Math.random() - 0.5);
  
  options.forEach((option, index) => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = option;
    btn.addEventListener('click', function() {
      const selected = document.querySelector('.option.selected');
      if (selected) selected.classList.remove('selected');
      this.classList.add('selected');
    });
    optionsDiv.appendChild(btn);
  });
  
  answerContainer.appendChild(optionsDiv);
}

function createFrenchToEnglishExercise() {
  correctAnswer = currentVerb[0];
  
  questionElement.textContent = `Comment se dit "${currentVerb[3]}" en anglais?`;
  
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'options';
  
  let options = [correctAnswer];
  let loopCount = 0;
  while (options.length < 4) {
    const randomVerb = activeVerbs[Math.floor(Math.random() * activeVerbs.length)];
    if (randomVerb !== currentVerb && !options.includes(randomVerb[0])) {
      options.push(randomVerb[0]);
    }
  }
  
  options.sort(() => Math.random() - 0.5);
  
  options.forEach((option, index) => {
    const btn = document.createElement('div');
    btn.className = 'option';
    btn.textContent = option;
    btn.addEventListener('click', function() {
      const selected = document.querySelector('.option.selected');
      if (selected) selected.classList.remove('selected');
      this.classList.add('selected');
    });
    optionsDiv.appendChild(btn);
  });
  
  answerContainer.appendChild(optionsDiv);
}

function checkAnswer() {
  stopTimer();
  
  let isCorrect = false;
  
  if (isRevisionMode) {
    const pretInput = document.getElementById('pret-input');
    const partInput = document.getElementById('part-input');
    
    const pretAnswer = pretInput.value.trim().toLowerCase();
    const partAnswer = partInput.value.trim().toLowerCase();
    
    const pretExpected = correctAnswerPretrite.toLowerCase();
    const partExpected = correctAnswerParticiple.toLowerCase();
    
    const pretCorrect = pretAnswer === pretExpected;
    const partCorrect = partAnswer === partExpected;
    isCorrect = pretCorrect && partCorrect;
    
    pretInput.disabled = true;
    partInput.disabled = true;
    
    if (pretCorrect) pretInput.classList.add('input-correct'); else pretInput.classList.add('input-incorrect');
    if (partCorrect) partInput.classList.add('input-correct'); else partInput.classList.add('input-incorrect');
    
    progressionSystem.recordAttempt(currentVerb[0], isCorrect);
    totalQuestions++;
    
    if (isCorrect) {
      score++;
      streak++;
      const fb = document.createElement('div');
      fb.className = 'feedback correct';
      fb.textContent = '✅ Correct!';
      feedbackContainer.appendChild(fb);
    } else {
      streak = 0;
      const fb = document.createElement('div');
      fb.className = 'feedback incorrect';
      fb.innerHTML = `❌ Incorrect!<br>Prétérit: ${correctAnswerPretrite}<br>Participe: ${correctAnswerParticiple}`;
      feedbackContainer.appendChild(fb);
    }
    
    updateScore();
    checkButton.style.display = 'none';
    nextButton.style.display = 'block';
    isCheckingAnswer = true;
    
    if (streak >= streakGoal) {
      showCompletionScreen();
    }
    return;
  }
  
  if (currentExerciseType === 1) {
    const textInput = document.getElementById('text-answer');
    if (textInput) {
      const userAnswer = textInput.value.trim().toLowerCase();
      const possibleAnswers = correctAnswer.split('/').map(a => a.trim().toLowerCase());
      isCorrect = possibleAnswers.includes(userAnswer);
      
      textInput.disabled = true;
	  if (isCorrect) textInput.classList.add('input-correct'); else textInput.classList.add('input-incorrect');
    }
  } else {
    const selected = document.querySelector('.option.selected');
    if (!selected) {
      alert("Sélectionnez une réponse");
      return;
    }
    
    isCorrect = selected.textContent === correctAnswer;
    
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
      if (opt.textContent === correctAnswer) opt.classList.add('correct');
      else if (opt === selected && !isCorrect) opt.classList.add('incorrect');
    });
  }
  
  progressionSystem.recordAttempt(currentVerb[0], isCorrect);
  totalQuestions++;
  
  if (isCorrect) {
    score++;
    streak++;
    
    const fb = document.createElement('div');
    fb.className = 'feedback correct';
    fb.textContent = '✅ Correct!';
    feedbackContainer.appendChild(fb);
    
    const vf = document.createElement('div');
    vf.className = 'verb-forms';
    vf.style.marginTop = '15px';
    vf.style.padding = '10px';
    vf.classList.add('verb-forms-correct');
    vf.style.borderRadius = '5px';
    vf.innerHTML = `Formes: ${currentVerb[0]} → ${currentVerb[1]} → ${currentVerb[2]}`;
	vf.classList.add('verb-forms-feedback');
    feedbackContainer.appendChild(vf);
    
    if (streak >= streakGoal) {
      showCompletionScreen();
      return;
    }
  } else {
    streak = 0;
    
    const fb = document.createElement('div');
    fb.className = 'feedback incorrect';
    fb.textContent = `❌ Incorrect. Réponse: ${correctAnswer}`;
    feedbackContainer.appendChild(fb);
    
    const vf = document.createElement('div');
    vf.className = 'verb-forms';
    vf.style.marginTop = '15px';
    vf.style.padding = '10px';
    vf.classList.add('verb-forms-incorrect');
    vf.style.borderRadius = '5px';
    vf.innerHTML = `Formes: ${currentVerb[0]} → ${currentVerb[1]} → ${currentVerb[2]}`;
	vf.classList.add('verb-forms-feedback');
    feedbackContainer.appendChild(vf);
  }
  
  updateScore();
  checkButton.style.display = 'none';
  nextButton.style.display = 'block';
  isCheckingAnswer = true;
}

function showCompletionScreen() {
  stopTimer();
  const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  
  progressionSystem.recordSession(score, totalQuestions, accuracy, selectedGroups, streakGoal);
  updateResetButtonVisibility();
  
  finalStreakGoalElement.textContent = streakGoal;
  finalScoreElement.textContent = score;
  finalTotalElement.textContent = totalQuestions;
  finalAccuracyElement.textContent = accuracy;
  
  exerciseSection.style.display = 'none';
  completionSection.style.display = 'block';
}

function restart() {
  score = 0;
  totalQuestions = 0;
  streak = 0;
  isCheckingAnswer = false;
  completionSection.style.display = 'none';
  exerciseSection.style.display = 'block';
  updateScore();
  createNewExercise();
}

function newSession() {
  detachGlobalKeyboardListener();
  completionSection.style.display = 'none';
  selectionSection.style.display = 'block';
  useDifficultMode = false;
  updateDifficultModeButtonVisibility();  // <-- AJOUTEZ CETTE LIGNE
  isTimedMode = false;
  isHardMode = false;
  isRevisionMode = false;
  timedCheckbox.checked = false;
  hardCheckbox.checked = false;
  revisionCheckbox.checked = false;
  hardCheckbox.disabled = false;
  revisionCheckbox.disabled = false;
}

function nextQuestion() {
    const controlsContainer = document.getElementById('top-right-controls');
    if (controlsContainer) {
        const timer = document.getElementById('timer-display');
        if (timer) timer.remove();
    }
    createNewExercise();
}


checkButton.addEventListener('click', checkAnswer);
nextButton.addEventListener('click', nextQuestion);
restartButton.addEventListener('click', restart);
newSessionButton.addEventListener('click', newSession);