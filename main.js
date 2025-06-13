// Configurações avançadas
const PASSWORD_CONFIG = {
    maxLength: 64,
    minLength: 4,
    defaultLength: 12,
    characterSets: {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    },
    strengthLevels: [
        { name: "Muito Fraca", threshold: 0, class: "very-weak", color: "#ff4d4d" },
        { name: "Fraca", threshold: 35, class: "weak", color: "#ff8c1a" },
        { name: "Moderada", threshold: 57, class: "medium", color: "#ffcc00" },
        { name: "Forte", threshold: 80, class: "strong", color: "#66cc33" },
        { name: "Muito Forte", threshold: 120, class: "very-strong", color: "#339900" }
    ]
};

// Elementos do DOM
const DOM = {
    passwordOutput: document.getElementById('password-output'),
    copyBtn: document.getElementById('copy-btn'),
    refreshBtn: document.getElementById('refresh-btn'),
    generateBtn: document.getElementById('generate-btn'),
    lengthInput: document.getElementById('password-length'),
    decrementBtn: document.getElementById('decrement-length'),
    incrementBtn: document.getElementById('increment-length'),
    strengthBar: document.getElementById('strength-bar'),
    strengthLabel: document.getElementById('strength-label'),
    entropyValue: document.getElementById('entropy-value'),
    uppercaseCheck: document.getElementById('uppercase'),
    lowercaseCheck: document.getElementById('lowercase'),
    numbersCheck: document.getElementById('numbers'),
    symbolsCheck: document.getElementById('symbols'),
    themeToggle: document.getElementById('theme-toggle')
};

// Estado da aplicação
let state = {
    password: "",
    length: PASSWORD_CONFIG.defaultLength,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: false,
    strength: 0,
    entropy: 0
};

// Inicialização
function init() {
    setupEventListeners();
    updatePasswordLength();
    generatePassword();
}

// Configura eventos
function setupEventListeners() {
    DOM.generateBtn.addEventListener('click', generatePassword);
    DOM.copyBtn.addEventListener('click', copyToClipboard);
    DOM.refreshBtn.addEventListener('click', generatePassword);
    DOM.lengthInput.addEventListener('change', handleLengthChange);
    DOM.decrementBtn.addEventListener('click', () => changeLength(-1));
    DOM.incrementBtn.addEventListener('click', () => changeLength(1));
    DOM.uppercaseCheck.addEventListener('change', updateCharacterSettings);
    DOM.lowercaseCheck.addEventListener('change', updateCharacterSettings);
    DOM.numbersCheck.addEventListener('change', updateCharacterSettings);
    DOM.symbolsCheck.addEventListener('change', updateCharacterSettings);
    DOM.themeToggle.addEventListener('click', toggleTheme);
}

// Gera senha segura usando Web Crypto API quando disponível
async function generatePassword() {
    const characterPool = getCharacterPool();
    
    if (characterPool.length === 0) {
        DOM.passwordOutput.value = "Selecione ao menos um tipo";
        updateStrengthIndicator(0);
        return;
    }

    try {
        // Usa Web Crypto API para maior segurança
        if (window.crypto && window.crypto.getRandomValues) {
            const randomValues = new Uint32Array(state.length);
            window.crypto.getRandomValues(randomValues);
            
            state.password = Array.from(randomValues)
                .map(value => characterPool[value % characterPool.length])
                .join('');
        } else {
            // Fallback para Math.random se Web Crypto não estiver disponível
            state.password = Array.from({length: state.length})
                .map(() => characterPool[Math.floor(Math.random() * characterPool.length)])
                .join('');
        }

        DOM.passwordOutput.value = state.password;
        analyzePasswordStrength(characterPool.length);
        animatePasswordGeneration();
    } catch (error) {
        console.error("Erro na geração da senha:", error);
        DOM.passwordOutput.value = "Erro ao gerar senha";
    }
}

