document.addEventListener('DOMContentLoaded', () => {

    // --- Estrutura de Dados das Perguntas (Inicialmente vazia, será preenchida pelo XML) ---
    let quizData = {};
    const defaultXmlPath = 'dados/padrao.xml'; // Caminho para o seu XML padrão

    // --- 1. Seleção de Elementos das Telas ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainScreen = document.getElementById('mainScreen');
    const categorySelectionScreen = document.getElementById('categorySelectionScreen');
    const quizScreen = document.getElementById('quizScreen');
    const resultScreen = document.getElementById('resultScreen');
    const historyScreen = document.getElementById('historyScreen');
    const updateQuestionsScreen = document.getElementById('updateQuestionsScreen');

    // --- Novos elementos para o QuizScreen ---
    const timerDisplay = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');
    const questionTextElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const feedbackMessageElement = document.getElementById('feedbackMessage');

    // --- Elementos de Áudio ---
    const correctSound = new Audio('audio/certo.mp3');
    const incorrectSound = new Audio('audio/errado.mp3');
    const timeoutSound = new Audio('audio/fimTempo.mp3');

    // --- 2. Seleção de Botões de Navegação ---
    const startButton = document.getElementById('startButton');
    const playQuizButton = document.getElementById('playQuizButton');
    const updateQuestionsButton = document.getElementById('updateQuestionsButton');
    const viewHistoryButton = document.getElementById('viewHistoryButton');
    const aboutUsButton = document.getElementById('aboutUsButton');
    const backToMainMenuFromCategoriesButton = document.getElementById('backToMainMenuFromCategories');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const backToCategoriesFromQuizButton = document.getElementById('backToCategoriesFromQuiz');
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

    // --- Funções para Navegação ---
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        screenToShow.classList.remove('hidden');
        screenToShow.classList.add('active');
    }

    // --- Adição de Event Listeners para Navegação ---
    // Modificado: Carrega o XML padrão ao clicar em "Iniciar Quiz"
    startButton.addEventListener('click', async () => {
        showScreen(mainScreen);
        // Verifica se as perguntas já foram carregadas
        if (Object.keys(quizData).length === 0) {
            console.log("Tentando carregar perguntas padrão...");
            await loadDefaultQuizData(); // Aguarda o carregamento
        }
    });

    playQuizButton.addEventListener('click', () => {
        // Esta verificação ainda é boa caso o loadDefaultQuizData falhe
        if (Object.keys(quizData).length === 0) {
            alert("As perguntas não foram carregadas. Por favor, verifique o arquivo XML padrão ou use a opção 'Atualizar Perguntas'.");
            return;
        }
        showScreen(categorySelectionScreen);
    });

    // ... (restante dos event listeners de navegação, eles permanecem iguais) ...
    updateQuestionsButton.addEventListener('click', () => {
        showScreen(updateQuestionsScreen);
    });

    viewHistoryButton.addEventListener('click', () => {
        showScreen(historyScreen);
    });

    aboutUsButton.addEventListener('click', () => {
        showScreen(welcomeScreen);
    });

    backToMainMenuFromCategoriesButton.addEventListener('click', () => {
        showScreen(mainScreen);
        stopTimer();
    });

    backToCategoriesFromQuizButton.addEventListener('click', () => {
        showScreen(categorySelectionScreen);
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

    // --- Lógica de Seleção de Categoria e Níveis (permanece igual) ---
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            showScreen(quizScreen);
            document.getElementById('categoryTitle').textContent = button.querySelector('h3').textContent;

            loadLevelsForCategory(currentCategory);

            document.getElementById('questionArea').classList.add('hidden');
            document.getElementById('levelSelection').classList.remove('hidden');
            nextQuestionButton.classList.add('hidden');
            feedbackMessageElement.textContent = '';
            stopTimer();
        });
    });

    function loadLevelsForCategory(category) {
        const levelSelectionContainer = document.getElementById('levelSelection');
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

        levels.forEach(levelName => {
            const levelButton = document.createElement('button');
            levelButton.classList.add('btn', 'level-btn');
            levelButton.dataset.level = levelName;
            levelButton.textContent = `Nível ${levelName.replace('level', '')}`;
            levelButton.addEventListener('click', () => {
                currentLevel = levelName;
                loadQuiz(currentCategory, currentLevel);
            });
            levelSelectionContainer.appendChild(levelButton);
        });
    }

    function loadQuiz(category, level) {
        if (quizData[category] && quizData[category][level]) {
            quizQuestions = [...quizData[category][level]];
            quizQuestions = shuffleArray(quizQuestions);

            if (quizQuestions.length > totalQuestionsPerLevel) {
                quizQuestions = quizQuestions.slice(0, totalQuestionsPerLevel);
            }
            document.getElementById('totalQuestionsNum').textContent = quizQuestions.length;

            currentQuestionIndex = 0;
            score = 0;

            document.getElementById('levelSelection').classList.add('hidden');
            document.getElementById('questionArea').classList.remove('hidden');
            nextQuestionButton.classList.add('hidden');
            feedbackMessageElement.textContent = '';

            displayQuestion();
        } else {
            console.error(`Dados para categoria '${category}' ou nível '${level}' não encontrados.`);
            feedbackMessageElement.textContent = 'Perguntas para este nível não disponíveis no XML carregado!';
            feedbackMessageElement.style.color = '#dc3545';
        }
    }

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

        const userAnswer = selectedButton.dataset.answer;

        if (userAnswer === correctAnswerOption.text) {
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

        nextQuestionButton.classList.remove('hidden');
    }

    nextQuestionButton.addEventListener('click', () => {
        const selectedButton = document.querySelector('.option-btn.selected');
        if (!selectedButton) {
            feedbackMessageElement.textContent = 'Por favor, selecione uma resposta!';
            feedbackMessageElement.style.color = '#FF6B6B';
            return;
        }
        document.querySelectorAll('.option-btn').forEach(button => {
            button.classList.remove('correct-answer', 'wrong-answer', 'selected');
            button.disabled = false;
        });

        currentQuestionIndex++;

        setTimeout(() => {
            displayQuestion();
        }, 500);
    });

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

        feedbackMessageElement.textContent = `Tempo esgotado! A resposta correta era: "${quizQuestions[currentQuestionIndex].options.find(opt => opt.isCorrect).text}" ⏳`;
        feedbackMessageElement.style.color = '#dc3545';

        document.querySelectorAll('.option-btn').forEach(button => {
            button.disabled = true;
            if (button.dataset.correct === "true") {
                button.classList.add('correct-answer');
            }
        });

        nextQuestionButton.classList.remove('hidden');

        setTimeout(() => {
            document.querySelectorAll('.option-btn').forEach(button => {
                button.classList.remove('correct-answer', 'wrong-answer', 'selected');
                button.disabled = false;
            });
            currentQuestionIndex++;
            displayQuestion();
        }, 2000);
    }

    function showResult() {
        stopTimer();
        showScreen(resultScreen);
        document.getElementById('finalScore').textContent = score;
        document.getElementById('maxScore').textContent = quizQuestions.length;

        let message = '';
        if (score === quizQuestions.length) {
            message = 'Parabéns! Você é um mestre do conhecimento! 🏆';
        } else if (score >= quizQuestions.length / 2) {
            message = 'Muito bem! Você tem um bom conhecimento. Continue praticando! 👍';
        } else {
            message = 'Não desanime! Continue estudando e tente novamente! 💪';
        }
        document.getElementById('resultMessage').textContent = message;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Lógica de Atualização de XML Manual (existente) ---
    const xmlFileInput = document.getElementById('xmlFileInput');
    const loadXmlButton = document.getElementById('loadXmlButton');
    const xmlFeedback = document.getElementById('xmlFeedback');

    if (loadXmlButton) {
        loadXmlButton.addEventListener('click', () => {
            if (xmlFileInput.files.length > 0) {
                const file = xmlFileInput.files[0];
                const reader = new FileReader();

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
                            }, 2000);
                        } else {
                            xmlFeedback.textContent = "Erro: Nenhum dado de quiz válido encontrado no arquivo selecionado.";
                            xmlFeedback.style.color = "#dc3545";
                        }

                    } catch (error) {
                        xmlFeedback.textContent = "Erro ao processar o arquivo XML. Verifique a estrutura: " + error.message;
                        xmlFeedback.style.color = "#dc3545";
                        console.error("Erro ao processar XML do upload:", error);
                    }
                };

                reader.onerror = () => {
                    xmlFeedback.textContent = "Erro ao carregar o arquivo.";
                    xmlFeedback.style.color = "#dc3545";
                };

                reader.readAsText(file);
            } else {
                xmlFeedback.textContent = "Por favor, selecione um arquivo XML.";
                xmlFeedback.style.color = "#dc3545";
            }
        });
    }

    // --- Função: Parsear o XML e Converter para Objeto JavaScript (existente) ---
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
            console.warn("Nenhuma tag <category> encontrada no XML.");
            return {};
        }

        for (const categoryNode of categories) {
            const categoryName = categoryNode.getAttribute('name');
            if (!categoryName) {
                console.warn("Categoria sem atributo 'name' encontrada. Ignorando.");
                continue;
            }
            parsedData[categoryName] = {};

            const levels = categoryNode.getElementsByTagName('level');
            if (levels.length === 0) {
                console.warn(`Nenhuma tag <level> encontrada para a categoria ${categoryName}.`);
                continue;
            }

            for (const levelNode of levels) {
                const levelName = levelNode.getAttribute('name');
                if (!levelName) {
                    console.warn(`Nível sem atributo 'name' encontrado na categoria ${categoryName}. Ignorando.`);
                    continue;
                }
                parsedData[categoryName][levelName] = [];

                const questions = levelNode.getElementsByTagName('question');
                if (questions.length === 0) {
                    console.warn(`Nenhuma tag <question> encontrada para o nível ${levelName} da categoria ${categoryName}.`);
                    continue;
                }

                for (const questionNode of questions) {
                    const questionTextNode = questionNode.getElementsByTagName('text')[0];
                    const questionText = questionTextNode ? questionTextNode.textContent : '';
                    if (!questionText) {
                         console.warn(`Pergunta sem texto no nível ${levelName} da categoria ${categoryName}. Ignorando.`);
                         continue;
                    }

                    const options = [];
                    const optionNodes = questionNode.getElementsByTagName('option');
                    for (const optionNode of optionNodes) {
                        const optionText = optionNode.textContent;
                        const isCorrect = optionNode.getAttribute('correct') === 'true';
                        options.push({ text: optionText, isCorrect: isCorrect });
                    }

                    if (options.length > 0 && options.some(opt => opt.isCorrect)) {
                        parsedData[categoryName][levelName].push({
                            question: questionText,
                            options: options
                        });
                    } else {
                        console.warn(`Pergunta incompleta (sem opções ou sem resposta correta) no nível ${levelName} da categoria ${categoryName}.`);
                    }
                }
            }
        }
        return parsedData;
    }

    // --- FUNÇÃO PARA CARREGAR XML PADRÃO ---
    async function loadDefaultQuizData() {
        try {
            const response = await fetch(defaultXmlPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar o XML padrão: ${response.statusText} (${response.status})`);
            }
            const xmlString = await response.text();
            quizData = parseQuizXML(xmlString);
            console.log("Perguntas padrão carregadas com sucesso!");
        } catch (error) {
            console.error("Não foi possível carregar as perguntas padrão:", error);
            // Poderíamos exibir uma mensagem na tela para o usuário aqui
            // Por exemplo: feedbackMessageElement.textContent = "Erro ao carregar perguntas padrão. Tente atualizar manualmente.";
            // feedbackMessageElement.style.color = "#dc3545";
        }
    }

    // A chamada loadDefaultQuizData() é REMOVIDA daqui e movida para o startButton.
    // loadDefaultQuizData();

});