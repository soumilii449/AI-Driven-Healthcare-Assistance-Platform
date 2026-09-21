import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BellOff,
  Clock,
  Pill,
  Plus,
  Trash2,
  X,
  Edit2,
  CalendarDays,
  StickyNote,
} from "lucide-react";

import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} from "../services/api";

// =====================================
// EMPTY FORM
// =====================================

const emptyForm = {
  medicine_name: "",
  dosage: "",
  frequency: "",
  times: ["08:00"],
  start_date: "",
  end_date: "",
  notes: "",
  document_id: null,
};

// =====================================
// HELPERS
// =====================================

const todayISO = () => new Date().toISOString().split("T")[0];

const nowHHMM = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatTime = (value) => {
  if (!value || !value.includes(":")) return value;

  const [hourStr, minuteStr] = value.split(":");
  const hour = parseInt(hourStr, 10);

  if (Number.isNaN(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${minuteStr} ${period}`;
};

export default function Reminders() {
  const location = useLocation();
  const navigate = useNavigate();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  const notifiedThisMinuteRef = useRef(new Set());

  // =====================================
  // LOAD REMINDERS
  // =====================================

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReminders();

      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load your reminders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // =====================================
  // PRE-FILL FORM WHEN ARRIVING FROM
  // "Set Reminder" ON A PRESCRIPTION
  // =====================================

  useEffect(() => {
    const prefill = location.state?.prefill;

    if (prefill) {
      setForm({
        ...emptyForm,
        medicine_name: prefill.medicine_name || "",
        dosage: prefill.dosage || "",
        frequency: prefill.frequency || "",
        document_id: prefill.document_id || null,
        start_date: todayISO(),
      });

      setEditingId(null);
      setShowForm(true);

      // Clear the navigation state so refreshing the page
      // doesn't keep re-opening the form.
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================
  // BROWSER NOTIFICATIONS
  // (best-effort, only while this tab is open)
  // =====================================

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;

    Notification.requestPermission().then((permission) => {
      setNotifPermission(permission);
    });
  };

  useEffect(() => {
    if (!("Notification" in window)) return undefined;

    const interval = setInterval(() => {
      const current = nowHHMM();
      const minuteKey = `${new Date().toDateString()}-${current}`;

      const activeMatches = reminders.filter(
        (reminder) =>
          reminder.is_active &&
          Array.isArray(reminder.times) &&
          reminder.times.includes(current)
      );

      if (
        activeMatches.length > 0 &&
        Notification.permission === "granted" &&
        !notifiedThisMinuteRef.current.has(minuteKey)
      ) {
        notifiedThisMinuteRef.current.add(minuteKey);

        activeMatches.forEach((reminder) => {
          const body = [reminder.dosage, reminder.frequency]
            .filter(Boolean)
            .join(" · ");

          new Notification(`Time to take ${reminder.medicine_name}`, {
            body: body || "It's time for your medication.",
            icon: undefined,
            tag: `reminder-${reminder.id}-${current}`,
          });
        });
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [reminders]);

  // =====================================
  // FORM HANDLERS
  // =====================================

  const openNewForm = () => {
    setForm({ ...emptyForm, start_date: todayISO() });
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (reminder) => {
    setForm({
      medicine_name: reminder.medicine_name || "",
      dosage: reminder.dosage || "",
      frequency: reminder.frequency || "",
      times:
        Array.isArray(reminder.times) && reminder.times.length > 0
          ? reminder.times
          : ["08:00"],
      start_date: reminder.start_date || "",
      end_date: reminder.end_date || "",
      notes: reminder.notes || "",
      document_id: reminder.document_id || null,
    });

    setEditingId(reminder.id);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const updateTimeAt = (index, value) => {
    setForm((prev) => {
      const nextTimes = [...prev.times];
      nextTimes[index] = value;
      return { ...prev, times: nextTimes };
    });
  };

  const addTimeSlot = () => {
    setForm((prev) => ({
      ...prev,
      times: [...prev.times, "08:00"],
    }));
  };

  const removeTimeSlot = (index) => {
    setForm((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const medicineName = form.medicine_name.trim();

    if (!medicineName) {
      setFormError("Please enter the medicine name.");
      return;
    }

    const cleanedTimes = form.times
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleanedTimes.length === 0) {
      setFormError("Please add at least one reminder time.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      medicine_name: medicineName,
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      times: cleanedTimes,
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes.trim(),
      document_id: form.document_id || null,
    };

    try {
      if (editingId) {
        await updateReminder(editingId, payload);
      } else {
        await createReminder(payload);

        if (
          "Notification" in window &&
          Notification.permission === "default"
        ) {
          requestNotificationPermission();
        }
      }

      closeForm();
      await loadReminders();
    } catch (err) {
      setFormError(
        err?.response?.data?.detail ||
          "Could not save this reminder. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (reminder) => {
    try {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminder.id ? { ...r, is_active: !r.is_active } : r
        )
      );

      await toggleReminder(reminder.id);
    } catch (err) {
      // Revert on failure
      await loadReminders();
    }
  };

  const handleDelete = async (reminder) => {
    const confirmed = window.confirm(
      `Delete the reminder for ${reminder.medicine_name}?`
    );

    if (!confirmed) return;

    try {
      setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
      await deleteReminder(reminder.id);
    } catch (err) {
      await loadReminders();
    }
  };

  // =====================================
  // GROUPING
  // =====================================

  const { activeReminders, pausedReminders } = useMemo(() => {
    const active = reminders.filter((r) => r.is_active);
    const paused = reminders.filter((r) => !r.is_active);

    const sortByEarliestTime = (a, b) => {
      const aTime = (a.times && a.times[0]) || "99:99";
      const bTime = (b.times && b.times[0]) || "99:99";
      return aTime.localeCompare(bTime);
    };

    return {
      activeReminders: [...active].sort(sortByEarliestTime),
      pausedReminders: [...paused].sort(sortByEarliestTime),
    };
  }, [reminders]);

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="dashboard-modern">
      <section className="dashboard-section reminders-page">
        <div className="section-heading reminders-heading">
          <div>
            <h1>Medical Reminders</h1>
            <p className="section-subtitle">
              Never miss a dose — set daily times for each medicine and
              we'll remind you while this app is open.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary reminders-add-btn"
            onClick={openNewForm}
          >
            <Plus size={18} />
            Add Reminder
          </button>
        </div>

        {"Notification" in window &&
          notifPermission !== "granted" &&
          notifPermission !== "unsupported" && (
            <div className="reminders-notice">
              <Bell size={18} />
              <span>
                Turn on notifications so we can alert you at the right
                time, even if you're on another tab.
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={requestNotificationPermission}
              >
                Enable Notifications
              </button>
            </div>
          )}

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <p className="reminders-loading">Loading your reminders…</p>
        ) : reminders.length === 0 ? (
          <div className="reminders-empty">
            <Pill size={36} />
            <h3>No reminders yet</h3>
            <p>
              Add a reminder for any medicine and choose the times you
              want to be prompted each day.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={openNewForm}
            >
              <Plus size={16} />
              Add your first reminder
            </button>
          </div>
        ) : (
          <>
            <div className="reminders-group">
              <h2 className="reminders-group-title">
                Active ({activeReminders.length})
              </h2>

              {activeReminders.length === 0 ? (
                <p className="reminders-group-empty">
                  No active reminders right now.
                </p>
              ) : (
                <div className="reminder-list">
                  {activeReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={handleToggle}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {pausedReminders.length > 0 && (
              <div className="reminders-group">
                <h2 className="reminders-group-title">
                  Paused ({pausedReminders.length})
                </h2>

                <div className="reminder-list">
                  {pausedReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onToggle={handleToggle}
                      onEdit={openEditForm}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {showForm && (
        <div className="reminder-modal-backdrop" onClick={closeForm}>
          <div
            className="reminder-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reminder-modal-header">
              <h2>{editingId ? "Edit Reminder" : "New Reminder"}</h2>

              <button
                type="button"
                className="reminder-modal-close"
                onClick={closeForm}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="reminder-form">
              {formError && (
                <div className="alert-error">{formError}</div>
              )}

              <label className="reminder-field">
                <span>Medicine name *</span>
                <input
                  type="text"
                  value={form.medicine_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      medicine_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Paracetamol"
                  required
                />
              </label>

              <div className="reminder-field-row">
                <label className="reminder-field">
                  <span>Dosage</span>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        dosage: e.target.value,
                      }))
                    }
                    placeholder="e.g. 500mg"
                  />
                </label>

                <label className="reminder-field">
                  <span>Frequency</span>
                  <input
                    type="text"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    placeholder="e.g. 1-0-1"
                  />
                </label>
              </div>

              <div className="reminder-field">
                <span>Reminder times *</span>

                <div className="reminder-times-list">
                  {form.times.map((time, index) => (
                    <div className="reminder-time-row" key={index}>
                      <Clock size={16} />

                      <input
                        type="time"
                        value={time}
                        onChange={(e) =>
                          updateTimeAt(index, e.target.value)
                        }
                        required
                      />

                      {form.times.length > 1 && (
                        <button
                          type="button"
                          className="reminder-time-remove"
                          onClick={() => removeTimeSlot(index)}
                          aria-label="Remove time"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-secondary reminder-add-time"
                  onClick={addTimeSlot}
                >
                  <Plus size={14} />
                  Add another time
                </button>
              </div>

              <div className="reminder-field-row">
                <label className="reminder-field">
                  <span>
                    <CalendarDays size={14} /> Start date
                  </span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="reminder-field">
                  <span>
                    <CalendarDays size={14} /> End date (optional)
                  </span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="reminder-field">
                <span>
                  <StickyNote size={14} /> Notes (optional)
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="e.g. Take after food"
                  rows={2}
                />
              </label>

              <div className="reminder-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingId
                    ? "Save Changes"
                    : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================
// REMINDER CARD
// =====================================

function ReminderCard({ reminder, onToggle, onEdit, onDelete }) {
  return (
    <div
      className={`reminder-item ${
        reminder.is_active ? "" : "reminder-item--paused"
      }`}
    >
      <div className="reminder-item-main">
        <div className="reminder-item-icon">
          <Pill size={18} />
        </div>

        <div className="reminder-item-info">
          <h3>{reminder.medicine_name}</h3>

          <p className="reminder-item-meta">
            {[reminder.dosage, reminder.frequency]
              .filter(Boolean)
              .join(" · ") || "No dosage details"}
          </p>

          <div className="reminder-item-times">
            {(reminder.times || []).map((time) => (
              <span className="reminder-time-chip" key={time}>
                <Clock size={12} />
                {formatTime(time)}
              </span>
            ))}
          </div>

          {reminder.notes && (
            <p className="reminder-item-notes">{reminder.notes}</p>
          )}
        </div>
      </div>

      <div className="reminder-item-actions">
        <button
          type="button"
          className="reminder-icon-btn"
          onClick={() => onToggle(reminder)}
          title={reminder.is_active ? "Pause reminder" : "Resume reminder"}
          aria-label={
            reminder.is_active ? "Pause reminder" : "Resume reminder"
          }
        >
          {reminder.is_active ? <Bell size={17} /> : <BellOff size={17} />}
        </button>

        <button
          type="button"
          className="reminder-icon-btn"
          onClick={() => onEdit(reminder)}
          title="Edit reminder"
          aria-label="Edit reminder"
        >
          <Edit2 size={16} />
        </button>

        <button
          type="button"
          className="reminder-icon-btn reminder-icon-btn--danger"
          onClick={() => onDelete(reminder)}
          title="Delete reminder"
          aria-label="Delete reminder"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
