import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { getReminders } from "../services/api";

const formatTime = (value) => {
  if (!value || !value.includes(":")) return value || "--";

  const [hourStr, minuteStr] = value.split(":");
  const hour = parseInt(hourStr, 10);

  if (Number.isNaN(hour)) return value;

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${hour12}:${minuteStr} ${period}`;
};

const reminderDateForToday = (time) => {
  if (!time || !time.includes(":")) return null;

  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

const isWithinDateRange = (reminder) => {
  const today = new Date();
  const todayText = today.toISOString().split("T")[0];

  if (reminder.start_date && todayText < reminder.start_date) {
    return false;
  }

  if (reminder.end_date && todayText > reminder.end_date) {
    return false;
  }

  return true;
};

export default function MedicalNotificationCenter() {
  const [reminders, setReminders] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const notifiedRef = useRef(new Set());

  const loadReminders = async () => {
    try {
      const data = await getReminders();
      setReminders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Could not load medical reminders:", error);
    }
  };

  useEffect(() => {
    loadReminders();

    const interval = setInterval(loadReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const activeReminders = useMemo(() => {
    return reminders.filter(
      (reminder) => reminder.is_active && isWithinDateRange(reminder)
    );
  }, [reminders]);

  const getUpcoming = (reminder) => {
    const now = new Date();

    const matches = (reminder.times || [])
      .map((time) => ({
        time,
        date: reminderDateForToday(time),
      }))
      .filter((item) => item.date)
      .sort((a, b) => a.date - b.date);

    return matches.find((item) => item.date >= now) || null;
  };

  const dueNow = useMemo(() => {
    const now = new Date();

    return activeReminders.filter((reminder) =>
      (reminder.times || []).some((time) => {
        const date = reminderDateForToday(time);
        if (!date) return false;

        return Math.abs(date.getTime() - now.getTime()) <= 60 * 1000;
      })
    );
  }, [activeReminders]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const threeHours = now.getTime() + 3 * 60 * 60 * 1000;

    return activeReminders
      .map((reminder) => ({
        reminder,
        next: getUpcoming(reminder),
      }))
      .filter(
        (item) =>
          item.next &&
          item.next.date.getTime() > now.getTime() &&
          item.next.date.getTime() <= threeHours
      )
      .sort((a, b) => a.next.date - b.next.date);
  }, [activeReminders]);

  useEffect(() => {
    dueNow.forEach((reminder) => {
      const current = new Date();
      const minute = `${current.toDateString()}-${current.getHours()}:${current.getMinutes()}`;
      const key = `${reminder.id}-${minute}`;

      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      const body = [reminder.dosage, reminder.frequency]
        .filter(Boolean)
        .join(" · ");

      setToast({
        id: key,
        medicine: reminder.medicine_name,
        message: body || "It's time for your medication.",
      });

      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(`Time to take ${reminder.medicine_name}`, {
          body: body || "It's time for your medication.",
          tag: `medical-reminder-${reminder.id}-${minute}`,
        });
      }

      window.setTimeout(() => {
        setToast((current) => (current?.id === key ? null : current));
      }, 8000);
    });
  }, [dueNow]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;

    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error("Notification permission error:", error);
    }
  };

  useEffect(() => {
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      requestPermission();
    }
  }, []);

  const notificationCount = dueNow.length + upcoming.length;

  return (
    <>
      <div className="medical-notification-wrapper">
        <button
          type="button"
          className="medical-notification-button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Medical notifications"
          title="Medical reminders"
        >
          <Bell size={20} />

          {notificationCount > 0 && (
            <span className="medical-notification-badge">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div
              className="medical-notification-overlay"
              onClick={() => setOpen(false)}
            />

            <div className="medical-notification-panel">
              <div className="medical-notification-header">
                <div>
                  <h3>Medical Reminders</h3>
                  <p>Upcoming medicines and doses</p>
                </div>

                <button
                  type="button"
                  className="medical-notification-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="medical-notification-content">
                {dueNow.length > 0 && (
                  <section className="medical-notification-section">
                    <div className="medical-notification-section-title due">
                      <Bell size={15} />
                      Due now
                    </div>

                    {dueNow.map((reminder) => (
                      <div
                        className="medical-reminder-card due-card"
                        key={`due-${reminder.id}`}
                      >
                        <div className="medical-reminder-icon">
                          <Bell size={17} />
                        </div>

                        <div className="medical-reminder-info">
                          <strong>{reminder.medicine_name}</strong>
                          {reminder.dosage && <span>{reminder.dosage}</span>}
                          <small>
                            <Clock size={12} />
                            {(reminder.times || []).map(formatTime).join(", ")}
                          </small>
                        </div>

                        <Check size={18} />
                      </div>
                    ))}
                  </section>
                )}

                {upcoming.length > 0 && (
                  <section className="medical-notification-section">
                    <div className="medical-notification-section-title">
                      <Clock size={15} />
                      Next 3 hours
                    </div>

                    {upcoming.map(({ reminder, next }) => (
                      <div
                        className="medical-reminder-card"
                        key={`next-${reminder.id}`}
                      >
                        <div className="medical-reminder-icon">
                          <Clock size={17} />
                        </div>

                        <div className="medical-reminder-info">
                          <strong>{reminder.medicine_name}</strong>
                          {reminder.dosage && <span>{reminder.dosage}</span>}
                          <small>
                            <Clock size={12} />
                            {formatTime(next.time)}
                          </small>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {dueNow.length === 0 && upcoming.length === 0 && (
                  <div className="medical-notification-empty">
                    <Check size={34} />
                    <h4>No upcoming reminders</h4>
                    <p>
                      You don't have a medicine reminder due in the next 3
                      hours.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="medical-reminder-toast">
          <div className="medical-reminder-toast-icon">
            <Bell size={19} />
          </div>

          <div className="medical-reminder-toast-content">
            <strong>Medicine Reminder</strong>
            <p>
              <b>{toast.medicine}</b> — {toast.message}
            </p>
          </div>

          <button
            type="button"
            className="medical-reminder-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </>
  );
}
