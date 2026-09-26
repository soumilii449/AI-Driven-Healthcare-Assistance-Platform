import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Users,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Stethoscope,
  UserCog,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import {
  getAdminUsers,
  deleteAdminUser,
  getAdminStatistics,
  getDocuments,
  deleteDocument,
} from "../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeSection, setActiveSection] =
    useState("overview");

  const isAdmin =
    user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!isAdmin) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [user, isAdmin, navigate]);

  const loadAdminData = async (
    showRefresh = false
  ) => {
    if (!isAdmin) {
      return;
    }

    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        statisticsData,
        usersData,
        documentsData,
      ] = await Promise.all([
        getAdminStatistics(),
        getAdminUsers(),
        getDocuments(),
      ]);

      setStatistics(
        statisticsData
      );

      setUsers(
        usersData
      );

      setDocuments(
        documentsData
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load admin data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  const handleDeleteUser = async (
    userId,
    username
  ) => {
    if (userId === user?.id) {
      setError(
        "You cannot delete your own admin account."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete the user "${username}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteAdminUser(
        userId
      );

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (currentUser) =>
              currentUser.id !==
              userId
          )
      );

      const updatedStatistics =
        await getAdminStatistics();

      setStatistics(
        updatedStatistics
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to delete user."
      );
    }
  };

  const handleDeleteDocument = async (
    documentId,
    filename
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${filename}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteDocument(
        documentId
      );

      setDocuments(
        (currentDocuments) =>
          currentDocuments.filter(
            (document) =>
              document.id !==
              documentId
          )
      );

      const updatedStatistics =
        await getAdminStatistics();

      setStatistics(
        updatedStatistics
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to delete document."
      );
    }
  };

  const getRoleIcon = (
    role
  ) => {
    if (
      role?.toLowerCase() ===
      "admin"
    ) {
      return (
        <UserCog size={17} />
      );
    }

    if (
      role?.toLowerCase() ===
      "doctor"
    ) {
      return (
        <Stethoscope
          size={17}
        />
      );
    }

    return (
      <UserRound size={17} />
    );
  };

  const getStatusClass = (
    status
  ) => {
    if (
      status === "processed"
    ) {
      return "admin-status admin-status-success";
    }

    if (
      status === "failed"
    ) {
      return "admin-status admin-status-error";
    }

    return "admin-status admin-status-pending";
  };

  if (!user) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <RefreshCw
            size={28}
            className="admin-spin"
          />

          <p>
            Checking authentication...
          </p>
        </div>

        <style>
          {adminStyles}
        </style>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <RefreshCw
            size={28}
            className="admin-spin"
          />

          <p>
            Loading admin dashboard...
          </p>
        </div>

        <style>
          {adminStyles}
        </style>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">

        <div className="admin-header">
          <div>
            <div className="admin-title-row">

              <div className="admin-shield">
                <ShieldCheck
                  size={25}
                />
              </div>

              <div>
                <h1>
                  Admin Dashboard
                </h1>

                <p>
                  Manage users,
                  documents and
                  platform statistics.
                </p>
              </div>

            </div>
          </div>

          <button
            className="admin-refresh-button"
            onClick={() =>
              loadAdminData(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {error && (
          <div className="admin-error">
            <AlertTriangle
              size={18}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        <div className="admin-stat-grid">

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Users size={23} />
            </div>

            <div>
              <span>
                Total Users
              </span>

              <strong>
                {statistics?.total_users ??
                  0}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserRound
                size={23}
              />
            </div>

            <div>
              <span>
                Total Patients
              </span>

              <strong>
                {statistics?.total_patients ??
                  0}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Stethoscope
                size={23}
              />
            </div>

            <div>
              <span>
                Total Doctors
              </span>

              <strong>
                {statistics?.total_doctors ??
                  users.filter(
                    (item) =>
                      item.role ===
                      "doctor"
                  ).length}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <FileText
                size={23}
              />
            </div>

            <div>
              <span>
                Total Documents
              </span>

              <strong>
                {statistics?.total_documents ??
                  0}
              </strong>
            </div>
          </div>

        </div>

        <div className="admin-tabs">

          <button
            className={
              activeSection ===
              "overview"
                ? "admin-tab active"
                : "admin-tab"
            }
            onClick={() =>
              setActiveSection(
                "overview"
              )
            }
          >
            <Activity size={17} />
            Overview
          </button>

          <button
            className={
              activeSection ===
              "users"
                ? "admin-tab active"
                : "admin-tab"
            }
            onClick={() =>
              setActiveSection(
                "users"
              )
            }
          >
            <Users size={17} />
            Users
          </button>

          <button
            className={
              activeSection ===
              "documents"
                ? "admin-tab active"
                : "admin-tab"
            }
            onClick={() =>
              setActiveSection(
                "documents"
              )
            }
          >
            <FileText
              size={17}
            />
            Documents
          </button>

        </div>

        {activeSection ===
          "overview" && (
          <div className="admin-content-grid">

            <div className="admin-panel">

              <div className="admin-panel-header">

                <div>
                  <h2>
                    Document Processing
                  </h2>

                  <p>
                    Current prescription
                    processing status.
                  </p>
                </div>

                <FileText
                  size={22}
                />

              </div>

              <div className="admin-processing-list">

                <div className="admin-processing-item">
                  <div>
                    <CheckCircle
                      size={18}
                    />

                    <span>
                      Processed
                    </span>
                  </div>

                  <strong>
                    {statistics?.processed_documents ??
                      0}
                  </strong>
                </div>

                <div className="admin-processing-item">
                  <div>
                    <Clock
                      size={18}
                    />

                    <span>
                      Pending
                    </span>
                  </div>

                  <strong>
                    {statistics?.pending_documents ??
                      0}
                  </strong>
                </div>

                <div className="admin-processing-item">
                  <div>
                    <AlertTriangle
                      size={18}
                    />

                    <span>
                      Failed
                    </span>
                  </div>

                  <strong>
                    {statistics?.failed_documents ??
                      0}
                  </strong>
                </div>

              </div>
            </div>

            <div className="admin-panel">

              <div className="admin-panel-header">

                <div>
                  <h2>
                    User Distribution
                  </h2>

                  <p>
                    Users currently
                    registered on the
                    platform.
                  </p>
                </div>

                <Users size={22} />

              </div>

              <div className="admin-role-list">

                {[
                  {
                    role: "admin",
                    label:
                      "Administrators",
                    icon: (
                      <UserCog
                        size={18}
                      />
                    ),
                  },
                  {
                    role: "doctor",
                    label:
                      "Doctors",
                    icon: (
                      <Stethoscope
                        size={18}
                      />
                    ),
                  },
                  {
                    role: "patient",
                    label:
                      "Patients",
                    icon: (
                      <UserRound
                        size={18}
                      />
                    ),
                  },
                ].map(
                  (item) => {
                    const count =
                      users.filter(
                        (currentUser) =>
                          currentUser.role?.toLowerCase() ===
                          item.role
                      ).length;

                    return (
                      <div
                        className="admin-role-item"
                        key={
                          item.role
                        }
                      >
                        <div>
                          {item.icon}

                          <span>
                            {
                              item.label
                            }
                          </span>
                        </div>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    );
                  }
                )}

              </div>
            </div>

          </div>
        )}

        {activeSection ===
          "users" && (
          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>
                <h2>
                  User Management
                </h2>

                <p>
                  View and manage
                  registered platform
                  users.
                </p>
              </div>

              <Users size={22} />

            </div>

            {users.length ===
            0 ? (
              <div className="admin-empty">
                No users found.
              </div>
            ) : (
              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>
                        Username
                      </th>
                      <th>
                        Role
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {users.map(
                      (currentUser) => (
                        <tr
                          key={
                            currentUser.id
                          }
                        >

                          <td>
                            #
                            {
                              currentUser.id
                            }
                          </td>

                          <td>
                            <div className="admin-user-cell">

                              <div className="admin-user-avatar">
                                {currentUser.username
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase()}
                              </div>

                              <span>
                                {
                                  currentUser.username
                                }
                              </span>

                            </div>
                          </td>

                          <td>

                            <span
                              className={`admin-role-badge admin-role-${currentUser.role}`}
                            >
                              {getRoleIcon(
                                currentUser.role
                              )}

                              {
                                currentUser.role
                              }
                            </span>

                          </td>

                          <td>

                            {currentUser.id ===
                            user.id ? (
                              <span className="admin-current-user">
                                Current Admin
                              </span>
                            ) : (
                              <button
                                className="admin-delete-button"
                                onClick={() =>
                                  handleDeleteUser(
                                    currentUser.id,
                                    currentUser.username
                                  )
                                }
                                title="Delete user"
                              >
                                <Trash2
                                  size={
                                    16
                                  }
                                />

                                Delete
                              </button>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

        {activeSection ===
          "documents" && (
          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>
                <h2>
                  Document Management
                </h2>

                <p>
                  View and manage
                  uploaded
                  prescriptions.
                </p>
              </div>

              <FileText
                size={22}
              />

            </div>

            {documents.length ===
            0 ? (
              <div className="admin-empty">
                No documents found.
              </div>
            ) : (
              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>
                        Filename
                      </th>
                      <th>
                        Type
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {documents.map(
                      (document) => (
                        <tr
                          key={
                            document.id
                          }
                        >

                          <td>
                            #
                            {
                              document.id
                            }
                          </td>

                          <td>
                            <div className="admin-document-name">
                              <FileText
                                size={
                                  16
                                }
                              />

                              {
                                document.filename
                              }
                            </div>
                          </td>

                          <td>
                            {
                              document.document_type ||
                              "Prescription"
                            }
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                document.status
                              )}
                            >
                              {
                                document.status
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              className="admin-delete-button"
                              onClick={() =>
                                handleDeleteDocument(
                                  document.id,
                                  document.filename
                                )
                              }
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />

                              Delete
                            </button>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

      </div>

      <style>
        {adminStyles}
      </style>
    </div>
  );
}

const adminStyles = `
.admin-page {
  min-height: calc(100vh - 70px);
  padding: 34px 24px 60px;
  background: var(--page-bg, #f7f6ef);
}

.admin-container {
  max-width: 1250px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.admin-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.admin-shield {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #477d55;
  color: white;
  box-shadow: 0 8px 20px rgba(71, 125, 85, 0.2);
}

.admin-header h1 {
  margin: 0 0 5px;
  font-size: 29px;
  color: #26382b;
}

.admin-header p {
  margin: 0;
  color: #73766c;
  font-size: 14px;
}

.admin-refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #d7d8cb;
  border-radius: 10px;
  background: white;
  color: #3d5f45;
  font-weight: 600;
  cursor: pointer;
}

.admin-refresh-button:hover {
  background: #f0f5ef;
}

.admin-refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-error {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 16px;
  margin-bottom: 22px;
  border-radius: 11px;
  background: #fff0ef;
  border: 1px solid #f2c9c5;
  color: #a53c34;
}

.admin-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 25px;
}

.admin-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border: 1px solid #e1e0d6;
  border-radius: 15px;
  background: white;
  box-shadow: 0 5px 18px rgba(52, 65, 48, 0.05);
}

.admin-stat-icon {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #edf4ec;
  color: #477d55;
}

.admin-stat-card span {
  display: block;
  margin-bottom: 4px;
  color: #77786e;
  font-size: 13px;
}

.admin-stat-card strong {
  display: block;
  color: #29392d;
  font-size: 24px;
}

.admin-tabs {
  display: flex;
  gap: 7px;
  margin-bottom: 18px;
  padding: 6px;
  width: fit-content;
  border: 1px solid #e1e0d6;
  border-radius: 12px;
  background: white;
}

.admin-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #73766c;
  font-weight: 600;
  cursor: pointer;
}

.admin-tab.active {
  background: #477d55;
  color: white;
}

.admin-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.admin-panel {
  padding: 22px;
  border: 1px solid #e1e0d6;
  border-radius: 15px;
  background: white;
  box-shadow: 0 5px 18px rgba(52, 65, 48, 0.05);
}

.admin-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
  color: #477d55;
}

.admin-panel-header h2 {
  margin: 0 0 5px;
  color: #29392d;
  font-size: 19px;
}

.admin-panel-header p {
  margin: 0;
  color: #77786e;
  font-size: 13px;
}

.admin-processing-list,
.admin-role-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-processing-item,
.admin-role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  border-radius: 10px;
  background: #f7f8f3;
}

.admin-processing-item > div,
.admin-role-item > div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #4e594f;
}

.admin-processing-item strong,
.admin-role-item strong {
  color: #2d3c31;
  font-size: 17px;
}

.admin-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  padding: 12px 10px;
  text-align: left;
  color: #74766c;
  background: #f7f8f3;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.admin-table td {
  padding: 13px 10px;
  border-bottom: 1px solid #ecece5;
  color: #41483f;
  font-size: 14px;
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.admin-user-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-user-avatar {
  width: 31px;
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e5eee3;
  color: #477d55;
  font-weight: 700;
}

.admin-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.admin-role-admin {
  background: #eee9f7;
  color: #694e9a;
}

.admin-role-doctor {
  background: #e7f0f7;
  color: #39709a;
}

.admin-role-patient {
  background: #e8f3e9;
  color: #467b4e;
}

.admin-delete-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border: 1px solid #edc9c5;
  border-radius: 7px;
  background: #fff7f6;
  color: #b34c43;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.admin-delete-button:hover {
  background: #ffedeb;
}

.admin-current-user {
  display: inline-flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 7px;
  background: #edf4ec;
  color: #477d55;
  font-size: 12px;
  font-weight: 600;
}

.admin-status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.admin-status-success {
  background: #e8f4e9;
  color: #397347;
}

.admin-status-error {
  background: #ffebea;
  color: #ae443d;
}

.admin-status-pending {
  background: #fff5df;
  color: #9a6b1d;
}

.admin-document-name {
  display: flex;
  align-items: center;
  gap: 7px;
}

.admin-empty {
  padding: 35px 20px;
  text-align: center;
  color: #7a7d73;
}

.admin-loading {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #55765c;
}

.admin-spin {
  animation: admin-spin-animation 1s linear infinite;
}

@keyframes admin-spin-animation {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

body.dark-theme .admin-page {
  background: #1e211d;
}

body.dark-theme .admin-stat-card,
body.dark-theme .admin-panel,
body.dark-theme .admin-tabs,
body.dark-theme .admin-refresh-button {
  background: #292d27;
  border-color: #41463e;
}

body.dark-theme .admin-header h1,
body.dark-theme .admin-panel-header h2,
body.dark-theme .admin-stat-card strong,
body.dark-theme .admin-processing-item strong,
body.dark-theme .admin-role-item strong {
  color: #e5e7df;
}

body.dark-theme .admin-header p,
body.dark-theme .admin-panel-header p,
body.dark-theme .admin-stat-card span {
  color: #aeb2a7;
}

body.dark-theme .admin-processing-item,
body.dark-theme .admin-role-item,
body.dark-theme .admin-table th {
  background: #33372f;
}

body.dark-theme .admin-table td {
  border-color: #41463e;
  color: #d0d3ca;
}

@media (max-width: 950px) {
  .admin-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .admin-page {
    padding: 25px 14px 45px;
  }

  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-stat-grid {
    grid-template-columns: 1fr;
  }

  .admin-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .admin-tab {
    white-space: nowrap;
  }

  .admin-table {
    min-width: 700px;
  }
}
`;