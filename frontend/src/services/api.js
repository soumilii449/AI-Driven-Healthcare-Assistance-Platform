import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// =====================================
// AUTH TOKEN INTERCEPTOR
// =====================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// =====================================
// AUTH
// =====================================

export async function registerUser(
  username,
  password,
  role
) {
  const response = await api.post(
    "/auth/register",
    {
      username,
      password,
      role,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}


export async function loginUser(
  username,
  password
) {
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}


export async function getCurrentUser() {
  const response = await api.get(
    "/auth/me"
  );

  return response.data;
}


// =====================================
// DOCUMENTS
// =====================================

export async function uploadDocument(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/documents",
    formData
  );

  return response.data;
}


export async function processDocument(
  documentId
) {
  const response = await api.post(
    `/documents/${documentId}/process`
  );

  return response.data;
}


export async function getDocument(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}`
  );

  return response.data;
}


export async function getDocuments() {
  const response = await api.get(
    "/documents"
  );

  return response.data;
}


// =====================================
// DOCUMENT STATUS
// =====================================

export async function getDocumentStatus(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/status`
  );

  return response.data;
}


// =====================================
// DOCUMENT RESULT
// =====================================

export async function getDocumentResult(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/result`
  );

  return response.data;
}


// =====================================
// OCR
// =====================================

export async function getDocumentOCR(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/ocr`
  );

  return response.data;
}


// =====================================
// MEDICATIONS
// =====================================

export async function getMedications(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/medications`
  );

  return response.data;
}

// Alias used by some frontend files
export async function getDocumentMedications(
  documentId
) {
  return getMedications(documentId);
}


// =====================================
// TREATMENT
// =====================================

export async function getTreatment(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/treatment`
  );

  return response.data;
}

// Alias used by some frontend files
export async function getDocumentTreatment(
  documentId
) {
  return getTreatment(documentId);
}


// =====================================
// TRANSLATION
// =====================================

export async function getTranslation(
  documentId
) {
  const response = await api.get(
    `/documents/${documentId}/translation`
  );

  return response.data;
}

// IMPORTANT:
// Translation.jsx expects this name
export async function getDocumentTranslation(
  documentId
) {
  return getTranslation(documentId);
}


// =====================================
// DELETE DOCUMENT
// =====================================

export async function deleteDocument(
  documentId
) {
  const response = await api.delete(
    `/documents/${documentId}`
  );

  return response.data;
}


// =====================================
// MEDICAL EXTRACTIONS
// =====================================

export async function getMedicalExtractions() {
  const response = await api.get(
    "/medical-extractions"
  );

  return response.data;
}


export async function getMedicalExtraction(
  extractionId
) {
  const response = await api.get(
    `/medical-extractions/${extractionId}`
  );

  return response.data;
}


// =====================================
// REPROCESS
// =====================================

export async function reprocessDocument(
  documentId
) {
  const response = await api.post(
    `/documents/${documentId}/reprocess`
  );

  return response.data;
}


// =====================================
// SEARCH
// =====================================

export async function searchDocuments(
  query
) {
  const response = await api.get(
    "/documents/search",
    {
      params: {
        query,
      },
    }
  );

  return response.data;
}


// =====================================
// EXPORT AXIOS INSTANCE
// =====================================

export default api;