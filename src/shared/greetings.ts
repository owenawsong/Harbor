// Diverse, personalized greeting messages for Harbor's empty state.
// All strings are translatable via i18n system.

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

// Helper to get translated greeting arrays
function getTimelessGreetings(t: any): string[] {
  return [
    t('greetings.timeless_1'),
    t('greetings.timeless_2'),
    t('greetings.timeless_3'),
    t('greetings.timeless_4'),
    t('greetings.timeless_5'),
    t('greetings.timeless_6'),
    t('greetings.timeless_7'),
    t('greetings.timeless_8'),
    t('greetings.timeless_9'),
    t('greetings.timeless_10'),
    t('greetings.timeless_11'),
    t('greetings.timeless_12'),
    t('greetings.timeless_13'),
    t('greetings.timeless_14'),
    t('greetings.timeless_15'),
    t('greetings.timeless_16'),
    t('greetings.timeless_17'),
    t('greetings.timeless_18'),
  ]
}

function getAtmosphereGreetings(t: any): string[] {
  return [
    t('greetings.atmosphere_1'),
    t('greetings.atmosphere_2'),
    t('greetings.atmosphere_3'),
    t('greetings.atmosphere_4'),
    t('greetings.atmosphere_5'),
    t('greetings.atmosphere_6'),
    t('greetings.atmosphere_7'),
    t('greetings.atmosphere_8'),
  ]
}

function getMomentumGreetings(t: any): string[] {
  return [
    t('greetings.momentum_1'),
    t('greetings.momentum_2'),
    t('greetings.momentum_3'),
    t('greetings.momentum_4'),
    t('greetings.momentum_5'),
    t('greetings.momentum_6'),
    t('greetings.momentum_7'),
  ]
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
