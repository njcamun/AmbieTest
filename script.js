document.addEventListener('DOMContentLoaded', () => {

    // --- Estrutura de Dados das Perguntas (Inicialmente vazia, será preenchida pelo XML) ---
    let quizData = {};
    const defaultXmlPath = 'data/default_questions.xml'; // Caminho para o seu XML padrão
    const defaultWelcomeInfoXmlPath = 'data/welcome_info.xml'; // Caminho para o XML da tela inicial

    // --- 1. Seleção de Elementos das Telas ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainScreen = document.getElementById('mainScreen');
    const categorySelectionScreen = document.getElementById('categorySelectionScreen');
    const levelSelectionScreen = document.getElementById('levelSelectionScreen'); // NOVA TELA
    const questionScreen = document.getElementById('questionScreen'); // ANTIGA quizScreen, renomeada
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
    const questionCategoryLevelTitle = document.getElementById('questionCategoryLevelTitle'); // Novo título para tela de perguntas

    // --- Elementos da LevelSelectionScreen ---
    const levelCategoryTitle = document.getElementById('levelCategoryTitle'); // Título para tela de seleção de nível
    const levelSelectionContainer = document.getElementById('levelSelection'); // Container dos botões de nível

    // --- Elementos de Áudio ---
    // Certifique-se de que esses arquivos existam na pasta 'sounds/'
    const correctSound = new Audio('sounds/correct.mp3');
    const incorrectSound = new Audio('sounds/incorrect.mp3');
    const timeoutSound = new Audio('sounds/timeout.mp3');
    const hintSound = new Audio('sounds/hint.mp3'); // Certifique-se de ter este arquivo também!

    // --- Elementos do Histórico ---
    const historyList = document.getElementById('historyList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // --- Elementos da Tela de Boas-Vindas (Nome e Info Dinâmica) ---
    const participantNameInput = document.getElementById('participantName');
    const welcomeLogo = document.getElementById('welcomeLogo');
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
    const totalQuestionsPerLevel = 15; // Número de perguntas por nível

    let timeLeft = 0;
    let timerInterval;
    const timePerQuestion = 15; // Tempo em segundos por pergunta
    const hintCost = 5; // Custo da dica em pontos
    const UNLOCK_PERCENTAGE = 80; // % de acertos para desbloquear o próximo nível

    let sessionResults = []; // Array para guardar o resultado de cada pergunta na sessão
    let participantName = ''; // Variável para armazenar o nome do participante

    const HISTORY_STORAGE_KEY = 'quizHistory'; // Chave para armazenar o histórico no localStorage
    const PROGRESS_STORAGE_KEY = 'quizProgress'; // Chave para o progresso do usuário no localStorage

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
        // Após jogar novamente, volta para a seleção de categorias
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
            showScreen(levelSelectionScreen); // ALTERADO: Vai para a nova tela de seleção de nível
            levelCategoryTitle.textContent = button.querySelector('h3').textContent; // Atualiza o título da tela de nível

            loadLevelsForCategory(currentCategory); // Esta função criará os botões de nível
            feedbackMessageElement.textContent = '';
            stopTimer(); // Garante que nenhum temporizador esteja rodando ao selecionar nível
        });
    });

    function loadLevelsForCategory(category) {
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

        const userProgress = getProgress(); // Carrega o progresso do usuário

        levels.forEach((levelName, index) => {
            const levelButton = document.createElement('button');
            levelButton.classList.add('btn', 'level-btn');
            levelButton.dataset.level = levelName;
            levelButton.textContent = `Nível ${levelName.replace('level', '')}`;

            const levelNum = parseInt(levelName.replace('level', ''));
            const previousLevelName = `level${levelNum - 1}`;
            
            // Nível 1 está sempre disponível. Outros níveis são disponíveis se o anterior estiver 'completed'.
            // Para 'available', ele só pode ser jogado, mas não desbloqueia o próximo.
            const isPreviousLevelCompleted = userProgress[category] && userProgress[category][previousLevelName] === 'completed';
            const isCurrentLevelAvailable = userProgress[category] && userProgress[category][levelName] === 'available';
            const isCurrentLevelCompleted = userProgress[category] && userProgress[category][levelName] === 'completed';

            const isUnlocked = levelNum === 1 || isPreviousLevelCompleted || isCurrentLevelAvailable;

            if (!isUnlocked) {
                levelButton.classList.add('locked-level'); // Adiciona uma classe para estilos de bloqueado
                levelButton.disabled = true; // Desabilita o botão
                levelButton.textContent += ' 🔒'; // Adiciona um cadeado
            } else {
                if (isCurrentLevelCompleted) {
                    levelButton.textContent += ' ⭐'; // Estrela se completo
                } else {
                    levelButton.textContent += ' ✅'; // Check se apenas disponível (e não completo ainda)
                }
            }

            levelButton.addEventListener('click', () => {
                if (isUnlocked) { // Apenas permite o clique se estiver desbloqueado
                    currentLevel = levelName;
                    loadQuiz(currentCategory, currentLevel); // Carrega o quiz e vai para a tela de perguntas
                }
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

            showScreen(questionScreen); // ALTERADO: Vai para a tela de perguntas
            // Atualiza o título da tela de perguntas com Categoria e Nível
            questionCategoryLevelTitle.textContent = `${levelCategoryTitle.textContent} - Nível ${level.replace('level', '')}`;


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

    // --- Função de Exibição de Resultados Detalhada e Lógica de Desbloqueio ---
    function showResult() {
        stopTimer();

        // Calcular a porcentagem de acertos
        const percentageCorrect = (score / quizQuestions.length) * 100;
        let unlockedNextLevel = false; // Flag para saber se um novo nível foi desbloqueado

        // Salvar o resultado no histórico (isso acontece sempre, independentemente da % de acerto)
        saveQuizResult(currentCategory, currentLevel, score, quizQuestions.length, sessionResults);

        // Lógica para desbloquear o próximo nível se a porcentagem for atingida
        if (percentageCorrect >= UNLOCK_PERCENTAGE) {
            // Marca o nível atual como COMPLETED (concluído com sucesso)
            saveProgress(currentCategory, currentLevel, 'completed');
            console.log(`Nível ${currentLevel} da categoria ${currentCategory} concluído com ${percentageCorrect.toFixed(2)}% de acerto. Progresso salvo como 'completed'.`);

            const nextLevelNum = parseInt(currentLevel.replace('level', '')) + 1;
            const nextLevelName = `level${nextLevelNum}`;

            // Verifica se o próximo nível existe nesta categoria
            if (quizData[currentCategory] && quizData[currentCategory][nextLevelName]) {
                // Marca o próximo nível como 'available' (disponível), se ainda não for 'completed'
                // Isto permite que ele seja jogado.
                saveProgress(currentCategory, nextLevelName, 'available');
                unlockedNextLevel = true;
                console.log(`Nível ${nextLevelName} da categoria ${currentCategory} desbloqueado como 'available'!`);
            }
        } else {
            // Se a porcentagem não foi atingida, o nível atual não é marcado como 'completed',
            // mas permanece com o status que tinha (ex: 'available' ou 'unlocked').
            console.log(`Nível ${currentLevel} da categoria ${currentCategory} concluído com ${percentageCorrect.toFixed(2)}% de acerto. Próximo nível não desbloqueado.`);
        }


        // NOVO FLUXO: Redirecionamento e Pop-ups com base no resultado
        if (unlockedNextLevel) {
            // Se desbloqueou um nível, mostra pop-up de sucesso e volta para a seleção de níveis
            alert(`Parabéns! Você desbloqueou o Nível ${parseInt(currentLevel.replace('level', '')) + 1} com ${percentageCorrect.toFixed(2)}% de acertos! 🎉`);
            showScreen(levelSelectionScreen); // Volta para a tela de seleção de níveis
            levelCategoryTitle.textContent = `${levelCategoryTitle.textContent.split(' - ')[0]}`; // Reseta o título para só a categoria
            loadLevelsForCategory(currentCategory); // Recarrega os botões de nível para mostrar o desbloqueado
        } else {
            // Se NÃO desbloqueou um nível, mostra pop-up de insuficiência e volta para a seleção de níveis
            let message = '';
            if (score === 0) {
                 message = `Oops! Você não acertou nenhuma pergunta neste nível. Tente novamente! 😔`;
            } else if (percentageCorrect < UNLOCK_PERCENTAGE) {
                message = `Você acertou ${percentageCorrect.toFixed(2)}% das perguntas. Para desbloquear o próximo nível, você precisa de ${UNLOCK_PERCENTAGE}% de acertos. Continue praticando! 💪`;
            } else {
                // Este caso seria para quando a porcentagem é alta, mas não desbloqueia porque não há próximo nível.
                // Isso pode acontecer se o jogador já completou todos os níveis da categoria.
                message = `Você concluiu o nível com ${percentageCorrect.toFixed(2)}% de acertos. Muito bem! Não há mais níveis para desbloquear nesta categoria. 👍`;
            }

            alert(message); // Exibe o pop-up com a mensagem apropriada
            showScreen(levelSelectionScreen); // Volta para a tela de seleção de níveis
            levelCategoryTitle.textContent = `${levelCategoryTitle.textContent.split(' - ')[0]}`; // Reseta o título
            loadLevelsForCategory(currentCategory); // Recarrega os botões de nível
        }

        // A seção que exibia detalhes do quiz na resultScreen foi removida aqui,
        // pois o quiz agora sempre retorna para a tela de seleção de níveis após o pop-up.
        // Se desejar ter a tela de resultados detalhada APÓS o pop-up, o fluxo precisaria ser repensado.
        // Por enquanto, o pop-up serve como o feedback principal.
    }

    // --- Funções para Salvar e Exibir Histórico e Progresso ---
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
            localStorage.removeItem(PROGRESS_STORAGE_KEY); // Limpa também o progresso ao limpar o histórico
            displayHistory(); // Atualiza a exibição para mostrar que está vazio
            alert("Histórico de quizzes e progresso limpos com sucesso!");
        }
    });

    // Funções para salvar e obter progresso de níveis
    // status pode ser 'available' (desbloqueado/pode ser jogado) ou 'completed' (jogou e atingiu 80%+)
    function saveProgress(category, level, status = 'available') {
        let progress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');

        if (!progress[category]) {
            progress[category] = {};
        }

        // Atualiza o status apenas se o novo status for 'completed' ou se o status atual não for 'completed'.
        // Isso evita que um nível que já está marcado como 'completed' seja rebaixado para 'available'.
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
                            // Após carregar um novo XML, pode ser bom redefinir o progresso para evitar inconsistências
                            // localStorage.removeItem(PROGRESS_STORAGE_KEY); // Opcional, depende do que você quer
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

        // 1. Verifica erros de parsing XML (sintaxe básica)
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
            // Opcional: Você pode adicionar um atributo 'displayName' para o nome da categoria na UI
            // const displayName = categoryNode.getAttribute('displayName') || categoryName.replace('Mode', ' Modo').replace(/([A-Z])/g, ' $1').trim().replace('General Culture', 'Cultura Geral');
            parsedData[categoryName] = {};

            const levels = categoryNode.getElementsByTagName('level');
            if (levels.length === 0) {
                console.warn(`Aviso: Nenhuma tag <level> encontrada para a categoria '${categoryName}'.`);
                continue; // Permite categoria sem níveis, mas com aviso
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
                    continue; // Permite nível sem perguntas, mas com aviso
                }

                for (const questionNode of questions) {
                    const questionTextNode = questionNode.getElementsByTagName('text')[0];
                    const questionText = questionTextNode ? questionTextNode.textContent?.trim() : '';

                    if (!questionText) {
                         throw new Error(`Erro de validação: Uma pergunta no nível '${levelName}' da categoria '${categoryName}' não possui texto.`);
                    }

                    const options = [];
                    const optionNodes = questionNode.getElementsByTagName('option');
                    if (optionNodes.length < 2) { // Validação: Mínimo de 2 opções
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

            // Validação básica do XML de boas-vindas
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Erro de sintaxe no XML de boas-vindas. Verifique a estrutura.");
            }

            const welcomeInfoNode = xmlDoc.getElementsByTagName('welcomeInfo')[0];
            if (!welcomeInfoNode) throw new Error("Tag <welcomeInfo> não encontrada no XML de boas-vindas.");

            // Preencher logo
            const logoNode = welcomeInfoNode.getElementsByTagName('logo')[0];
            if (logoNode) {
                welcomeLogo.src = logoNode.getAttribute('src') || '';
                welcomeLogo.alt = logoNode.getAttribute('alt') || '';
                if (!welcomeLogo.src) { // Validação se o src do logo está vazio
                    console.warn("Aviso: O atributo 'src' da tag <logo> no welcome_info.xml está vazio.");
                }
            } else {
                console.warn("Aviso: Tag <logo> não encontrada no XML de boas-vindas.");
            }


            // Preencher título e descrição principal (validação de conteúdo vazio)
            welcomeTitle.textContent = welcomeInfoNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
            if (!welcomeTitle.textContent) console.warn("Aviso: Título principal vazio no welcome_info.xml.");

            welcomeDescription.textContent = welcomeInfoNode.getElementsByTagName('description')[0]?.textContent?.trim() || '';
            if (!welcomeDescription.textContent) console.warn("Aviso: Descrição principal vazia no welcome_info.xml.");


            // Preencher Quem Somos
            const whoAreWeNode = welcomeInfoNode.getElementsByTagName('whoAreWe')[0];
            if (whoAreWeNode) {
                whoAreWeTitle.textContent = whoAreWeNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
                whoAreWeText.textContent = whoAreWeNode.getElementsByTagName('text')[0]?.textContent?.trim() || '';
                if (!whoAreWeTitle.textContent || !whoAreWeText.textContent) console.warn("Aviso: Seção 'Quem Somos' incompleta no welcome_info.xml.");
            } else {
                console.warn("Aviso: Seção 'Quem Somos' não encontrada no welcome_info.xml.");
            }


            // Preencher Localização
            const locationNode = welcomeInfoNode.getElementsByTagName('location')[0];
            if (locationNode) {
                locationTitle.textContent = locationNode.getElementsByTagName('title')[0]?.textContent?.trim() || '';
                locationText.textContent = locationNode.getElementsByTagName('text')[0]?.textContent?.trim() || '';
                if (!locationTitle.textContent || !locationText.textContent) console.warn("Aviso: Seção 'Localização' incompleta no welcome_info.xml.");
            } else {
                console.warn("Aviso: Seção 'Localização' não encontrada no welcome_info.xml.");
            }


            // Preencher Contactos
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
                    contactEmail.textContent = 'Não informado'; // Ou remova o elemento se preferir
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
            // Poderíamos exibir uma mensagem na tela inicial para o usuário aqui.
        }
    }

    // --- Chamadas Iniciais ao carregar a página ---
    loadWelcomeInfo(); // Carrega as informações da tela de boas-vindas ao iniciar

});