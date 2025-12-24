/**
 * Flow Control - Integrations
 * מחליף את base44.integrations
 */

import api from './client.js';

// ============================================================================
// File Operations
// ============================================================================

export async function UploadFile(file, options = {}) {
  return api.upload('/files/upload', file, options);
}

export async function UploadPrivateFile(file, options = {}) {
  return api.upload('/files/upload-private', file, options);
}

export async function CreateFileSignedUrl(fileId, expiresIn = 3600) {
  return api.post('/files/signed-url', { fileId, expiresIn });
}

export async function ExtractDataFromUploadedFile(fileId, options = {}) {
  return api.post('/files/extract', { fileId, ...options });
}

// ============================================================================
// Communication
// ============================================================================

export async function SendEmail(to, subject, body, options = {}) {
  return api.post('/notifications/email', {
    to,
    subject,
    body,
    ...options,
  });
}

// ============================================================================
// AI / LLM (placeholder - can be implemented later)
// ============================================================================

export async function InvokeLLM(prompt, options = {}) {
  return api.post('/ai/invoke', { prompt, ...options });
}

export async function GenerateImage(prompt, options = {}) {
  return api.post('/ai/generate-image', { prompt, ...options });
}

// ============================================================================
// Core namespace (for compatibility)
// ============================================================================

export const Core = {
  UploadFile,
  UploadPrivateFile,
  CreateFileSignedUrl,
  ExtractDataFromUploadedFile,
  SendEmail,
  InvokeLLM,
  GenerateImage,
};

export default Core;
