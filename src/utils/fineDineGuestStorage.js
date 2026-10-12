const guestKey = (slug) => `fineDineGuest:${slug}`;

export const getStoredFineDineGuest = (slug) => {
  try {
    const raw = sessionStorage.getItem(guestKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredFineDineGuest = (slug, guest) => {
  try {
    if (!guest) {
      sessionStorage.removeItem(guestKey(slug));
      return;
    }
    sessionStorage.setItem(guestKey(slug), JSON.stringify(guest));
  } catch {
    /* ignore */
  }
};

export const clearStoredFineDineGuest = (slug) => {
  setStoredFineDineGuest(slug, null);
};

export const matchSessionGuest = (session, stored) => {
  const guests = Array.isArray(session?.guests) ? session.guests : [];
  if (!stored) return null;
  if (stored.guestId) {
    const byId = guests.find((guest) => guest.id === stored.guestId);
    if (byId) return byId;
  }
  const email = String(stored.email || "").trim().toLowerCase();
  if (email) {
    const byEmail = guests.find((guest) => String(guest.email || "").trim().toLowerCase() === email);
    if (byEmail) return byEmail;
  }
  const phone = String(stored.phone || stored.guestPhone || "").replace(/\D/g, "");
  if (!phone) return null;
  return (
    guests.find((guest) => String(guest.phone || "").replace(/\D/g, "") === phone) ||
    (String(session?.guestPhone || "").replace(/\D/g, "") === phone
      ? guests.find((guest) => guest.role === "host") || {
          id: stored.guestId,
          name: stored.name || session.guestName || "Host",
          role: "host",
          phone: session.guestPhone,
          email: stored.email || null,
        }
      : null)
  );
};

export const toStoredFineDineGuest = (session, guest) => ({
  sessionId: session?.id || null,
  guestId: guest?.id || guest?.guestId || null,
  name: guest?.name || "",
  phone: guest?.phone || guest?.guestPhone || session?.guestPhone || "",
  email: guest?.email || "",
  role: guest?.role || "guest",
});
