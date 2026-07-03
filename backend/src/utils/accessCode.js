import { v4 as uuidv4 } from 'uuid';

// Characters allowed in access code (30 unambiguous characters)
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excluding O, I, L, 0, 1

export const generateAccessCode = () => {
  let code = 'PC';
  
  for (let i = 0; i < 12; i++) {
    if (i % 4 === 0 && i !== 0) {
      code += '-';
    }
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  
  return code;
};

export const formatAccessCode = (codeWithoutPrefix) => {
  let formatted = 'PC';
  for (let i = 0; i < codeWithoutPrefix.length; i++) {
    if (i % 4 === 0 && i !== 0) {
      formatted += '-';
    }
    formatted += codeWithoutPrefix[i];
  }
  return formatted;
};

export const validateAccessCode = (code) => {
  // Check format PC-XXXX-XXXX-XXXX
  const pattern = /^PC-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return pattern.test(code);
};