// Obtém pool de caracteres baseado nas seleções
function getCharacterPool() {
    let pool = '';
    if (state.useUppercase) pool += PASSWORD_CONFIG.characterSets.uppercase;
    if (state.useLowercase) pool += PASSWORD_CONFIG.characterSets.lowercase;
    if (state.useNumbers) pool += PASSWORD_CONFIG.characterSets.numbers;
    if (state.useSymbols) pool += PASSWORD_CONFIG.characterSets.symbols;
    return pool;
}

// Atualiza configurações de caracteres
function updateCharacterSettings() {
    state.useUppercase = DOM.uppercaseCheck.checked;
    state.useLowercase = DOM.lowercaseCheck.checked;
    state.useNumbers = DOM.numbersCheck.checked;
    state.useSymbols = DOM.symbolsCheck.checked;
    generatePassword();
}

// Manipula mudança no tamanho
function handleLengthChange(e) {
    const newLength = parseInt(e.target.value);
    if (!isNaN(newLength)) {
        state.length = Math.max(PASSWORD_CONFIG.minLength, 
                               Math.min(PASSWORD_CONFIG.maxLength, newLength));
        DOM.lengthInput.value = state.length;
        generatePassword();
    }
}

// Altera tamanho incrementalmente
function changeLength(step) {
    state.length = Math.max(PASSWORD_CONFIG.minLength, 
                          Math.min(PASSWORD_CONFIG.maxLength, state.length + step));
    updatePasswordLength();
    generatePassword();
}

// Atualiza display do tamanho
function updatePasswordLength() {
    DOM.lengthInput.value = state.length;
}

// Analisa força da senha
function analyzePasswordStrength(poolSize) {
    state.entropy = state.length * Math.log2(poolSize);
    state.strength = calculateStrengthScore(state.entropy);
    updateStrengthIndicator(state.entropy);
}

// Calcula score de força baseado em entropia
function calculateStrengthScore(entropy) {
    return Math.min(100, Math.floor(entropy * 100 / 128)); // Normaliza para 0-100
}

// Atualiza indicador visual de força
function updateStrengthIndicator(entropy) {
    const level = PASSWORD_CONFIG.strengthLevels.findLast(
        l => entropy >= l.threshold
    ) || PASSWORD_CONFIG.strengthLevels[0];

    DOM.strengthBar.style.width = `${state.strength}%`;
    DOM.strengthBar.style.backgroundColor = level.color;
    DOM.strengthLabel.textContent = `Força: ${level.name}`;
    
    // Calcula tempo estimado para quebrar a senha
    const timeToCrack = estimateCrackTime(entropy);
    DOM.entropyValue.textContent = `Segurança: ~${timeToCrack}`;
}

// Estima tempo para quebrar a senha
function estimateCrackTime(entropy) {
    const guessesPerSecond = 1e9; // 1 bilhão de tentativas/segundo
    const seconds = Math.pow(2, entropy) / guessesPerSecond;
    
    if (seconds < 60) return "segundos";
    if (seconds < 3600) return `${Math.ceil(seconds/60)} minutos`;
    if (seconds < 86400) return `${Math.ceil(seconds/3600)} horas`;
    if (seconds < 31536000) return `${Math.ceil(seconds/86400)} dias`;
    return `${Math.ceil(seconds/31536000)} anos`;
}

// Copia para área de transferência
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(state.password);
        DOM.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            DOM.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        }, 2000);
    } catch (err) {
        console.error('Falha ao copiar:', err);
    }
}

// Animação ao gerar senha
function animatePasswordGeneration() {
    DOM.passwordOutput.style.transform = "scale(1.05)";
    DOM.passwordOutput.style.transition = "transform 0.2s";
    setTimeout(() => {
        DOM.passwordOutput.style.transform = "scale(1)";
    }, 200);
}

// Alterna tema claro/escuro
function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    DOM.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);
