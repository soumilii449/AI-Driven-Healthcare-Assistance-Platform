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

export async function getDocumentTranslation(
  documentId,
  lang = "hi"
) {
  const response = await api.get(
    `/documents/${documentId}/translation`,
    {
      params: { lang },
    }
  );

  return response.data;
}


// =====================================
// SPEECH
// =====================================

export async function getDocumentSpeech(
  documentId,
  lang = "hi"
) {
  const response = await api.get(
    `/documents/${documentId}/speech`,
    {
      params: { lang },
      responseType: "blob",
    }
  );

  return response.data;
}


// =====================================
// VOICE QUERY
// =====================================

export async function transcribeVoiceQuery(
  documentId,
  audioBlob,
  filename = "query.webm"
) {
  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    filename
  );

  const response = await api.post(
    `/documents/${documentId}/voice-query/transcribe`,
    formData
  );

  return response.data;
}


export async function sendVoiceQuery(
  documentId,
  questionTextEnglish,
  detectedLanguage = "en"
) {
  const response = await api.post(
    `/documents/${documentId}/voice-query/answer`,
    {
      question_text_english: questionTextEnglish,
      detected_language: detectedLanguage,
    }
  );

  return response.data;
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
// EMERGENCY — FIRST AID GUIDE
// =====================================

export async function getFirstAidGuide() {
  const response = await api.get(
    "/emergency/first-aid"
  );

  return response.data;
}


// =====================================
// EMERGENCY — CONTACT NUMBERS
// =====================================

export async function getEmergencyContacts() {
  const response = await api.get(
    "/emergency/contacts"
  );

  return response.data;
}


// =====================================
// EMERGENCY — NEARBY FACILITIES
// =====================================

export async function getNearbyFacilities(
  latitude,
  longitude,
  type = "hospital",
  radius = 5000
) {
  const response = await api.get(
    "/emergency/nearby-facilities",
    {
      params: {
        lat: latitude,
        lng: longitude,
        type,
        radius,
      },
    }
  );

  return response.data;
}


// =====================================
// EMERGENCY — SHARE MY LOCATION
// =====================================

export async function shareMyLocation(
  latitude,
  longitude,
  note = ""
) {
  const response = await api.post(
    "/emergency/share-location",
    {
      latitude,
      longitude,
      note,
    }
  );

  return response.data;
}


// =====================================
// EMERGENCY — SOS
// =====================================

export async function triggerSOS(
  latitude,
  longitude,
  note = ""
) {
  const response = await api.post(
    "/emergency/sos",
    {
      latitude,
      longitude,
      note,
    }
  );

  return response.data;
}


export async function getSOSLog() {
  const response = await api.get(
    "/emergency/sos"
  );

  return response.data;
}


export async function resolveSOS(
  sosId
) {
  const response = await api.patch(
    `/emergency/sos/${sosId}/resolve`
  );

  return response.data;
}


// =====================================
// MEDICAL REMINDERS
// =====================================

export async function getReminders(
  documentId
) {
  const response = await api.get(
    "/reminders",
    {
      params: documentId
        ? { document_id: documentId }
        : {},
    }
  );

  return response.data;
}


export async function getReminder(
  reminderId
) {
  const response = await api.get(
    `/reminders/${reminderId}`
  );

  return response.data;
}


export async function createReminder(
  reminderData
) {
  const response = await api.post(
    "/reminders",
    reminderData
  );

  return response.data;
}


export async function updateReminder(
  reminderId,
  reminderData
) {
  const response = await api.put(
    `/reminders/${reminderId}`,
    reminderData
  );

  return response.data;
}


export async function toggleReminder(
  reminderId
) {
  const response = await api.patch(
    `/reminders/${reminderId}/toggle`
  );

  return response.data;
}


export async function deleteReminder(
  reminderId
) {
  const response = await api.delete(
    `/reminders/${reminderId}`
  );

  return response.data;
}


// =====================================
// HEALTH EDUCATION
// =====================================

export async function getEducationTopics(
  lang = "en"
) {
  const response = await api.get(
    "/education/topics",
    {
      params: { lang },
    }
  );

  return response.data;
}


export async function getEducationTopic(
  topicId,
  lang = "en"
) {
  const response = await api.get(
    `/education/topics/${topicId}`,
    {
      params: { lang },
    }
  );

  return response.data;
}


export async function searchEducationTopics(
  query,
  lang = "en"
) {
  const response = await api.get(
    "/education/search",
    {
      params: {
        query,
        lang,
      },
    }
  );

  return response.data;
}


// =====================================
// HEALTH EDUCATION — OPEN ARTICLE
// =====================================

export async function getEducationArticle(
  url,
  lang = "en"
) {
  const response = await api.get(
    "/education/articles",
    {
      params: {
        url,
        lang,
      },
    }
  );

  return response.data;
}


// =====================================
// EXPORT AXIOS INSTANCE
// =====================================

export default api;