// Variáveis globais
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let vehicles = [];

// Elementos DOM
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const loadingSpinner = document.getElementById('loading-spinner');

// Botões e controles
const startQuizBtn = document.getElementById('start-quiz-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const restartBtn = document.getElementById('restart-btn');

// Elementos do quiz
const currentQuestionSpan = document.getElementById('current-question');
const totalQuestionsSpan = document.getElementById('total-questions');
const questionText = document.getElementById('question-text');
const vehiclesOptions = document.getElementById('vehicles-options');
const progressFill = document.getElementById('progress-fill');

// Elementos dos resultados
const finalScore = document.getElementById('final-score');
const correctCount = document.getElementById('correct-count');
const incorrectCount = document.getElementById('incorrect-count');
const motivationalMessage = document.getElementById('motivational-message');
const detailedResults = document.getElementById('detailed-results');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
startQuizBtn.addEventListener('click', loadQuizData);
prevBtn.addEventListener('click', previousQuestion);
nextBtn.addEventListener('click', nextQuestion);
finishBtn.addEventListener('click', showResults);
restartBtn.addEventListener('click', restartQuiz); // Removida a necessidade de senha

// Inicialização da aplicação
function initializeApp() {
    showScreen('welcome-screen');
    console.log('Aplicação inicializada');
}

// Carregar dados do quiz do arquivo Excel
async function loadQuizData() {
    try {
        showLoading(true);
        
        const response = await fetch('assets/gabarito_v04.xlsx');
        if (!response.ok) {
            throw new Error('Erro ao carregar arquivo Excel');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        parseQuizData(data);
        initializeQuiz();
        
    } catch (error) {
        console.error('Erro ao carregar quiz:', error);
        alert('Erro ao carregar o quiz. Verifique se o arquivo gabarito.xlsx está presente na pasta assets.');
        showLoading(false);
    }
}

// Processar dados do Excel
function parseQuizData(data) {
    if (data.length < 2) {
        throw new Error('Arquivo Excel deve ter pelo menos 2 linhas (cabeçalho e dados)');
    }
    
    const headers = data[0];
    vehicles = headers.slice(1); // Remove a primeira coluna (Pergunta)
    
    quizData = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) { // Verifica se há uma pergunta
            const question = {
                text: row[0],
                correctAnswers: []
            };
            
            // Verifica quais veículos têm 'x' para esta pergunta
            for (let j = 1; j < row.length && j < headers.length; j++) {
                if (row[j] && row[j].toString().toLowerCase() === 'x') {
                    question.correctAnswers.push(vehicles[j - 1]);
                }
            }
            
            quizData.push(question);
        }
    }
    
    console.log('Quiz carregado:', quizData);
    console.log('Veículos:', vehicles);
}

// Inicializar quiz
function initializeQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(quizData.length).fill(null).map(() => []);
    
    totalQuestionsSpan.textContent = quizData.length;
    
    showLoading(false);
    setTimeout(() => {
        showScreen('quiz-screen');
        displayQuestion();
    }, 100);
}

// Exibir pergunta atual
function displayQuestion() {
    const question = quizData[currentQuestionIndex];
    
    // Atualizar informações da pergunta
    questionText.textContent = question.text;
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    
    // Atualizar barra de progresso
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Criar opções de veículos
    vehiclesOptions.innerHTML = '';
    vehicles.forEach((vehicle, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'vehicle-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `vehicle-${index}`;
        checkbox.value = vehicle;
        checkbox.checked = userAnswers[currentQuestionIndex].includes(vehicle);
        
        const label = document.createElement('label');
        label.htmlFor = `vehicle-${index}`;
        label.textContent = vehicle;
        
        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        
        // Event listener para clicar na div (toda a área clicável)
        optionDiv.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            handleVehicleSelection({ target: checkbox });
        });
        
        vehiclesOptions.appendChild(optionDiv);
        
        // Aplicar classe selected se marcado
        if (checkbox.checked) {
            optionDiv.classList.add('selected');
        }
    });
    
    // Atualizar botões de navegação
    updateNavigationButtons();
}

// Manipular seleção de veículos
function handleVehicleSelection(event) {
    const checkbox = event.target;
    const vehicle = checkbox.value;
    const optionDiv = checkbox.closest('.vehicle-option');
    
    if (checkbox.checked) {
        if (!userAnswers[currentQuestionIndex].includes(vehicle)) {
            userAnswers[currentQuestionIndex].push(vehicle);
        }
        optionDiv.classList.add('selected');
    } else {
        userAnswers[currentQuestionIndex] = userAnswers[currentQuestionIndex].filter(v => v !== vehicle);
        optionDiv.classList.remove('selected');
    }
    
    console.log('Resposta atual:', userAnswers[currentQuestionIndex]);
}

