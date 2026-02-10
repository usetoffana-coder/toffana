/**
 * Serviço de Criptografia
 * Protege dados sensíveis usando AES
 */

const CryptoService = {
  
  /**
   * Codifica dados (Base64)
   * @param {string} data 
   * @returns {string}
   */
  encrypt(data) {
    try {
      return this.encodeBase64(data);
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      return data;
    }
  },

  /**
   * Descriptografa dados
   * @param {string} encryptedData 
   * @returns {string}
   */
  decrypt(encryptedData) {
    try {
      return this.decodeBase64(encryptedData);
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      return encryptedData;
    }
  },

  /**
   * Base64 encode compatível com UTF-8
   * @param {string} data
   * @returns {string}
   */
  encodeBase64(data) {
    const bytes = new TextEncoder().encode(String(data ?? ''));
    let binary = '';
    bytes.forEach(b => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  },

  /**
   * Base64 decode compatível com UTF-8
   * @param {string} encoded
   * @returns {string}
   */
  decodeBase64(encoded) {
    const binary = atob(String(encoded ?? ''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  },

  /**
   * Hash de senha usando SHA-256 (básico)
   * Em produção, use bcrypt ou similar no backend
   * @param {string} password 
   * @returns {Promise<string>}
   */
  async hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  /**
   * Gera token aleatório
   * @param {number} length 
   * @returns {string}
   */
  generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Sanitiza entrada do usuário
   * @param {string} input 
   * @returns {string}
   */
  sanitizeInput(input) {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove eventos onclick, onload, etc
      .trim();
  },

  /**
   * Valida número de telefone
   * @param {string} phone 
   * @returns {boolean}
   */
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  /**
   * Valida email
   * @param {string} email 
   * @returns {boolean}
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
};

// Exportar
window.CryptoService = CryptoService;
