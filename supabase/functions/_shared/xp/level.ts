export type XPLevel = {
  level: number
  name: string
  levelXp: number
  levelXpRequired: number
  levelProgress: number
}

const LEVEL_NAMES = [
  'Aprendiz',
  'Observador',
  'Aventureiro',
  'Explorador',
  'Desbravador',
  'Navegador',
  'Viajante',
  'Sábio',
  'Mestre',
  'Lendário',
] as const

export function getXPLevel(totalXp: number): XPLevel {
  const xp = Math.max(0, Math.floor(totalXp))

  let level: number
  let levelStart: number

  if (xp < 500) {
    level = 1
    levelStart = 0
  } else if (xp < 1000) {
    level = 2
    levelStart = 500
  } else if (xp < 2000) {
    level = 3
    levelStart = 1000
  } else {
    level = Math.floor((xp - 2000) / 1000) + 4
    levelStart = 2000 + (level - 4) * 1000
  }

  const levelXpRequired = level === 1 ? 500 : level === 2 ? 500 : 1000
  const levelXp = xp - levelStart
  const levelProgress = Math.floor((levelXp / levelXpRequired) * 100)

  return {
    level,
    name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    levelXp,
    levelXpRequired,
    levelProgress: Math.min(100, levelProgress),
  }
}
