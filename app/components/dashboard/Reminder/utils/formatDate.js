export function formatDate(dateString) {
  if (!dateString) return "No scheduled date";

  const date = new Date(dateString);
  const now = new Date("2025-09-14"); // Change this to current date LATER

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function isTomorrow(d1, d2) {
    const tomorrow = new Date(d2);

    tomorrow.setDate(tomorrow.getDate() + 1);

    return isSameDay(d1, tomorrow);
  }

  function formatTimeOnly(date) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const time = formatTimeOnly(date);

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  if (date < now && !isSameDay(date, now)) {
    return `Overdue: ${date.toLocaleDateString()}`;
  }

  if (isSameDay(date, now)) {
    return `Today at ${formatTimeOnly(date)}`;
  }

  if (isTomorrow(date, now)) {
    return `Tomorrow at ${formatTimeOnly(date)}`;
  }

  const Difference = date - now;
  const Days = Difference / (1000 * 60 * 60 * 24);

  if (Days <= 7) {
    return `${weekdayNames[date.getDay()]}, ${time}`;
  }

  return `${date.toLocaleDateString("en-US",{
    month:"short",
    day:"numeric"
  })} at ${time}`;
}

export function formatCompletedDate(dateString) {
  if (!dateString) return "No completion date";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + " at " +
  date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