// Atualizar botões de navegação
function updateNavigationButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        finishBtn.style.display = 'none';
    }
}

// Navegar para pergunta anterior
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Navegar para próxima pergunta
function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// Calcular resultados (sem penalização por erros)
function calculateResults() {
    let correctAnswers = 0;
    let totalPossibleCorrect = 0;
    
    const results = quizData.map((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correctAnswers;
        
        // Calcular acertos e erros para esta pergunta
        const correctSelections = userAnswer.filter(vehicle => correctAnswer.includes(vehicle));
        const incorrectSelections = userAnswer.filter(vehicle => !correctAnswer.includes(vehicle));
        const missedSelections = correctAnswer.filter(vehicle => !userAnswer.includes(vehicle));
        
        // Pontuação simplificada: apenas 1 ponto para cada seleção correta, 0 para erros
        const questionScore = correctSelections.length;
        const maxQuestionScore = correctAnswer.length;
        
        correctAnswers += questionScore;
        totalPossibleCorrect += maxQuestionScore;
        
        return {
            question: question.text,
            userAnswer,
            correctAnswer,
            correctSelections,
            incorrectSelections,
            missedSelections,
            score: questionScore,
            maxScore: maxQuestionScore
        };
    });
    
    const finalScorePercentage = totalPossibleCorrect > 0 ? Math.round((correctAnswers / totalPossibleCorrect) * 100) : 0;
    
    return {
        results,
        finalScore: finalScorePercentage,
        correctAnswers,
        totalPossible: totalPossibleCorrect
    };
}

// Exibir resultados
function showResults() {
    const calculatedResults = calculateResults();
    
    // Atualizar pontuação final
    finalScore.textContent = `${calculatedResults.finalScore}%`;
    correctCount.textContent = calculatedResults.correctAnswers;
    incorrectCount.textContent = calculatedResults.totalPossible - calculatedResults.correctAnswers;
    
    // Mensagem motivacional
    const motivationalMessages = {
        excellent: "Excelente desempenho! Você domina o comparativo do Onix!",
        good: "Bom trabalho! Continue estudando para melhorar ainda mais!",
        average: "Desempenho razoável. Há espaço para melhorias!",
        poor: "Tente novamente! Estude mais sobre o novo Onix."
    };
    
    let messageKey = 'poor';
    if (calculatedResults.finalScore >= 90) messageKey = 'excellent';
    else if (calculatedResults.finalScore >= 70) messageKey = 'good';
    else if (calculatedResults.finalScore >= 50) messageKey = 'average';
    
    motivationalMessage.textContent = motivationalMessages[messageKey];
    
    // Resultados detalhados
    detailedResults.innerHTML = '';
    calculatedResults.results.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'result-question';
        questionDiv.textContent = `${index + 1}. ${result.question}`;
        
        const answersDiv = document.createElement('div');
        answersDiv.className = 'result-answers';
        
        // Respostas corretas
        result.correctSelections.forEach(vehicle => {
            const span = document.createElement('span');
            span.className = 'result-answer correct';
            span.textContent = `✓ ${vehicle}`;
            answersDiv.appendChild(span);
        });
        
        // Respostas incorretas
        result.incorrectSelections.forEach(vehicle => {
            const span = document.createElement('span');
            span.className = 'result-answer incorrect';
            span.textContent = `✗ ${vehicle}`;
            answersDiv.appendChild(span);
        });
        
        // Respostas perdidas
        result.missedSelections.forEach(vehicle => {
            const span = document.createElement('span');
            span.className = 'result-answer missed';
            span.textContent = `? ${vehicle}`;
            answersDiv.appendChild(span);
        });
        
        resultDiv.appendChild(questionDiv);
        resultDiv.appendChild(answersDiv);
        detailedResults.appendChild(resultDiv);
    });
    
    showScreen('results-screen');
}

// Reiniciar quiz (sem necessidade de senha)
function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    quizData = [];
    vehicles = [];
    
    showScreen('welcome-screen');
}

// Controle de telas
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
}

// Controle de loading
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.add('active');
    } else {
        loadingSpinner.classList.remove('active');
    }
}

// Prevenir envio de formulário padrão
document.addEventListener('submit', function(event) {
    event.preventDefault();
});

// Função de debug (pode ser removida em produção)
function debugQuiz() {
    console.log('Quiz Data:', quizData);
    console.log('User Answers:', userAnswers);
    console.log('Current Question:', currentQuestionIndex);
    console.log('Vehicles:', vehicles);
}

// Disponibilizar função de debug globalmente
window.debugQuiz = debugQuiz;