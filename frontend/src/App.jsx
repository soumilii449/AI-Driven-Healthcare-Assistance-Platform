import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { PrescriptionProvider } from "./context/PrescriptionContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/uplo";
import Results from "./pages/Results";
import Translation from "./pages/Translation";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrescriptionProvider>
          <Routes>

            {/* =========================
                PUBLIC ROUTES
            ========================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            {/* =========================
                PROTECTED ROUTES
            ========================= */}

            <Route element={<ProtectedRoute />}>

              <Route
                path="/dashboard"
                element={
                  <>
                    <Navbar />
                    <Dashboard />
                  </>
                }
              />

              <Route
                path="/upload"
                element={
                  <>
                    <Navbar />
                    <Upload />
                  </>
                }
              />

              <Route
                path="/results"
                element={
                  <>
                    <Navbar />
                    <Results />
                  </>
                }
              />

              <Route
                path="/translation"
                element={
                  <>
                    <Navbar />
                    <Translation />
                  </>
                }
              />

            </Route>

            {/* =========================
                DEFAULT ROUTE
            ========================= */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            {/* =========================
                INVALID ROUTES
            ========================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>
        </PrescriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;