// Diverse, personalized greeting messages for Harbor's empty state.
// All strings are translatable via i18n system.

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type GreetingCategory = 'timeless' | 'atmosphere' | 'momentum' | 'morning' | 'afternoon' | 'evening' | 'night' | 'monday' | 'friday' | 'weekend' | 'named_morning' | 'named_afternoon' | 'named_evening' | 'named_night' | 'motivation' | 'creative' | 'productive' | 'collaborative' | 'encouraging' | 'focused' | 'timesensitive' | 'stats'

// Storage key for tracking last greeting
const LAST_GREETING_KEY = 'harbor_last_greeting'

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

export function getLastGreeting(): string | null {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    // Can't use async here, so we store in sessionStorage as fallback
    try {
      return sessionStorage?.getItem(LAST_GREETING_KEY) || null
    } catch {
      return null
    }
  }
  return null
}

export function setLastGreeting(greeting: string): void {
  try {
    sessionStorage?.setItem(LAST_GREETING_KEY, greeting)
  } catch {
    // Ignore storage errors
  }
}

// Helper to safely get translated greeting
function getGreetingKey(t: any, key: string): string {
  try {
    return t(`greetings.${key}`)
  } catch {
    return ''
  }
}

// Helper to get translated greeting arrays
function getTimelessGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 40; i++) {
    const g = getGreetingKey(t, `timeless_${i}`)
    if (g && g !== `greetings.timeless_${i}`) greetings.push(g)
  }
  return greetings
}

function getAtmosphereGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 25; i++) {
    const g = getGreetingKey(t, `atmosphere_${i}`)
    if (g && g !== `greetings.atmosphere_${i}`) greetings.push(g)
  }
  return greetings
}

function getMomentumGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 25; i++) {
    const g = getGreetingKey(t, `momentum_${i}`)
    if (g && g !== `greetings.momentum_${i}`) greetings.push(g)
  }
  return greetings
}

function getMotivationGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 35; i++) {
    const g = getGreetingKey(t, `motivation_${i}`)
    if (g && g !== `greetings.motivation_${i}`) greetings.push(g)
  }
  return greetings
}

function getCreativeGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 35; i++) {
    const g = getGreetingKey(t, `creative_${i}`)
    if (g && g !== `greetings.creative_${i}`) greetings.push(g)
  }
  return greetings
}

function getProductiveGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 30; i++) {
    const g = getGreetingKey(t, `productive_${i}`)
    if (g && g !== `greetings.productive_${i}`) greetings.push(g)
  }
  return greetings
}

function getCollaborativeGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 25; i++) {
    const g = getGreetingKey(t, `collaborative_${i}`)
    if (g && g !== `greetings.collaborative_${i}`) greetings.push(g)
  }
  return greetings
}

function getEncouragingGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 30; i++) {
    const g = getGreetingKey(t, `encouraging_${i}`)
    if (g && g !== `greetings.encouraging_${i}`) greetings.push(g)
  }
  return greetings
}

function getFocusedGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 30; i++) {
    const g = getGreetingKey(t, `focused_${i}`)
    if (g && g !== `greetings.focused_${i}`) greetings.push(g)
  }
  return greetings
}

function getWeatherGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 25; i++) {
    const g = getGreetingKey(t, `weather_${i}`)
    if (g && g !== `greetings.weather_${i}`) greetings.push(g)
  }
  return greetings
}

function getStatsGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 20; i++) {
    const g = getGreetingKey(t, `stats_${i}`)
    if (g && g !== `greetings.stats_${i}`) greetings.push(g)
  }
  return greetings
}

function getTimeSensitiveGreetings(t: any): string[] {
  const greetings: string[] = []
  for (let i = 1; i <= 20; i++) {
    const g = getGreetingKey(t, `timesensitive_${i}`)
    if (g && g !== `greetings.timesensitive_${i}`) greetings.push(g)
  }
  return greetings
}

function getTimeOfDayGreetings(t: any, timeOfDay: TimeOfDay): string[] {
  const greetingMap: Record<TimeOfDay, string[]> = {
    morning: [
      t('greetings.morning_1'),
      t('greetings.morning_2'),
      t('greetings.morning_3'),
      t('greetings.morning_4'),
      t('greetings.morning_5'),
      t('greetings.morning_6'),
      t('greetings.morning_7'),
      t('greetings.morning_8'),
      t('greetings.morning_9'),
      t('greetings.morning_10'),
    ],
    afternoon: [
      t('greetings.afternoon_1'),
      t('greetings.afternoon_2'),
      t('greetings.afternoon_3'),
      t('greetings.afternoon_4'),
      t('greetings.afternoon_5'),
      t('greetings.afternoon_6'),
      t('greetings.afternoon_7'),
      t('greetings.afternoon_8'),
    ],
    evening: [
      t('greetings.evening_1'),
      t('greetings.evening_2'),
      t('greetings.evening_3'),
      t('greetings.evening_4'),
      t('greetings.evening_5'),
      t('greetings.evening_6'),
      t('greetings.evening_7'),
    ],
    night: [
      t('greetings.night_1'),
      t('greetings.night_2'),
      t('greetings.night_3'),
      t('greetings.night_4'),
      t('greetings.night_5'),
      t('greetings.night_6'),
      t('greetings.night_7'),
      t('greetings.night_8'),
      t('greetings.night_9'),
    ],
  }
  return greetingMap[timeOfDay]
}

