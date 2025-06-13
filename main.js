/**
 * VAULTGEN PRO - Gerador de Senhas Criptográficas
 * Versão: 2.0
 * Autor: Seu Nome
 * Licença: MIT
 */

// ===== MÓDULO PRINCIPAL =====
const VaultGen = (() => {
  // Configurações
  const CONFIG = {
    characterSets: {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    },
    strengthLevels: [
      { name: "Muito Fraca", threshold: 0, class: "very-weak" },
      { name: "Fraca", threshold: 35, class: "weak" },
      { name: "Moderada", threshold: 57, class: "medium" },
      { name: "Forte", threshold: 80, class: "strong" },
      { name: "Muito Forte", threshold: 120, class: "very-strong" }
    ],
    defaults: {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false
    },
    crackSpeed: 1e12 // 1 trilhão de tentativas/segundo
  };

  // Estado da aplicação
  const state = {
    password: "",
    length: CONFIG.defaults.length,
    useUppercase: CONFIG.defaults.uppercase,
    useLowercase: CONFIG.defaults.lowercase,
    useNumbers: CONFIG.defaults.numbers,
    useSymbols: CONFIG.defaults.symbols,
    strength: 0,
    entropy: 0,
    lastGenerated: null
  };

  // Elementos DOM
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

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Gera um caractere aleatório seguro do pool fornecido
   * @param {string} pool - Conjunto de caracteres disponíveis
   * @returns {string} Caractere aleatório
   */
  const _generateSecureChar = (pool) => {
    if (window.crypto && window.crypto.getRandomValues) {
      const randomValues = new Uint32Array(1);
      window.crypto.getRandomValues(randomValues);
      return pool[randomValues[0] % pool.length];
    } else {
      // Fallback para Math.random (menos seguro)
      return pool[Math.floor(Math.random() * pool.length)];
    }
  };

  /**
   * Calcula a força da senha baseada na entropia
   * @param {number} entropy - Valor de entropia da senha
   * @returns {object} Objeto com nível de força e porcentagem
   */
  const _calculateStrength = (entropy) => {
    const level = CONFIG.strengthLevels.findLast(
      l => entropy >= l.threshold
    ) || CONFIG.strengthLevels[0];
    
    const percentage = Math.min(100, Math.floor(entropy * 100 / 128));
    
    return { level, percentage };
  };

  /**
   * Estima o tempo necessário para quebrar a senha
   * @param {number} entropy - Valor de entropia da senha
   * @returns {string} Tempo estimado formatado
   */
  const _estimateCrackTime = (entropy) => {
    const seconds = Math.pow(2, entropy) / CONFIG.crackSpeed;
    
    if (seconds < 60) return `${Math.ceil(seconds)} segundos`;
    if (seconds < 3600) return `${Math.ceil(seconds/60)} minutos`;
    if (seconds < 86400) return `${Math.ceil(seconds/3600)} horas`;
    if (seconds < 31536000) return `${Math.ceil(seconds/86400)} dias`;
    if (seconds < 3153600000) return `${Math.ceil(seconds/31536000)} anos`;
    return `${Math.floor(seconds/3153600000)} milênios`;
  };

  /**
   * Atualiza a interface com os dados do estado atual
   */
  const _updateUI = () => {
    // Atualiza a senha
    DOM.passwordOutput.value = state.password;
    
    // Atualiza a força
    const { level, percentage } = _calculateStrength(state.entropy);
    DOM.strengthBar.className = "strength-bar " + level.class;
    DOM.strengthBar.style.width = `${percentage}%`;
    DOM.strengthLabel.textContent = level.name;
    DOM.entropyValue.textContent = _estimateCrackTime(state.entropy);
    
    // Atualiza controles
    DOM.lengthInput.value = state.length;
    DOM.uppercaseCheck.checked = state.useUppercase;
    DOM.lowercaseCheck.checked = state.useLowercase;
    DOM.numbersCheck.checked = state.useNumbers;
    DOM.symbolsCheck.checked = state.useSymbols;
  };

  /**
   * Animação ao gerar senha
   */
  const _animateGeneration = () => {
    // Efeito de digitação
    let tempPassword = "";
    const chars = state.password.split("");
    
    chars.forEach((char, i) => {
      setTimeout(() => {
        tempPassword += char;
        DOM.passwordOutput.value = tempPassword;
        
        // Efeito final
        if (i === chars.length - 1) {
          DOM.passwordOutput.style.transform = "scale(1.05)";
          setTimeout(() => {
            DOM.passwordOutput.style.transform = "scale(1)";
          }, 200);
        }
      }, i * 50);
    });
  };

  // ===== MÉTODOS PÚBLICOS =====
  return {
    /**
     * Inicializa a aplicação
     */
    init() {
      this._setupEventListeners();
      this.generatePassword();
      _updateUI();
    },

    /**
     * Configura os event listeners
     */
    _setupEventListeners() {
      // Geração de senha
      DOM.generateBtn.addEventListener('click', () => this.generatePassword());
      DOM.refreshBtn.addEventListener('click', () => this.generatePassword());
      
      // Controles
      DOM.lengthInput.addEventListener('input', (e) => {
        const newLength = parseInt(e.target.value);
        if (!isNaN(newLength)) {
          this.setLength(newLength);
        }
      });
      
      DOM.decrementBtn.addEventListener('click', () => this.setLength(state.length - 1));
      DOM.incrementBtn.addEventListener('click', () => this.setLength(state.length + 1));
      
      // Configurações de caracteres
      DOM.uppercaseCheck.addEventListener('change', (e) => {
        this.setCharacterSetting('uppercase', e.target.checked);
      });
      
      DOM.lowercaseCheck.addEventListener('change', (e) => {
        this.setCharacterSetting('lowercase', e.target.checked);
      });
      
      DOM.numbersCheck.addEventListener('change', (e) => {
        this.setCharacterSetting('numbers', e.target.checked);
      });
      
      DOM.symbolsCheck.addEventListener('change', (e) => {
        this.setCharacterSetting('symbols', e.target.checked);
      });
      
      // Copiar para área de transferência
      DOM.copyBtn.addEventListener('click', () => this.copyToClipboard());
      
      // Alternar tema
      DOM.themeToggle.addEventListener('click', () => this.toggleTheme());
    },

    /**
     * Gera uma nova senha segura
     */
    generatePassword() {
      // Verifica se há caracteres selecionados
      const pool = this.getCharacterPool();
      if (pool.length === 0) {
        DOM.passwordOutput.value = "Selecione ao menos um tipo";
        state.strength = 0;
        state.entropy = 0;
        _updateUI();
        return;
      }
      
      // Efeito de loading
      DOM.passwordOutput.value = "Gerando...";
      DOM.passwordOutput.style.letterSpacing = "1px";
      
      // Gera senha de forma assíncrona para não bloquear a UI
      setTimeout(() => {
        try {
          state.password = Array.from({length: state.length})
            .map(() => _generateSecureChar(pool))
            .join('');
          
          // Calcula entropia
          state.entropy = state.length * Math.log2(pool.length);
          
          // Atualiza UI e animações
          _updateUI();
          _animateGeneration();
          
          // Registra hora da geração
          state.lastGenerated = new Date();
        } catch (error) {
          console.error("Erro na geração:", error);
          DOM.passwordOutput.value = "Erro ao gerar";
          state.strength = 0;
          state.entropy = 0;
          _updateUI();
        }
      }, 100);
    },

    /**
     * Define o comprimento da senha
     * @param {number} length - Novo comprimento (4-64)
     */
    setLength(length) {
      state.length = Math.max(4, Math.min(64, length));
      _updateUI();
      this.generatePassword();
    },

    /**
     * Define as configurações de caracteres
     * @param {string} type - Tipo de caractere (uppercase, lowercase, etc)
     * @param {boolean} value - Valor booleano
     */
    setCharacterSetting(type, value) {
      if (type in state) {
        state[type] = value;
        
        // Garante que pelo menos um tipo esteja selecionado
        if (!state.useUppercase && !state.useLowercase && 
            !state.useNumbers && !state.useSymbols) {
          state[type] = true;
          _updateUI();
        }
        
        this.generatePassword();
      }
    },

    /**
     * Obtém o pool de caracteres ativo
     * @returns {string} Pool de caracteres concatenado
     */
    getCharacterPool() {
      let pool = '';
      if (state.useUppercase) pool += CONFIG.characterSets.uppercase;
      if (state.useLowercase) pool += CONFIG.characterSets.lowercase;
      if (state.useNumbers) pool += CONFIG.characterSets.numbers;
      if (state.useSymbols) pool += CONFIG.characterSets.symbols;
      return pool;
    },

    /**
     * Copia a senha para a área de transferência
     */
    async copyToClipboard() {
      if (!state.password) return;
      
      try {
        await navigator.clipboard.writeText(state.password);
        
        // Feedback visual
        DOM.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        DOM.copyBtn.style.backgroundColor = "#00b894";
        
        setTimeout(() => {
          DOM.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
          DOM.copyBtn.style.backgroundColor = "";
        }, 2000);
      } catch (err) {
        console.error('Falha ao copiar:', err);
        
        // Fallback para execCommand
        const textarea = document.createElement('textarea');
        textarea.value = state.password;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Feedback visual alternativo
        DOM.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          DOM.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      }
    },

    /**
     * Alterna entre temas claro/escuro
     */
    toggleTheme() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      
      // Atualiza ícone
      DOM.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      
      // Salva preferência
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    },

    /**
     * Carrega o tema salvo
     */
    loadTheme() {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      DOM.themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
  };
})();

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  VaultGen.loadTheme();
  VaultGen.init();
});
