document.addEventListener('DOMContentLoaded', () => {

    // --- Estrutura de Dados das Perguntas (Inicialmente vazia, será preenchida pelo XML) ---
    let quizData = {};
    const defaultXmlPath = 'data/default_questions.xml'; // Caminho para o seu XML padrão
    const defaultWelcomeInfoXmlPath = 'data/welcome_info.xml'; // Caminho para o XML da tela inicial

    // --- 1. Seleção de Elementos das Telas ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainScreen = document.getElementById('mainScreen');
    const categorySelectionScreen = document.getElementById('categorySelectionScreen');
    const levelSelectionScreen = document.getElementById('levelSelectionScreen');
    const questionScreen = document.getElementById('questionScreen');
    const resultScreen = document.getElementById('resultScreen');
    const historyScreen = document.getElementById('historyScreen');
    const updateQuestionsScreen = document.getElementById('updateQuestionsScreen');

    // --- Elementos do QuizScreen (agora questionScreen) ---
    const timerDisplay = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');
    const questionTextElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const hintButton = document.getElementById('hintButton');
    const questionCategoryLevelTitle = document.getElementById('questionCategoryLevelTitle');

    // --- Elementos da LevelSelectionScreen ---
    const levelCategoryTitle = document.getElementById('levelCategoryTitle');
    const levelSelectionContainer = document.getElementById('levelSelection');

    // --- Elementos de Áudio ---
    const correctSound = new Audio('sounds/correct.mp3');
    const incorrectSound = new Audio('sounds/incorrect.mp3');
    const timeoutSound = new Audio('sounds/timeout.mp3');
    const hintSound = new Audio('sounds/hint.mp3');

    // --- Elementos do Histórico ---
    const historyList = document.getElementById('historyList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // --- Elementos da Tela de Boas-Vindas (Nome e Info Dinâmica) ---
    const participantNameInput = document.getElementById('participantName');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeDescription = document.getElementById('welcomeDescription');
    const whoAreWeTitle = document.getElementById('whoAreWeTitle');
    const whoAreWeText = document.getElementById('whoAreWeText');
    const locationTitle = document.getElementById('locationTitle');
    const locationText = document.getElementById('locationText');
    const contactsTitle = document.getElementById('contactsTitle');
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    const contactSocialMedia = document.getElementById('contactSocialMedia');

    // --- Elemento do Loading Overlay ---
    const loadingOverlay = document.getElementById('loadingOverlay');


    // --- 2. Seleção de Botões de Navegação ---
    const startButton = document.getElementById('startButton');
    const playQuizButton = document.getElementById('playQuizButton');
    const updateQuestionsButton = document.getElementById('updateQuestionsButton');
    const viewHistoryButton = document.getElementById('viewHistoryButton');
    const aboutUsButton = document.getElementById('aboutUsButton');
    const backToMainMenuFromCategoriesButton = document.getElementById('backToMainMenuFromCategories');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const backToCategoriesFromLevelsButton = document.getElementById('backToCategoriesFromLevels');
    const backToLevelsFromQuestionsButton = document.getElementById('backToLevelsFromQuestions');
    const playAgainButton = document.getElementById('playAgainButton');
    const backToMainFromResultsButton = document.getElementById('backToMainFromResults');
    const backToMainMenuFromHistoryButton = document.getElementById('backToMainMenuFromHistory');
    const backToMainMenuFromUpdateButton = document.getElementById('backToMainMenuFromUpdate');
    const nextQuestionButton = document.getElementById('nextQuestionButton');

    // --- Variáveis de Estado do Quiz ---
    let currentCategory = '';
    let currentLevel = '';
    let currentQuestionIndex = 0;
    let score = 0;
    let quizQuestions = [];
    const totalQuestionsPerLevel = 15;

    let timeLeft = 0;
    let timerInterval;
    const timePerQuestion = 15;
    const hintCost = 5;
    const UNLOCK_PERCENTAGE = 80;

    let sessionResults = [];
    let participantName = '';

    const HISTORY_STORAGE_KEY = 'quizHistory';
    const PROGRESS_STORAGE_KEY = 'quizProgress';

    // --- Funções para Navegação entre Telas ---
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        screenToShow.classList.remove('hidden');
        screenToShow.classList.add('active');
    }

    // --- Funções para Mostrar/Esconder o Loading Overlay ---
    function showLoading() {
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    // --- Adição de Event Listeners para Navegação ---
    startButton.addEventListener('click', async () => {
        const name = participantNameInput.value.trim();
        if (name.length < 2) {
            alert("Por favor, digite um nome válido (mínimo 2 caracteres).");
            participantNameInput.focus();
            return;
        }
        participantName = name;

        showScreen(mainScreen);
        if (Object.keys(quizData).length === 0) {
            console.log("Tentando carregar perguntas padrão...");
            await loadDefaultQuizData();
        }
    });

    playQuizButton.addEventListener('click', () => {
        if (Object.keys(quizData).length === 0) {
            alert("As perguntas não foram carregadas. Por favor, verifique o arquivo XML padrão ou use a opção 'Atualizar Perguntas'.");
            return;
        }
        showScreen(categorySelectionScreen);
    });

    updateQuestionsButton.addEventListener('click', () => {
        showScreen(updateQuestionsScreen);
    });

    viewHistoryButton.addEventListener('click', () => {
        showScreen(historyScreen);
        displayHistory();
    });

    aboutUsButton.addEventListener('click', () => {
        showScreen(aboutUsScreen);
    });

    // Botões de Voltar que param o temporizador
    backToMainMenuFromCategoriesButton.addEventListener('click', () => {
        showScreen(mainScreen);
        stopTimer();
    });

    backToCategoriesFromLevelsButton.addEventListener('click', () => {
        showScreen(categorySelectionScreen);
        stopTimer();
    });

    backToLevelsFromQuestionsButton.addEventListener('click', () => {
        showScreen(levelSelectionScreen);
        stopTimer();
    });

    backToMainFromResultsButton.addEventListener('click', () => {
        showScreen(mainScreen);
        stopTimer();
    });

    playAgainButton.addEventListener('click', () => {
        showScreen(categorySelectionScreen);
        stopTimer();
    });

    backToMainMenuFromHistoryButton.addEventListener('click', () => {
        showScreen(mainScreen);
    });

    backToMainMenuFromUpdateButton.addEventListener('click', () => {
        showScreen(mainScreen);
    });

    backToMainMenuFromAboutUs.addEventListener('click', () => {
        showScreen(mainScreen);
    });

    // --- Lógica de Seleção de Categoria e Níveis ---
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            showScreen(levelSelectionScreen);
            levelCategoryTitle.textContent = button.querySelector('h3').textContent;

            loadLevelsForCategory(currentCategory);
            feedbackMessageElement.textContent = '';
            stopTimer();
        });
    });

    function loadLevelsForCategory(category) {
        levelSelectionContainer.innerHTML = '<h3>Escolha o Nível:</h3>';

        if (!quizData[category]) {
            levelSelectionContainer.innerHTML += '<p style="color: red;">Níveis para esta categoria não encontrados no XML carregado.</p>';
            return;
        }

        const levels = Object.keys(quizData[category]).sort((a, b) => {
            const numA = parseInt(a.replace('level', ''));
            const numB = parseInt(b.replace('level', ''));
            return numA - numB;
        });

        if (levels.length === 0) {
            levelSelectionContainer.innerHTML += '<p style="color: red;">Nenhum nível encontrado para esta categoria.</p>';
            return;
        }

        const userProgress = getProgress();

        levels.forEach((levelName, index) => {
            const levelButton = document.createElement('button');
            levelButton.classList.add('btn', 'level-btn');
            levelButton.dataset.level = levelName;
            levelButton.textContent = `Nível ${levelName.replace('level', '')}`;

            const levelNum = parseInt(levelName.replace('level', ''));
            const previousLevelName = `level${levelNum - 1}`;
            
            const isPreviousLevelCompleted = userProgress[category] && userProgress[category][previousLevelName] === 'completed';
            const isCurrentLevelAvailable = userProgress[category] && userProgress[category][levelName] === 'available';
            const isCurrentLevelCompleted = userProgress[category] && userProgress[category][levelName] === 'completed';

            // Nível 0 está sempre desbloqueado. Outros níveis precisam do anterior 'completed' ou de já estarem 'available'.
            const isUnlocked = levelNum === 0 || isPreviousLevelCompleted || isCurrentLevelAvailable;

            if (!isUnlocked) {
                levelButton.classList.add('locked-level');
                levelButton.disabled = true;
                levelButton.textContent += ' 🔒';
            } else {
                if (isCurrentLevelCompleted) {
                    levelButton.textContent += ' ⭐';
                } else {
                    levelButton.textContent += ' ✅';
                }
            }

            levelButton.addEventListener('click', () => {
                if (isUnlocked) {
                    currentLevel = levelName;
                    loadQuiz(currentCategory, currentLevel);
                }
            });
            levelSelectionContainer.appendChild(levelButton);
        });
    }

    function loadQuiz(category, level) {
        if (quizData[category] && quizData[category][level]) {
            quizQuestions = [...quizData[category][level]];

            if (quizQuestions.length === 0) {
                alert(`Não há perguntas disponíveis para o Nível ${level.replace('level', '')} nesta categoria. Por favor, escolha outro nível ou categoria.`);
                console.warn(`Nível '${level}' na categoria '${category}' não possui perguntas no XML.`);
                showScreen(levelSelectionScreen);
                loadLevelsForCategory(category);
                return;
            }

            quizQuestions = shuffleArray(quizQuestions);

            if (quizQuestions.length > totalQuestionsPerLevel) {
                quizQuestions = quizQuestions.slice(0, totalQuestionsPerLevel);
            }
            document.getElementById('totalQuestionsNum').textContent = quizQuestions.length;

            currentQuestionIndex = 0;
            score = 0;
            sessionResults = [];

            showScreen(questionScreen);
            questionCategoryLevelTitle.textContent = `${levelCategoryTitle.textContent} - Nível ${level.replace('level', '')}`;


            nextQuestionButton.classList.add('hidden');
            hintButton.classList.remove('hidden');
            hintButton.disabled = false;
            feedbackMessageElement.textContent = '';

            displayQuestion();
        } else {
            console.error(`Dados para categoria '${category}' ou nível '${level}' não encontrados.`);
            feedbackMessageElement.textContent = 'Perguntas para este nível não disponíveis no XML carregado!';
            feedbackMessageElement.style.color = '#dc3545';
        }
    }

    // --- Funções Principais do Quiz (Display, Seleção, Dica, Avançar) ---
    function displayQuestion() {
        stopTimer();

        if (currentQuestionIndex < quizQuestions.length) {
            const question = quizQuestions[currentQuestionIndex];
            questionTextElement.textContent = question.question;
            document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
            feedbackMessageElement.textContent = '';
            timerContainer.classList.remove('low-time');

            optionsContainer.innerHTML = '';

            const shuffledOptions = shuffleArray([...question.options]);

            shuffledOptions.forEach(option => {
                const button = document.createElement('button');
                button.classList.add('btn', 'option-btn');
                button.textContent = option.text;
                button.dataset.answer = option.text;
                if (option.isCorrect) {
                    button.dataset.correct = "true";
                }
                button.addEventListener('click', selectOption);
                optionsContainer.appendChild(button);
            });

            nextQuestionButton.classList.add('hidden');
            hintButton.disabled = false;
            startTimer();

        } else {
            showResult();
        }
    }

    function selectOption(event) {
        stopTimer();
        const selectedButton = event.target;
        const currentQuestion = quizQuestions[currentQuestionIndex];
        const correctAnswerOption = currentQuestion.options.find(opt => opt.isCorrect);

        document.querySelectorAll('.option-btn').forEach(button => {
            button.classList.remove('selected');
            button.removeEventListener('click', selectOption);
            button.disabled = true;
        });

        selectedButton.classList.add('selected');
        hintButton.disabled = true;

        const userAnswer = selectedButton.dataset.answer;
        let isCorrect = (userAnswer === correctAnswerOption.text);

        if (isCorrect) {
            score++;
            feedbackMessageElement.textContent = 'Certo! 🎉';
            feedbackMessageElement.style.color = '#28a745';
            correctSound.play();
            selectedButton.classList.add('correct-answer');
        } else {
            feedbackMessageElement.textContent = `Errado! A resposta correta é: "${correctAnswerOption.text}" 😢`;
            feedbackMessageElement.style.color = '#dc3545';
            incorrectSound.play();
            selectedButton.classList.add('wrong-answer');

            document.querySelectorAll('.option-btn').forEach(button => {
                if (button.dataset.correct === "true") {
                    button.classList.add('correct-answer');
                }
            });
        }

        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: userAnswer,
            correctAnswer: correctAnswerOption.text,
            isCorrect: isCorrect
        });

        nextQuestionButton.classList.remove('hidden');
    }

    // Lógica do Botão de Dica
    hintButton.addEventListener('click', () => {
        const optionButtons = Array.from(optionsContainer.querySelectorAll('.option-btn'));
        const incorrectOptions = optionButtons.filter(button => button.dataset.correct !== "true" && !button.disabled);

        let numToRemove = 0;
        if (incorrectOptions.length >= 3) {
            numToRemove = 2;
        } else if (incorrectOptions.length === 2) {
            numToRemove = 1;
        }

        if (numToRemove > 0) {
            if (score >= hintCost) {
                score -= hintCost;
                hintSound.play();

                const shuffledIncorrect = shuffleArray(incorrectOptions);
                for (let i = 0; i < numToRemove; i++) {
                    shuffledIncorrect[i].disabled = true;
                    shuffledIncorrect[i].style.opacity = '0.3';
                    shuffledIncorrect[i].style.textDecoration = 'line-through';
                    shuffledIncorrect[i].style.cursor = 'not-allowed';
                }
                feedbackMessageElement.textContent = `Dica usada! ${numToRemove} opções incorretas removidas. (-${hintCost} pontos)`;
                feedbackMessageElement.style.color = '#FFD166';
            } else {
                feedbackMessageElement.textContent = `Você precisa de ${hintCost} pontos para usar a dica. Pontuação atual: ${score}`;
                feedbackMessageElement.style.color = '#dc3545';
                return;
            }
        } else {
            feedbackMessageElement.textContent = `Dica indisponível: Poucas opções incorretas para remover.`;
            feedbackMessageElement.style.color = '#dc3545';
        }

        hintButton.disabled = true;
    });

    nextQuestionButton.addEventListener('click', () => {
        const selectedButton = document.querySelector('.option-btn.selected');
        if (!selectedButton && timeLeft > 0) {
            feedbackMessageElement.textContent = 'Por favor, selecione uma resposta!';
            feedbackMessageElement.style.color = '#FF6B6B';
            return;
        }
        document.querySelectorAll('.option-btn').forEach(button => {
            button.classList.remove('correct-answer', 'wrong-answer', 'selected');
            button.disabled = false;
            button.style.opacity = '1';
            button.style.textDecoration = 'none';
        });

        currentQuestionIndex++;

        setTimeout(() => {
            displayQuestion();
        }, 500);
    });

    // --- Funções de Temporizador ---
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = timePerQuestion;
        timerDisplay.textContent = timeLeft;
        timerContainer.classList.remove('low-time');

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 5 && timeLeft > 0) {
                timerContainer.classList.add('low-time');
            } else if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeUp();
            } else {
                timerContainer.classList.remove('low-time');
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerContainer.classList.remove('low-time');
    }

    function handleTimeUp() {
        stopTimer();
        timeoutSound.play();

        const currentQuestion = quizQuestions[currentQuestionIndex];
        const correctAnswerOption = currentQuestion.options.find(opt => opt.isCorrect);

        feedbackMessageElement.textContent = `Tempo esgotado! A resposta correta era: "${correctAnswerOption.text}" ⏳`;
        feedbackMessageElement.style.color = '#dc3545';

        document.querySelectorAll('.option-btn').forEach(button => {
            button.disabled = true;
            if (button.dataset.correct === "true") {
                button.classList.add('correct-answer');
            }
        });
        hintButton.disabled = true;

        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: "Nenhuma (tempo esgotado)",
            correctAnswer: correctAnswerOption.text,
            isCorrect: false
        });

        nextQuestionButton.classList.remove('hidden');

        setTimeout(() => {
            document.querySelectorAll('.option-btn').forEach(button => {
                button.classList.remove('correct-answer', 'wrong-answer', 'selected');
                button.disabled = false;
                button.style.opacity = '1';
                button.style.textDecoration = 'none';
            });
            currentQuestionIndex++;
            displayQuestion();
        }, 2000);
    }

    // --- Função de Exibição de Resultados Detalhada e Lógica de Desbloqueio ---
    function showResult() {
        stopTimer();

        const percentageCorrect = (score / quizQuestions.length) * 100;
        let unlockedNextLevel = false;

        saveQuizResult(currentCategory, currentLevel, score, quizQuestions.length, sessionResults);

        if (percentageCorrect >= UNLOCK_PERCENTAGE) {
            saveProgress(currentCategory, currentLevel, 'completed');

            const nextLevelNum = parseInt(currentLevel.replace('level', '')) + 1;
            const nextLevelName = `level${nextLevelNum}`;

            if (quizData[currentCategory] && quizData[currentCategory][nextLevelName]) {
                saveProgress(currentCategory, nextLevelName, 'available');
                unlockedNextLevel = true;
            }
        }

        if (unlockedNextLevel) {
            alert(`Parabéns! Você desbloqueou o Nível ${parseInt(currentLevel.replace('level', '')) + 1} com ${percentageCorrect.toFixed(2)}% de acertos! 🎉`);
            showScreen(levelSelectionScreen);
            levelCategoryTitle.textContent = `${levelCategoryTitle.textContent.split(' - ')[0]}`;
            loadLevelsForCategory(currentCategory);
        } else {
            let message = '';
            if (score === 0) {
                 message = `Oops! Você não acertou nenhuma pergunta neste nível. Tente novamente! 😔`;
            } else if (percentageCorrect < UNLOCK_PERCENTAGE) {
                message = `Você acertou ${percentageCorrect.toFixed(2)}% das perguntas. Para desbloquear o próximo nível, você precisa de ${UNLOCK_PERCENTAGE}% de acertos. Continue praticando! 💪`;
            } else {
                message = `Você concluiu o nível com ${percentageCorrect.toFixed(2)}% de acertos. Muito bem! Não há mais níveis para desbloquear nesta categoria. 👍`;
            }

            alert(message);
            showScreen(levelSelectionScreen);
            levelCategoryTitle.textContent = `${levelCategoryTitle.textContent.split(' - ')[0]}`;
            loadLevelsForCategory(currentCategory);
        }
    }

    // --- Funções para Salvar e Exibir Histórico e Progresso ---
    function saveQuizResult(category, level, score, totalQuestions, sessionResults) {
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
        const date = new Date();
        const newResult = {
            id: Date.now(),
            timestamp: date.toLocaleString('pt-AO'),
            participant: participantName,
            category: category,
            level: level,
            score: score,
            totalQuestions: totalQuestions,
            questionsAnswered: sessionResults
        };
        history.push(newResult);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        console.log("Resultado do quiz salvo no histórico:", newResult);
    }

    function displayHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<p>Nenhum quiz jogado ainda.</p>';
            clearHistoryButton.classList.add('hidden');
        } else {
            clearHistoryButton.classList.remove('hidden');
            history.reverse().forEach(result => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('history-item');

                let formattedCategory = result.category;
                if (formattedCategory === 'misturaTudo') { // ALTERADO: Adicionado para "misturaTudo"
                    formattedCategory = 'Mistura Tudo';
                } else {
                    formattedCategory = formattedCategory.replace('Mode', ' Modo')
                                                        .replace(/([A-Z])/g, ' $1')
                                                        .trim()
                                                        .replace('General Culture', 'Cultura Geral');
                }

                itemDiv.innerHTML = `
                    <p class="history-date">${result.timestamp}</p>
                    <p><strong>Participante:</strong> ${result.participant || 'Anônimo'}</p>
                    <p><strong>Categoria:</strong> ${formattedCategory}</p>
                    <p><strong>Nível:</strong> ${result.level.replace('level', '')}</p>
                    <p class="history-score">Pontuação: ${result.score} / ${result.totalQuestions}</p>
                    <details>
                        <summary>Ver detalhes das respostas</summary>
                        <div class="quiz-details" style="max-height: 200px; overflow-y: auto; background-color: #f0f0f0; padding: 10px; border-radius: 8px;">
                            ${result.questionsAnswered.map((qDetail, qIndex) => `
                                <p style="margin-bottom: 5px;"><strong>Q${qIndex + 1}:</strong> ${qDetail.question}</p>
                                <p style="margin-left: 15px; color: ${qDetail.isCorrect ? '#28a745' : '#dc3545'};">
                                    Sua resposta: ${qDetail.userAnswer} ${qDetail.isCorrect ? '✔' : '✖'}
                                </p>
                                ${!qDetail.isCorrect ? `<p style="margin-left: 15px; color: #28a745;">Correta: ${qDetail.correctAnswer}</p>` : ''}
                            `).join('')}
                        </div>
                    </details>
                `;
                historyList.appendChild(itemDiv);
            });
        }
    }

    // Lógica para Limpar o Histórico
    clearHistoryButton.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja limpar todo o histórico de quizzes?")) {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
            localStorage.removeItem(PROGRESS_STORAGE_KEY); // Limpa também o progresso ao limpar o histórico
            displayHistory();
            alert("Histórico de quizzes e progresso limpos com sucesso!");
        }
    });

    // Funções para salvar e obter progresso de níveis
    function saveProgress(category, level, status = 'available') {
        let progress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');

        if (!progress[category]) {
            progress[category] = {};
        }

        if (status === 'completed' || progress[category][level] !== 'completed') {
            progress[category][level] = status;
        }

        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        console.log(`Progresso salvo: Categoria ${category}, Nível ${level} status: ${status}.`);
    }

    function getProgress() {
        return JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    }

    // --- Função Auxiliar: Embaralhar um Array (Algoritmo Fisher-Yates) ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Troca elementos
        }
        return array;
    }

    // --- Lógica de Atualização de XML Manual ---
    const xmlFileInput = document.getElementById('xmlFileInput');
    const loadXmlButton = document.getElementById('loadXmlButton');
    const xmlFeedback = document.getElementById('xmlFeedback');

    if (loadXmlButton) {
        loadXmlButton.addEventListener('click', () => {
            if (xmlFileInput.files.length > 0) {
                const file = xmlFileInput.files[0];
                const reader = new FileReader();

                showLoading();

                reader.onload = (e) => {
                    try {
                        const xmlString = e.target.result;
                        quizData = parseQuizXML(xmlString);

                        if (Object.keys(quizData).length > 0) {
                            xmlFeedback.textContent = "Perguntas carregadas com sucesso do arquivo selecionado!";
                            xmlFeedback.style.color = "#28a745";
                            console.log("Dados do Quiz carregados do upload:", quizData);
                            setTimeout(() => {
                                showScreen(mainScreen);
                                hideLoading();
                            }, 2000);
                        } else {
                            xmlFeedback.textContent = "Erro: Nenhum dado de quiz válido encontrado no arquivo selecionado.";
                            xmlFeedback.style.color = "#dc3545";
                            hideLoading();
                        }

                    } catch (error) {
                        xmlFeedback.textContent = "Erro ao processar o arquivo XML. Verifique a estrutura: " + error.message;
                        xmlFeedback.style.color = "#dc3545";
                        console.error("Erro ao processar XML do upload:", error);
                        hideLoading();
                    }
                };

                reader.onerror = () => {
                    xmlFeedback.textContent = "Erro ao carregar o arquivo.";
                    xmlFeedback.style.color = "#dc3545";
                    hideLoading();
                };

                reader.readAsText(file);
            } else {
                xmlFeedback.textContent = "Por favor, selecione um arquivo XML.";
                xmlFeedback.style.color = "#dc3545";
            }
        });
    }

    // --- Função: Parsear o XML e Converter para Objeto JavaScript ---
    function parseQuizXML(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        const parsedData = {};

        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            const error = xmlDoc.getElementsByTagName("parsererror")[0];
            const errorText = error ? error.textContent : "Erro desconhecido no XML.";
            throw new Error("Erro de sintaxe no arquivo XML: " + errorText);
        }

        const categories = xmlDoc.getElementsByTagName('category');
        if (categories.length === 0) {
            throw new Error("Erro: Nenhuma tag <category> encontrada no arquivo XML. A estrutura principal está ausente.");
        }

        for (const categoryNode of categories) {
            const categoryName = categoryNode.getAttribute('name');
            if (!categoryName || categoryName.trim() === '') {
                throw new Error("Erro de validação: Uma tag <category> não possui o atributo 'name' ou está vazio.");
            }
            parsedData[categoryName] = {};

            const levels = categoryNode.getElementsByTagName('level');
            if (levels.length === 0) {
                console.warn(`Aviso: Nenhuma tag <level> encontrada para a categoria '${categoryName}'.`);
                continue;
            }

            for (const levelNode of levels) {
                const levelName = levelNode.getAttribute('name');
                if (!levelName || levelName.trim() === '') {
                    throw new Error(`Erro de validação: Um nível na categoria '${categoryName}' não possui o atributo 'name' ou está vazio.`);
                }
                parsedData[categoryName][levelName] = [];

                const questions = levelNode.getElementsByTagName('question');
                if (questions.length === 0) {
                    console.warn(`Aviso: Nenhuma tag <question> encontrada para o nível '${levelName}' da categoria '${categoryName}'.`);
                    continue;
                }

                for (const questionNode of questions) {
                    const questionTextNode = questionNode.getElementsByTagName('text')[0];
                    const questionText = questionTextNode ? questionTextNode.textContent?.trim() : '';

                    if (!questionText) {
                         throw new Error(`Erro de validação: Uma pergunta no nível '${levelName}' da categoria '${categoryName}' não possui texto.`);
                    }

                    const options = [];
                    const optionNodes = questionNode.getElementsByTagName('option');
                    if (optionNodes.length < 2) {
                        throw new Error(`Erro de validação: Pergunta "${questionText}" no nível '${levelName}' precisa de no mínimo 2 opções.`);
                    }

                    let correctOptionCount = 0;
                    for (const optionNode of optionNodes) {
                        const optionText = optionNode.textContent?.trim();
                        if (!optionText) {
                             throw new Error(`Erro de validação: Uma opção para a pergunta "${questionText}" está vazia.`);
                        }
                        const isCorrect = optionNode.getAttribute('correct') === 'true';
                        if (isCorrect) {
                            correctOptionCount++;
                        }
                        options.push({ text: optionText, isCorrect: isCorrect });
                    }

                    if (correctOptionCount === 0) {
                        throw new Error(`Erro de validação: Pergunta "${questionText}" no nível '${levelName}' não possui uma resposta correta marcada.`);
                    }
                    if (correctOptionCount > 1) {
                        throw new Error(`Erro de validação: Pergunta "${questionText}" no nível '${levelName}' possui mais de uma resposta correta marcada.`);
                    }

                    parsedData[categoryName][levelName].push({
                        question: questionText,
                        options: options
                    });
                }
            }
        }
        return parsedData;
    }

    // --- FUNÇÃO PARA CARREGAR XML PADRÃO DO QUIZ ---
    async function loadDefaultQuizData() {
        showLoading();
        try {
            const response = await fetch(defaultXmlPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar o XML padrão do quiz: ${response.statusText} (${response.status})`);
            }
            const xmlString = await response.text();
            quizData = parseQuizXML(xmlString);
            console.log("Perguntas padrão do quiz carregadas com sucesso!");
        } catch (error) {
            console.error("Não foi possível carregar as perguntas padrão do quiz:", error);
        } finally {
            hideLoading();
        }
    }

    // --- FUNÇÃO PARA CARREGAR E EXIBIR INFORMAÇÕES DA TELA DE BOAS-VINDAS ---
    async function loadWelcomeInfo() {
        try {
            const response = await fetch(defaultWelcomeInfoXmlPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar informações de boas-vindas: ${response.statusText} (${response.status})`);
            }
            const xmlString = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "application/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Erro de sintaxe no XML de boas-vindas. Verifique a estrutura.");
            }

            const welcomeInfoNode = xmlDoc.getElementsByTagName('welcomeInfo')[0];
            if (!welcomeInfoNode) throw new Error("Tag <welcomeInfo> não encontrada no XML de boas-vindas.");

            welcomeTitle.textContent = welcomeInfoNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
            if (!welcomeTitle.textContent) console.warn("Aviso: Título principal vazio no welcome_info.xml.");

            welcomeDescription.textContent = welcomeInfoNode.getElementsByTagName('description')[0]?.textContent?.trim() || '';
            if (!welcomeDescription.textContent) console.warn("Aviso: Descrição principal vazia no welcome_info.xml.");

            const whoAreWeNode = welcomeInfoNode.getElementsByTagName('whoAreWe')[0];
            if (whoAreWeNode) {
                whoAreWeTitle.textContent = whoAreWeNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
                whoAreWeText.textContent = whoAreWeNode.getElementsByTagName('text')[0]?.textContent?.trim() || '';
                if (!whoAreWeTitle.textContent || !whoAreWeText.textContent) console.warn("Aviso: Seção 'Quem Somos' incompleta no welcome_info.xml.");
            } else {
                console.warn("Aviso: Seção 'Quem Somos' não encontrada no welcome_info.xml.");
            }

            const locationNode = welcomeInfoNode.getElementsByTagName('location')[0];
            if (locationNode) {
                locationTitle.textContent = locationNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
                locationText.textContent = locationNode.getElementsByTagName('text')[0]?.textContent?.trim() || '';
                if (!locationTitle.textContent || !locationText.textContent) console.warn("Aviso: Seção 'Localização' incompleta no welcome_info.xml.");
            } else {
                console.warn("Aviso: Seção 'Localização' não encontrada no welcome_info.xml.");
            }

            const contactsNode = welcomeInfoNode.getElementsByTagName('contacts')[0];
            if (contactsNode) {
                contactsTitle.textContent = contactsNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
                const email = contactsNode.getElementsByTagName('email')[0]?.textContent?.trim() || '';
                const phone = contactsNode.getElementsByTagName('phone')[0]?.textContent?.trim() || '';
                const socialMedia = contactsNode.getElementsByTagName('socialMedia')[0]?.textContent?.trim() || '';

                if (email) {
                    contactEmail.textContent = email;
                    contactEmail.href = `mailto:${email}`;
                } else {
                    contactEmail.textContent = 'Não informado';
                    contactEmail.href = '#';
                }
                contactPhone.textContent = phone || 'Não informado';
                contactSocialMedia.textContent = socialMedia || 'Não informado';

                if (!email && !phone && !socialMedia) console.warn("Aviso: Seção 'Contactos' vazia no welcome_info.xml.");
            } else {
                console.warn("Aviso: Seção 'Contactos' não encontrada no welcome_info.xml.");
            }

            console.log("Informações de boas-vindas carregadas com sucesso!");

        } catch (error) {
            console.error("Não foi possível carregar as informações de boas-vindas:", error);
        }
    }

    // --- Chamadas Iniciais ao carregar a página ---
    loadWelcomeInfo();

});