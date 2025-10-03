document.addEventListener('DOMContentLoaded', () => {
    const state = {
        questions: [],
        incorrectQuestions: [],
        currentQuizQuestions: [],
        currentQuestionIndex: 0,
        score: 0,
        quizMode: 'practice',
        timer: null,
        timeElapsed: 0,
        allQuestionsLoaded: false,
    };

    const views = {
        upload: document.getElementById('upload-view'),
        settings: document.getElementById('settings-view'),
        quiz: document.getElementById('quiz-view'),
        results: document.getElementById('results-view'),
        appContainer: document.getElementById('app-container'),
    };

    const elements = {
        fileInput: document.getElementById('file-input'),
        loadFileBtn: document.getElementById('load-file-btn'),
        uploadError: document.getElementById('upload-error'),
        numQuestions: document.getElementById('num-questions'),
        quizModeSelect: document.getElementById('quiz-mode'),
        startQuizBtn: document.getElementById('start-quiz-btn'),
        quizModeDisplay: document.getElementById('quiz-mode-display'),
        currentQNum: document.getElementById('current-q-num'),
        totalQNum: document.getElementById('total-q-num'),
        progressBar: document.getElementById('progress-bar'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        nextQBtn: document.getElementById('next-q-btn'),
        quitQuizBtn: document.getElementById('quit-quiz-btn'),
        timer: document.getElementById('timer'),
        finalScore: document.getElementById('final-score'),
        correctAnswers: document.getElementById('correct-answers'),
        incorrectAnswers: document.getElementById('incorrect-answers'),
        timeTaken: document.getElementById('time-taken'),
        backToSettingsBtn: document.getElementById('back-to-settings-btn'),
        incorrectCount: document.getElementById('incorrect-count'),
        reviewInfo: document.getElementById('review-info'),
        resetIncorrectBtn: document.getElementById('reset-incorrect-btn'),
        questionContainer: document.getElementById('question-container'),
    };
    
    function loadQuestionsFromFile(file) {
        if (!file) {
            elements.uploadError.textContent = 'Please select a file.';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error("Invalid JSON format or empty file.");
                }
                state.questions = data;
                state.allQuestionsLoaded = true;
                loadIncorrectFromStorage();
                updateSettingsUI();
                switchView('settings');
            } catch (error) {
                console.error("Could not parse JSON file:", error);
                elements.uploadError.textContent = `Error: ${error.message}. Please check the file content.`;
            }
        };
        reader.onerror = function() {
            elements.uploadError.textContent = 'Failed to read the file.';
        };
        reader.readAsText(file);
    }

    function loadIncorrectFromStorage() {
        const stored = localStorage.getItem('incorrectQuestions');
        state.incorrectQuestions = stored ? JSON.parse(stored) : [];
    }

    function saveIncorrectToStorage() {
        localStorage.setItem('incorrectQuestions', JSON.stringify(state.incorrectQuestions));
    }
    
    function resetIncorrectHistory() {
        if (window.confirm("Are you sure you want to reset your incorrect answers history? This action cannot be undone.")) {
            state.incorrectQuestions = [];
            saveIncorrectToStorage();
            updateSettingsUI();
        }
    }

    function switchView(viewName) {
        Object.values(views).forEach(view => {
            if (view) { 
                view.classList.add('hidden');
            }
        });
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }
        if (viewName === 'settings') {
            updateSettingsUI();
        }
    }

    function updateSettingsUI() {
        if (!state.allQuestionsLoaded) return;
        elements.numQuestions.max = state.questions.length;
        elements.numQuestions.value = Math.min(parseInt(elements.numQuestions.value), state.questions.length);
        elements.incorrectCount.textContent = state.incorrectQuestions.length;
        elements.reviewInfo.classList.remove('hidden');
        
        const reviewModeOption = elements.quizModeSelect.querySelector('option[value="review"]');
        reviewModeOption.disabled = state.incorrectQuestions.length === 0;
        reviewModeOption.textContent = `Review Incorrect (${state.incorrectQuestions.length})`;
        
        if (elements.quizModeSelect.value === 'review' && state.incorrectQuestions.length === 0) {
            elements.startQuizBtn.disabled = true;
        } else {
            elements.startQuizBtn.disabled = false;
        }
    }

    function startQuiz() {
        state.quizMode = elements.quizModeSelect.value;
        const numQuestions = parseInt(elements.numQuestions.value);
        state.score = 0;
        state.currentQuestionIndex = 0;
        state.timeElapsed = 0;

        switch (state.quizMode) {
            case 'review':
                state.currentQuizQuestions = getIncorrectQuestions();
                break;
            case 'timed':
            case 'practice':
            default:
                state.currentQuizQuestions = getRandomQuestions(numQuestions);
                break;
        }

        if (state.currentQuizQuestions.length === 0) {
            alert("No questions available for this mode.");
            return;
        }

        setupQuizUI();
        renderQuestion();
        if (state.quizMode === 'timed') startTimer();
        switchView('quiz');
    }
    
    function setupQuizUI() {
         elements.totalQNum.textContent = state.currentQuizQuestions.length;
         elements.timer.style.display = state.quizMode === 'timed' ? 'block' : 'none';
         let modeText = state.quizMode.charAt(0).toUpperCase() + state.quizMode.slice(1) + " Mode";
         elements.quizModeDisplay.textContent = modeText;
    }

    function getRandomQuestions(num) {
        const shuffled = [...state.questions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    }

    function getIncorrectQuestions() {
        const incorrectNumbers = new Set(state.incorrectQuestions);
        return state.questions.filter(q => incorrectNumbers.has(q.Number));
    }

    function renderQuestion() {
        elements.questionContainer.classList.remove('slide-in');
        elements.questionContainer.classList.add('slide-out');
        
        setTimeout(() => {
            const question = state.currentQuizQuestions[state.currentQuestionIndex];
            if (!question) {
                endQuiz();
                return;
            }
            elements.questionText.textContent = question.Question;
            elements.optionsContainer.innerHTML = '';
            
            const shuffledOptions = [...question.Options].sort(() => Math.random() - 0.5);

            shuffledOptions.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('option-btn', 'w-full', 'p-4', 'text-left', 'border-2', 'rounded-lg', 'bg-gray-100', 'dark:bg-gray-700', 'border-gray-300', 'dark:border-gray-600', 'hover:bg-indigo-100', 'dark:hover:bg-gray-600', 'hover:border-indigo-400');
                button.onclick = () => selectAnswer(option, button);
                elements.optionsContainer.appendChild(button);
            });

            updateProgress();
            elements.nextQBtn.disabled = true;
            elements.questionContainer.classList.remove('slide-out');
            elements.questionContainer.classList.add('slide-in');
        }, 500);
    }

    function selectAnswer(selectedOption, button) {
        const question = state.currentQuizQuestions[state.currentQuestionIndex];
        const isCorrect = selectedOption === question.Answer;

        if (isCorrect) {
            state.score++;
            button.classList.add('correct');
            const index = state.incorrectQuestions.indexOf(question.Number);
            if (index > -1) {
                state.incorrectQuestions.splice(index, 1);
            }
        } else {
            button.classList.add('incorrect');
            if (!state.incorrectQuestions.includes(question.Number)) {
                state.incorrectQuestions.push(question.Number);
            }
        }
        saveIncorrectToStorage();
        
        Array.from(elements.optionsContainer.children).forEach(btn => {
            if (btn.textContent === question.Answer) {
                btn.classList.add('correct');
            }
            btn.classList.add('disabled');
        });

        elements.nextQBtn.disabled = false;
        elements.nextQBtn.focus();
    }
    
    function nextQuestion() {
        state.currentQuestionIndex++;
        if (state.currentQuestionIndex < state.currentQuizQuestions.length) {
            renderQuestion();
        } else {
            endQuiz();
        }
    }

    function updateProgress() {
        elements.currentQNum.textContent = state.currentQuestionIndex + 1;
        const progressPercentage = ((state.currentQuestionIndex + 1) / state.currentQuizQuestions.length) * 100;
        elements.progressBar.style.width = `${progressPercentage}%`;
    }

    function endQuiz() {
        clearInterval(state.timer);
        showResults();
        switchView('results');
    }

    function showResults() {
        const totalQuestions = state.currentQuizQuestions.length;
        const percentage = totalQuestions > 0 ? Math.round((state.score / totalQuestions) * 100) : 0;
        elements.finalScore.textContent = `${percentage}%`;
        elements.correctAnswers.textContent = state.score;
        elements.incorrectAnswers.textContent = totalQuestions - state.score;
        
        if (state.quizMode === 'timed') {
            const minutes = Math.floor(state.timeElapsed / 60);
            const seconds = state.timeElapsed % 60;
            elements.timeTaken.textContent = `Time taken: ${minutes}m ${seconds}s`;
            elements.timeTaken.style.display = 'block';
        } else {
            elements.timeTaken.style.display = 'none';
        }
    }
    
    function quitQuiz() {
        if (window.confirm("Are you sure you want to quit? Your progress will be lost.")) {
            clearInterval(state.timer);
            switchView('settings');
        }
    }

    function startTimer() {
        state.timeElapsed = 0;
        updateTimerDisplay();
        state.timer = setInterval(() => {
            state.timeElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(state.timeElapsed / 60);
        const seconds = state.timeElapsed % 60;
        elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function initialize() {
        const allElementsExist = Object.values(elements).every(el => el !== null);

        if (!allElementsExist) {
            console.error("One or more HTML elements are missing. Check your HTML file for correct IDs.");
            document.body.innerHTML = '<p class="text-red-500 text-center p-8">Critical Error: HTML element mismatch. Please check the console.</p>';
            return;
        }

        elements.loadFileBtn.addEventListener('click', () => {
            const file = elements.fileInput.files[0];
            loadQuestionsFromFile(file);
        });
        elements.startQuizBtn.addEventListener('click', startQuiz);
        elements.nextQBtn.addEventListener('click', nextQuestion);
        elements.backToSettingsBtn.addEventListener('click', () => switchView('settings'));
        elements.quitQuizBtn.addEventListener('click', quitQuiz);
        elements.resetIncorrectBtn.addEventListener('click', resetIncorrectHistory);
        elements.quizModeSelect.addEventListener('change', updateSettingsUI);

        switchView('upload');
    }

    initialize();
});

