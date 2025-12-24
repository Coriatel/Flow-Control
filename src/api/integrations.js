// Local API Integrations - replaces @base44/sdk integrations
// These integrations communicate with our local Express backend

import { apiClient } from './client';

// File Upload Integration
export const UploadFile = async (params) => {
  const formData = new FormData();

  if (params.file) {
    formData.append('file', params.file);
  }

  if (params.metadata) {
    formData.append('metadata', JSON.stringify(params.metadata));
  }

  return apiClient.post('/files/upload', formData);
};

// Create File Signed URL
export const CreateFileSignedUrl = async (params) => {
  return apiClient.post('/files/signed-url', params);
};

// Upload Private File
export const UploadPrivateFile = async (params) => {
  const formData = new FormData();

  if (params.file) {
    formData.append('file', params.file);
  }

  if (params.metadata) {
    formData.append('metadata', JSON.stringify(params.metadata));
  }

  return apiClient.post('/files/upload-private', formData);
};

// Extract Data from Uploaded File
export const ExtractDataFromUploadedFile = async (params) => {
  return apiClient.post('/files/extract-data', params);
};

// Send Email Integration (will use backend SMTP)
export const SendEmail = async (params) => {
  return apiClient.post('/integrations/send-email', params);
};

// LLM Integration (optional - for AI features)
export const InvokeLLM = async (params) => {
  return apiClient.post('/integrations/invoke-llm', params);
};

// Image Generation (optional)
export const GenerateImage = async (params) => {
  return apiClient.post('/integrations/generate-image', params);
};

// Core integration object (for backwards compatibility)
export const Core = {
  UploadFile,
  CreateFileSignedUrl,
  UploadPrivateFile,
  ExtractDataFromUploadedFile,
  SendEmail,
  InvokeLLM,
  GenerateImage
};
