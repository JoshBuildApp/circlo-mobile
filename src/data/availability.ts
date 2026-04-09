// Simulated availability data for coaches
export interface TimeSlot {
  time: string; // "HH:MM" format
  label: string; // "4:00 PM"
}

export interface DayAvailability {
  date: string; // ISO date string "YYYY-MM-DD"
  slots: TimeSlot[];
  bookedSlots: string[]; // times that are already booked
}

export interface CoachAvailability {
  coachId: string;
  recurringDays: number[]; // 0=Sun, 1=Mon, ...
  recurringStartHour: number;
  recurringEndHour: number;
  blockedDates: string[]; // dates with no availability
}

const coachAvailabilities: CoachAvailability[] = [
  { coachId: "1", recurringDays: [1, 2, 3, 4, 5], recurringStartHour: 9, recurringEndHour: 18, blockedDates: [] },
  { coachId: "2", recurringDays: [1, 3, 5], recurringStartHour: 10, recurringEndHour: 20, blockedDates: [] },
  { coachId: "3", recurringDays: [1, 2, 3, 4, 5, 6], recurringStartHour: 7, recurringEndHour: 16, blockedDates: [] },
  { coachId: "4", recurringDays: [2, 4, 6], recurringStartHour: 8, recurringEndHour: 17, blockedDates: [] },
  { coachId: "5", recurringDays: [1, 2, 3, 4, 5], recurringStartHour: 11, recurringEndHour: 21, blockedDates: [] },
  { coachId: "6", recurringDays: [1, 3, 4, 5], recurringStartHour: 6, recurringEndHour: 14, blockedDates: [] },
];

// Simulated already-booked slots
const bookedSlotsMap: Record<string, string[]> = {};

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${ampm}`;
}

export function getCoachAvailability(coachId: string): CoachAvailability | undefined {
  return coachAvailabilities.find((a) => a.coachId === coachId);
}

export function getSlotsForDate(coachId: string, date: Date): { slots: TimeSlot[]; bookedSlots: string[] } {
  const avail = getCoachAvailability(coachId);
  if (!avail) return { slots: [], bookedSlots: [] };

  const dayOfWeek = date.getDay();
  if (!avail.recurringDays.includes(dayOfWeek)) return { slots: [], bookedSlots: [] };

  const dateStr = date.toISOString().split("T")[0];
  if (avail.blockedDates.includes(dateStr)) return { slots: [], bookedSlots: [] };

  const slots: TimeSlot[] = [];
  for (let h = avail.recurringStartHour; h < avail.recurringEndHour; h++) {
    const time = `${h.toString().padStart(2, "0")}:00`;
    slots.push({ time, label: formatHour(h) });
  }

  const booked = bookedSlotsMap[`${coachId}_${dateStr}`] || [];

  // Add some fake booked slots for realism
  const seed = dateStr.split("-").reduce((a, b) => a + parseInt(b), 0) + parseInt(coachId);
  const fakeBooked = slots
    .filter((_, i) => (i * seed) % 5 === 0)
    .map((s) => s.time);

  return { slots, bookedSlots: [...booked, ...fakeBooked] };
}

export function isDateAvailable(coachId: string, date: Date): boolean {
  const avail = getCoachAvailability(coachId);
  if (!avail) return false;
  const dayOfWeek = date.getDay();
  if (!avail.recurringDays.includes(dayOfWeek)) return false;
  const dateStr = date.toISOString().split("T")[0];
  if (avail.blockedDates.includes(dateStr)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return false;
  return true;
}

export function getNextAvailableSlot(coachId: string): { date: Date; time: string; label: string } | null {
  const now = new Date();
  const currentHour = now.getHours();

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    if (!isDateAvailable(coachId, date)) continue;

    const { slots, bookedSlots } = getSlotsForDate(coachId, date);
    for (const slot of slots) {
      if (bookedSlots.includes(slot.time)) continue;
      const slotHour = parseInt(slot.time.split(":")[0]);
      // Skip past hours on today
      if (dayOffset === 0 && slotHour <= currentHour) continue;
      return { date, time: slot.time, label: slot.label };
    }
  }
  return null;
}
