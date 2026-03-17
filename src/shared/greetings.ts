// Time-aware, personalized greeting messages for Harbor's empty state.
// Greetings are selected based on time of day, day of week, and optionally user name.

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12)  return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function getDayContext(): string {
  const day = new Date().getDay()
  if (day === 0) return 'sunday'
  if (day === 1) return 'monday'
  if (day === 5) return 'friday'
  if (day === 6) return 'saturday'
  return 'weekday'
}

const GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning. What shall we tackle today?",
    "Morning! Ready to make today count?",
    "Rise and research — what's on your mind?",
    "A fresh morning, a fresh start. What do you need?",
    "Morning has arrived. I'm here and ready.",
    "Good morning. The day is full of possibility.",
    "Hello, early bird. What are we building today?",
    "Morning! Coffee brewing, Harbor ready — let's go.",
    "The morning is yours. What would you like to explore?",
    "Good morning. Where would you like to begin?",
    "Rise and shine — I've been waiting to help.",
    "Morning clarity: what's the first thing on your mind?",
    "Good morning. Every great day starts with a question.",
    "The dawn crew has arrived. What's the mission?",
  ],
  afternoon: [
    "Good afternoon. What can I help you with?",
    "Afternoon — keeping the momentum going?",
    "Mid-day check-in: what do you need right now?",
    "Good afternoon. Deep focus mode — what's the task?",
    "Afternoon! Still plenty of day left to accomplish things.",
    "Hello again. What shall we dig into?",
    "Good afternoon. I'm here whenever you're ready.",
    "The afternoon is prime time. What are we working on?",
    "Afternoon greetings. What question can I answer?",
    "Good afternoon — let's make the most of it.",
    "Peak productivity hours. What's the goal today?",
    "Afternoon! Whether it's research or tasks, I'm ready.",
    "The afternoon shift is in full swing. How can I help?",
    "Good afternoon. No task too big or small.",
  ],
  evening: [
    "Good evening. Winding down or still going strong?",
    "Evening mode: slower pace, deeper thoughts?",
    "Good evening. What's on your mind tonight?",
    "Evening! Whether you're finishing up or just starting — I'm here.",
    "The evening brings good questions. What's yours?",
    "Good evening. The day isn't done yet — what do you need?",
    "Hello, night owl in training. What can we explore?",
    "Evening's here. What would you like to accomplish before tomorrow?",
    "Good evening. I work just as well after sunset.",
    "Evening check-in: what's still on the list?",
    "The evening hours are perfect for deep research. Shall we?",
    "Good evening — I've been quietly waiting all day.",
    "Evening! Big ideas often arrive at this hour.",
    "Good evening. The quiet hours are great for focus.",
  ],
  night: [
    "Still at it? I admire the dedication.",
    "The late hours belong to the most curious minds.",
    "Night owl energy. What's keeping you up?",
    "Late night session — what's the mission?",
    "Good evening (or morning?). What do you need?",
    "The world is quiet. Good time for deep work.",
    "Night shift: I'm fully operational.",
    "Can't sleep? Or won't sleep? Either way, I'm here.",
    "The late night hours are underrated for thinking clearly.",
    "Hello, midnight explorer. What shall we discover?",
    "Late night question — I love those. What is it?",
    "The stars are out. What's on your mind?",
    "Even at this hour, I'm ready and waiting.",
    "Night mode engaged. What do you need?",
  ],
}

const MONDAY_GREETINGS = [
  "Happy Monday! Let's start the week strong.",
  "New week, new possibilities. What's first?",
  "Monday — a clean slate. What are we building this week?",
]

const FRIDAY_GREETINGS = [
  "Friday energy! Let's finish strong.",
  "Almost the weekend — let's make it count.",
  "TGIF! What needs to get done before you sign off?",
]

const WEEKEND_GREETINGS = [
  "Weekend mode — working on something personal?",
  "A weekend question? You're dedicated. How can I help?",
  "Even on weekends, curious minds keep exploring.",
  "Taking a break from the break to get something done?",
]

const NAMED_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning, {name}! Ready to take on the day?",
    "Morning, {name}. What's on the agenda?",
    "Hey {name} — good morning! Let's start something great.",
    "Good morning, {name}. Where shall we begin?",
  ],
  afternoon: [
    "Good afternoon, {name}. How's the day treating you?",
    "Hey {name}! Afternoon. What do you need?",
    "Good afternoon, {name} — still crushing it?",
  ],
  evening: [
    "Good evening, {name}. Busy day?",
    "Evening, {name}! What's left on the list?",
    "Hey {name} — good evening. What's on your mind?",
  ],
  night: [
    "Still up, {name}? What's keeping you going?",
    "Late night, {name}? What do you need?",
    "Hey {name} — burning the midnight oil?",
  ],
}

export function getGreeting(userName?: string): string {
  const timeOfDay = getTimeOfDay()
  const dayContext = getDayContext()

  // Day-specific overrides (morning only for Monday/Friday)
  if (timeOfDay === 'morning') {
    if (dayContext === 'monday' && Math.random() > 0.5) {
      const greeting = MONDAY_GREETINGS[Math.floor(Math.random() * MONDAY_GREETINGS.length)]
      return userName ? greeting.replace('{name}', userName) : greeting
    }
    if (dayContext === 'friday' && Math.random() > 0.5) {
      const greeting = FRIDAY_GREETINGS[Math.floor(Math.random() * FRIDAY_GREETINGS.length)]
      return userName ? greeting.replace('{name}', userName) : greeting
    }
  }

  if ((dayContext === 'saturday' || dayContext === 'sunday') && Math.random() > 0.6) {
    const greeting = WEEKEND_GREETINGS[Math.floor(Math.random() * WEEKEND_GREETINGS.length)]
    return userName ? greeting.replace('{name}', userName) : greeting
  }

  // Use named greetings if user name available (50% chance for variety)
  if (userName && Math.random() > 0.5) {
    const pool = NAMED_GREETINGS[timeOfDay]
    const template = pool[Math.floor(Math.random() * pool.length)]
    return template.replace('{name}', userName)
  }

  // Default time-of-day greetings
  const pool = GREETINGS[timeOfDay]
  return pool[Math.floor(Math.random() * pool.length)]
}

export const SUGGESTION_PROMPTS = [
  { icon: 'Globe',       text: 'Summarize this page' },
  { icon: 'Search',      text: 'Research a topic for me' },
  { icon: 'ShoppingCart',text: 'Compare prices for this product' },
  { icon: 'FileText',    text: 'Extract data from this page' },
  { icon: 'Shuffle',     text: 'Find alternatives to this' },
  { icon: 'Layers',      text: 'Organize my tabs' },
  { icon: 'BookOpen',    text: 'Deep research: explain this topic' },
  { icon: 'Camera',      text: 'Create a screenshot walkthrough' },
]