function getMondayGreetings(t: any): string[] {
  return [
    t('greetings.monday_1'),
    t('greetings.monday_2'),
    t('greetings.monday_3'),
  ]
}

function getFridayGreetings(t: any): string[] {
  return [
    t('greetings.friday_1'),
    t('greetings.friday_2'),
    t('greetings.friday_3'),
  ]
}

function getWeekendGreetings(t: any): string[] {
  return [
    t('greetings.weekend_1'),
    t('greetings.weekend_2'),
    t('greetings.weekend_3'),
    t('greetings.weekend_4'),
  ]
}

function getNamedGreetings(t: any, timeOfDay: TimeOfDay): string[] {
  const greetingMap: Record<TimeOfDay, string[]> = {
    morning: [
      t('greetings.named_morning_1'),
      t('greetings.named_morning_2'),
      t('greetings.named_morning_3'),
      t('greetings.named_morning_4'),
    ],
    afternoon: [
      t('greetings.named_afternoon_1'),
      t('greetings.named_afternoon_2'),
      t('greetings.named_afternoon_3'),
    ],
    evening: [
      t('greetings.named_evening_1'),
      t('greetings.named_evening_2'),
      t('greetings.named_evening_3'),
    ],
    night: [
      t('greetings.named_night_1'),
      t('greetings.named_night_2'),
      t('greetings.named_night_3'),
    ],
  }
  return greetingMap[timeOfDay]
}

export function getGreeting(t: any, userName?: string): string {
  const timeOfDay = getTimeOfDay()
  const dayContext = getDayContext()

  // 25% chance of timeless/atmosphere/momentum greeting regardless of time
  const rng = Math.random()
  if (rng < 0.15) {
    const greetings = getTimelessGreetings(t)
    return greetings[Math.floor(Math.random() * greetings.length)]
  }
  if (rng < 0.25) {
    const greetings = getAtmosphereGreetings(t)
    return greetings[Math.floor(Math.random() * greetings.length)]
  }
  if (rng < 0.32) {
    const greetings = getMomentumGreetings(t)
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Day-specific overrides (morning only for Monday/Friday)
  if (timeOfDay === 'morning') {
    if (dayContext === 'monday' && Math.random() > 0.5) {
      const greetings = getMondayGreetings(t)
      const greeting = greetings[Math.floor(Math.random() * greetings.length)]
      return userName ? greeting.replace('{name}', userName) : greeting
    }
    if (dayContext === 'friday' && Math.random() > 0.5) {
      const greetings = getFridayGreetings(t)
      const greeting = greetings[Math.floor(Math.random() * greetings.length)]
      return userName ? greeting.replace('{name}', userName) : greeting
    }
  }

  if ((dayContext === 'saturday' || dayContext === 'sunday') && Math.random() > 0.6) {
    const greetings = getWeekendGreetings(t)
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]
    return userName ? greeting.replace('{name}', userName) : greeting
  }

  // Use named greetings if user name available (50% chance for variety)
  if (userName && Math.random() > 0.5) {
    const pool = getNamedGreetings(t, timeOfDay)
    const template = pool[Math.floor(Math.random() * pool.length)]
    return template.replace('{name}', userName)
  }

  // Default time-of-day greetings
  const pool = getTimeOfDayGreetings(t, timeOfDay)
  return pool[Math.floor(Math.random() * pool.length)]
}

export const SUGGESTION_PROMPTS = [
  { icon: 'Globe',       key: 'suggestions.full_prompts.summarize_page' },
  { icon: 'Search',      key: 'suggestions.full_prompts.research_topic' },
  { icon: 'ShoppingCart',key: 'suggestions.full_prompts.compare_prices' },
  { icon: 'FileText',    key: 'suggestions.full_prompts.extract_data' },
  { icon: 'Shuffle',     key: 'suggestions.full_prompts.find_alternatives' },
  { icon: 'Layers',      key: 'suggestions.full_prompts.organize_tabs' },
  { icon: 'BookOpen',    key: 'suggestions.full_prompts.deep_research' },
  { icon: 'Camera',      key: 'suggestions.full_prompts.screenshot_walkthrough' },
]
