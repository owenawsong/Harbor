// Diverse, personalized greeting messages for Harbor's empty state.
// Mix of time-based, weather-like, motivational, and casual greetings.

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

// Greetings that don't reference time — just vibes, curiosity, motivation
const TIMELESS_GREETINGS = [
  "Ready when you are.",
  "What's on your mind?",
  "Let's figure something out.",
  "What are we exploring today?",
  "Ask me anything.",
  "I've been waiting for a good question.",
  "What do you need?",
  "Curiosity is a great place to start.",
  "Something on your mind?",
  "Let's get into it.",
  "Big ideas welcome here.",
  "I work best when I'm busy.",
  "What shall we discover?",
  "No task too big, no question too small.",
  "Where would you like to begin?",
  "The best questions start right here.",
  "Your browser. Your agent. Your move.",
  "Let's make something happen.",
]

// Greetings that feel like weather/environment/atmosphere
const ATMOSPHERE_GREETINGS = [
  "Clear skies and a clear head — what's first?",
  "It's a good day for research.",
  "Storm of ideas? I'll help sort them out.",
  "Perfect conditions for getting things done.",
  "The forecast says: productive.",
  "Fresh air, fresh start. What do you need?",
  "Conditions look ideal. Let's work.",
  "A calm moment. A perfect time to think.",
]

// Motivational / momentum
const MOMENTUM_GREETINGS = [
  "Momentum starts here.",
  "Small actions, big results. What's first?",
  "Let's cross something off your list.",
  "One question at a time.",
  "Progress starts with a question.",
  "Every great project starts with curiosity.",
  "You're closer to the answer than you think.",
]

const GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning. What shall we tackle today?",
    "Morning — ready to make today count?",
    "Rise and research. What's on your mind?",
    "Good morning. The day is full of possibility.",
    "Morning clarity: what's the first thing on your mind?",
    "Every great day starts with a good question.",
    "Good morning. Where would you like to begin?",
    "The morning is yours. What would you like to explore?",
    "Morning has arrived. I'm here and ready.",
    "Good morning. I've been quietly waiting.",
  ],
  afternoon: [
    "Good afternoon. What can I help you with?",
    "Afternoon — keeping the momentum going?",
    "Good afternoon. Deep focus time — what's the task?",
    "Afternoon greetings. What question can I answer?",
    "Good afternoon. No task too big or too small.",
    "Peak hours. What's the goal?",
    "Afternoon! Still plenty of day left.",
    "The afternoon is prime time. What are we working on?",
  ],
  evening: [
    "Good evening. What's on your mind tonight?",
    "Evening — winding down or still going strong?",
    "The evening brings good questions. What's yours?",
    "Good evening. The quiet hours are great for focus.",
    "Evening's here. What would you like to accomplish?",
    "Good evening. I work just as well after sunset.",
    "Evening! Big ideas often arrive at this hour.",
  ],
  night: [
    "Still at it? I admire the dedication.",
    "The late hours belong to curious minds.",
    "Night owl energy. What's keeping you going?",
    "Late night session — what's the mission?",
    "The world is quiet. Good time for deep work.",
    "Can't sleep? Or won't? Either way, I'm here.",
    "The stars are out. What's on your mind?",
    "Late night question — I love those. What is it?",
    "Night mode: engaged.",
  ],
}

const MONDAY_GREETINGS = [
  "New week, new possibilities. What's first?",
  "Monday — a clean slate. What are we building?",
  "Let's start the week strong.",
]

const FRIDAY_GREETINGS = [
  "Friday energy! Let's finish strong.",
  "Almost the weekend — let's make it count.",
  "TGIF! What needs to get done before you sign off?",
]

const WEEKEND_GREETINGS = [
  "Weekend mode — working on something personal?",
  "Even on weekends, curious minds keep going.",
  "A weekend question? You're dedicated.",
  "Taking a break from the break to get something done?",
]

const NAMED_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning, {name}!",
    "Morning, {name}. What's on the agenda?",
    "Hey {name} — ready to start something great?",
    "Good morning, {name}. Where shall we begin?",
  ],
  afternoon: [
    "Good afternoon, {name}.",
    "Hey {name}! What do you need?",
    "Good afternoon, {name} — still crushing it?",
  ],
  evening: [
    "Good evening, {name}.",
    "Evening, {name}! What's left on the list?",
    "Hey {name} — what's on your mind?",
  ],
  night: [
    "Still up, {name}?",
    "Late night, {name}? What do you need?",
    "Hey {name} — burning the midnight oil?",
  ],
}

export function getGreeting(userName?: string): string {
  const timeOfDay = getTimeOfDay()
  const dayContext = getDayContext()

  // 25% chance of timeless/atmosphere/momentum greeting regardless of time
  const rng = Math.random()
  if (rng < 0.15) {
    return TIMELESS_GREETINGS[Math.floor(Math.random() * TIMELESS_GREETINGS.length)]
  }
  if (rng < 0.25) {
    return ATMOSPHERE_GREETINGS[Math.floor(Math.random() * ATMOSPHERE_GREETINGS.length)]
  }
  if (rng < 0.32) {
    return MOMENTUM_GREETINGS[Math.floor(Math.random() * MOMENTUM_GREETINGS.length)]
  }

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
