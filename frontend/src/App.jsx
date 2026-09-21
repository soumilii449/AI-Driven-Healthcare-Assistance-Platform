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
import Reminders from "./pages/Reminders";
import Translation from "./pages/Translation";
import Emergency from "./pages/Emergency";
import SOSLog from "./pages/emergency/SOSLog";

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import SOSButton from "./components/SOSButton";

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
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/prescriptions"
                element={
                  <>
                    <Navbar />
                    <AllPrescriptions />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/upload"
                element={
                  <>
                    <Navbar />
                    <Upload />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/results"
                element={
                  <>
                    <Navbar />
                    <Results />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/reminders"
                element={
                  <>
                    <Navbar />
                    <Reminders />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/translation"
                element={
                  <>
                    <Navbar />
                    <Translation />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/emergency"
                element={
                  <>
                    <Navbar />
                    <Emergency />
                    <SOSButton />
                  </>
                }
              />

              <Route
                path="/emergency/sos-log"
                element={
                  <>
                    <Navbar />
                    <SOSLog />
                    <SOSButton />
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