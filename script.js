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

    // --- Elementos do QuizScreen ---
    const timerDisplay = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');
    const questionTextElement = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const hintButton = document.getElementById('hintButton');

    // --- Elementos de Áudio ---
    // Certifique-se de que esses arquivos existam na pasta 'sounds/'
    const correctSound = new Audio('audio/certo.mp3');
    const incorrectSound = new Audio('audio/errado.mp3');
    const timeoutSound = new Audio('audio/fimTempo.mp3');
    const hintSound = new Audio('audio/hint.mp3'); // Certifique-se de ter este arquivo também!

    // --- Elementos do Histórico ---
    const historyList = document.getElementById('historyList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // --- Elementos da Tela de Boas-Vindas (Nome do Participante) ---
    const participantNameInput = document.getElementById('participantName');

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
    const totalQuestionsPerLevel = 15; // Número de perguntas por nível

    let timeLeft = 0;
    let timerInterval;
    const timePerQuestion = 15; // Tempo em segundos por pergunta
    const hintCost = 5; // Custo da dica em pontos

    let sessionResults = []; // Array para guardar o resultado de cada pergunta na sessão
    let participantName = ''; // Variável para armazenar o nome do participante

    const HISTORY_STORAGE_KEY = 'quizHistory'; // Chave para armazenar o histórico no localStorage

    // --- Funções para Navegação entre Telas ---
    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        screenToShow.classList.remove('hidden');
        screenToShow.classList.add('active');
    }

    // --- Adição de Event Listeners para Navegação ---
    startButton.addEventListener('click', async () => {
        // Validar e capturar o nome do participante
        const name = participantNameInput.value.trim();
        if (name.length < 2) {
            alert("Por favor, digite um nome válido (mínimo 2 caracteres).");
            participantNameInput.focus(); // Coloca o foco de volta no campo
            return; // Impede a transição de tela
        }
        participantName = name; // Armazena o nome

        showScreen(mainScreen);
        // Carrega perguntas padrão apenas se ainda não foram carregadas
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
        displayHistory(); // Chama a função para carregar e exibir o histórico
    });

    aboutUsButton.addEventListener('click', () => {
        showScreen(welcomeScreen);
    });

    // Botões de Voltar que param o temporizador
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

    // --- Lógica de Seleção de Categoria e Níveis ---
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            showScreen(quizScreen);
            document.getElementById('categoryTitle').textContent = button.querySelector('h3').textContent;

            loadLevelsForCategory(currentCategory);

            document.getElementById('questionArea').classList.add('hidden');
            document.getElementById('levelSelection').classList.remove('hidden');
            nextQuestionButton.classList.add('hidden');
            hintButton.classList.add('hidden'); // Oculta o botão de dica na seleção de nível
            feedbackMessageElement.textContent = '';
            stopTimer(); // Garante que nenhum temporizador esteja rodando ao selecionar nível
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
            // Garante que "level1" vem antes de "level2" etc.
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

            // Limita o número de perguntas por nível
            if (quizQuestions.length > totalQuestionsPerLevel) {
                quizQuestions = quizQuestions.slice(0, totalQuestionsPerLevel);
            }
            document.getElementById('totalQuestionsNum').textContent = quizQuestions.length;

            currentQuestionIndex = 0;
            score = 0; // Reinicia a pontuação ao iniciar um novo quiz/nível
            sessionResults = []; // Zera o histórico da sessão ao iniciar novo quiz

            document.getElementById('levelSelection').classList.add('hidden');
            document.getElementById('questionArea').classList.remove('hidden');
            nextQuestionButton.classList.add('hidden');
            hintButton.classList.remove('hidden'); // Mostra o botão de dica
            hintButton.disabled = false; // Garante que a dica esteja habilitada
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
        stopTimer(); // Para o temporizador da pergunta anterior

        if (currentQuestionIndex < quizQuestions.length) {
            const question = quizQuestions[currentQuestionIndex];
            questionTextElement.textContent = question.question;
            document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
            feedbackMessageElement.textContent = ''; // Limpa a mensagem de feedback
            timerContainer.classList.remove('low-time'); // Remove classe de tempo baixo ao iniciar nova pergunta

            optionsContainer.innerHTML = ''; // Limpa opções anteriores

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
            hintButton.disabled = false; // Reabilita o botão de dica para a nova pergunta
            startTimer(); // Inicia o temporizador para a nova pergunta

        } else {
            // Fim do quiz para o nível atual
            showResult();
        }
    }

    function selectOption(event) {
        stopTimer(); // Para o temporizador assim que uma opção é selecionada
        const selectedButton = event.target;
        const currentQuestion = quizQuestions[currentQuestionIndex];
        const correctAnswerOption = currentQuestion.options.find(opt => opt.isCorrect);

        // Desativa todos os botões de opção após uma seleção
        document.querySelectorAll('.option-btn').forEach(button => {
            button.classList.remove('selected');
            button.removeEventListener('click', selectOption); // Impede múltiplos cliques
            button.disabled = true; // Desabilita os botões para não serem clicados novamente
        });

        selectedButton.classList.add('selected');
        hintButton.disabled = true; // Desabilita a dica após selecionar uma opção

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

            // Destacar a resposta correta após a resposta errada
            document.querySelectorAll('.option-btn').forEach(button => {
                if (button.dataset.correct === "true") {
                    button.classList.add('correct-answer');
                }
            });
        }

        // Registrar o resultado da pergunta para o histórico da sessão
        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: userAnswer,
            correctAnswer: correctAnswerOption.text,
            isCorrect: isCorrect
        });

        nextQuestionButton.classList.remove('hidden'); // Ativa o botão "Próxima Pergunta"
    }

    // Lógica do Botão de Dica
    hintButton.addEventListener('click', () => {
        if (score >= hintCost) { // Verifica se há pontos suficientes para a dica
            score -= hintCost; // Deduz o custo da pontuação
            hintSound.play(); // Toca o som da dica

            const optionButtons = Array.from(optionsContainer.querySelectorAll('.option-btn'));
            // Filtra opções incorretas que não estão desabilitadas (já removidas por outra dica ou selecionadas)
            const incorrectOptions = optionButtons.filter(button => button.dataset.correct !== "true" && !button.disabled);

            let numToRemove = 0;
            // Se houver pelo menos 3 incorretas (para remover 2 e sobrar 1)
            if (incorrectOptions.length >= 3) {
                numToRemove = 2;
            } else if (incorrectOptions.length === 2) { // Se houver 2 incorretas (para remover 1 e sobrar 1)
                numToRemove = 1;
            }

            if (numToRemove > 0) {
                const shuffledIncorrect = shuffleArray(incorrectOptions);
                for (let i = 0; i < numToRemove; i++) {
                    shuffledIncorrect[i].disabled = true; // Desabilita o botão
                    shuffledIncorrect[i].style.opacity = '0.3'; // Torna-o semitransparente
                    shuffledIncorrect[i].style.textDecoration = 'line-through'; // Risca o texto
                    shuffledIncorrect[i].style.cursor = 'not-allowed';
                }
                feedbackMessageElement.textContent = `Dica usada! ${numToRemove} opções incorretas removidas. (-${hintCost} pontos)`;
                feedbackMessageElement.style.color = '#FFD166'; // Cor de aviso para dica
            } else {
                feedbackMessageElement.textContent = `Dica usada! Não foi possível remover mais opções. (-${hintCost} pontos)`;
                feedbackMessageElement.style.color = '#FFD166';
            }

            hintButton.disabled = true; // Desativa o botão de dica após o uso para esta pergunta
        } else {
            feedbackMessageElement.textContent = `Você precisa de ${hintCost} pontos para usar a dica. Pontuação atual: ${score}`;
            feedbackMessageElement.style.color = '#dc3545';
        }
    });

    nextQuestionButton.addEventListener('click', () => {
        const selectedButton = document.querySelector('.option-btn.selected');
        // Este if lida com o caso de clique rápido após tempo esgotado sem seleção.
        if (!selectedButton && timeLeft > 0) {
            feedbackMessageElement.textContent = 'Por favor, selecione uma resposta!';
            feedbackMessageElement.style.color = '#FF6B6B';
            return;
        }
        document.querySelectorAll('.option-btn').forEach(button => {
            button.classList.remove('correct-answer', 'wrong-answer', 'selected');
            button.disabled = false; // Reabilita botões para a próxima pergunta
            button.style.opacity = '1'; // Reseta opacidade de dica
            button.style.textDecoration = 'none'; // Reseta risco de dica
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
        timeoutSound.play(); // Toca apenas o som de tempo esgotado

        const currentQuestion = quizQuestions[currentQuestionIndex]; // Obtém a pergunta atual
        const correctAnswerOption = currentQuestion.options.find(opt => opt.isCorrect); // Obtém a resposta correta

        feedbackMessageElement.textContent = `Tempo esgotado! A resposta correta era: "${correctAnswerOption.text}" ⏳`;
        feedbackMessageElement.style.color = '#dc3545';

        document.querySelectorAll('.option-btn').forEach(button => {
            button.disabled = true; // Desabilita todas as opções
            if (button.dataset.correct === "true") {
                button.classList.add('correct-answer');
            }
        });
        hintButton.disabled = true; // Desabilita dica quando o tempo acaba

        // Registrar o resultado da pergunta como incorreta por tempo esgotado
        sessionResults.push({
            question: currentQuestion.question,
            userAnswer: "Nenhuma (tempo esgotado)",
            correctAnswer: correctAnswerOption.text,
            isCorrect: false // Tempo esgotado é sempre uma resposta incorreta
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

    // --- Função de Exibição de Resultados Detalhada ---
    function showResult() {
        stopTimer();
        // Salvar o resultado no histórico
        saveQuizResult(currentCategory, currentLevel, score, quizQuestions.length, sessionResults);

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

        // Exibir detalhes das respostas
        const quizDetailsContainer = document.getElementById('quizDetails');
        quizDetailsContainer.innerHTML = '<h2>Detalhes das Respostas:</h2>'; // Limpa e adiciona título

        if (sessionResults.length === 0) {
            quizDetailsContainer.innerHTML += '<p>Nenhum detalhe de resposta disponível.</p>';
        } else {
            sessionResults.forEach((res, index) => {
                const detailDiv = document.createElement('div');
                detailDiv.classList.add('question-detail');
                if (!res.isCorrect) {
                    detailDiv.classList.add('incorrect'); // Adiciona classe se a resposta foi incorreta
                }

                detailDiv.innerHTML = `
                    <p><strong>Pergunta ${index + 1}:</strong> ${res.question}</p>
                    <p class="user-answer">Sua resposta: ${res.userAnswer}</p>
                    ${!res.isCorrect ? `<p class="correct-answer-text">Correta: ${res.correctAnswer}</p>` : ''}
                `;
                quizDetailsContainer.appendChild(detailDiv);
            });
        }
    }

    // --- Funções para Salvar e Exibir Histórico ---
    function saveQuizResult(category, level, score, totalQuestions, sessionResults) {
        // Tenta buscar o histórico existente ou inicializa um array vazio
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
        const date = new Date();
        const newResult = {
            id: Date.now(), // ID único para cada entrada de histórico (timestamp)
            timestamp: date.toLocaleString('pt-AO'), // Data e hora do quiz, formatado para Angola
            participant: participantName, // Inclui o nome do participante
            category: category,
            level: level,
            score: score,
            totalQuestions: totalQuestions,
            questionsAnswered: sessionResults // Detalhes das perguntas e respostas
        };
        history.push(newResult);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        console.log("Resultado do quiz salvo no histórico:", newResult);
    }

    function displayHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
        historyList.innerHTML = ''; // Limpa a lista antes de preencher

        if (history.length === 0) {
            historyList.innerHTML = '<p>Nenhum quiz jogado ainda.</p>';
            clearHistoryButton.classList.add('hidden'); // Oculta o botão se não houver histórico
        } else {
            clearHistoryButton.classList.remove('hidden'); // Mostra o botão se houver histórico
            // Exibir os resultados mais recentes primeiro
            history.reverse().forEach(result => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('history-item');
                itemDiv.innerHTML = `
                    <p class="history-date">${result.timestamp}</p>
                    <p><strong>Participante:</strong> ${result.participant || 'Anônimo'}</p>
                    <p><strong>Categoria:</strong> ${result.category.replace('Mode', ' Modo').replace(/([A-Z])/g, ' $1').trim().replace('General Culture', 'Cultura Geral')}</p>
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
            displayHistory(); // Atualiza a exibição para mostrar que está vazio
            alert("Histórico de quizzes limpo com sucesso!");
        }
    });

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

    if (loadXmlButton) { // Garante que o elemento exista antes de adicionar o listener
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

                reader.readAsText(file); // Lê o arquivo como texto
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

        // Verifica se há erros de parsing no XML
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

                    // Verifica se tem pelo menos uma opção e uma correta
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
        }
    }

});