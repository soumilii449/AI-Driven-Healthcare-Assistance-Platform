import { createContext, useContext, useState } from "react";
import {
  uploadDocument,
  processDocument,
  getDocumentResult,
} from "../services/api";

const PrescriptionContext = createContext(null);

export function PrescriptionProvider({ children }) {
  const [document, setDocument] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadPrescription = async (file) => {
    setLoading(true);
    setError("");

    try {
      const uploaded = await uploadDocument(file);
      setDocument(uploaded);
      return uploaded;
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to upload prescription."
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processPrescription = async (documentId) => {
    setLoading(true);
    setError("");

    try {
      const processed = await processDocument(documentId);
      setResult(processed);
      return processed;
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to process prescription."
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async (documentId) => {
    setLoading(true);
    setError("");

    try {
      const data = await getDocumentResult(documentId);
      setResult(data);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to get prescription result."
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearPrescription = () => {
    setDocument(null);
    setResult(null);
    setError("");
  };

  return (
    <PrescriptionContext.Provider
      value={{
        document,
        result,
        loading,
        error,
        uploadPrescription,
        processPrescription,
        fetchResult,
        clearPrescription,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
}

export function usePrescription() {
  return useContext(PrescriptionContext);
}