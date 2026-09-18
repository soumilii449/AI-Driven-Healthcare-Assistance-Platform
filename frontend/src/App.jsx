import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { PrescriptionProvider } from "./context/PrescriptionContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AllPrescriptions from "./pages/AllPrescriptions";
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
              path="/"
              element={<Landing />}
            />

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
                path="/prescriptions"
                element={
                  <>
                    <Navbar />
                    <AllPrescriptions />
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
                INVALID ROUTES
            ========================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
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