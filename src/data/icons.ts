export type PixelGrid = string[]

export interface PixelIcon {
  id: string
  name: string
  grid: PixelGrid
  tags?: string[]
}

const createIcon = (id: string, grid: string[], name?: string, tags?: string[]): PixelIcon => ({
  id,
  name: name ?? id,
  grid,
  tags,
})

export const pixelIcons: PixelIcon[] = [
  createIcon('alien', ['00111100', '01111110', '11100111', '11111111', '11111111', '10111101', '10011001', '01100110'], 'Alien'),
  createIcon('ghost', ['00111000', '01111100', '11111110', '11011011', '11111111', '11111111', '10100101', '01000010'], 'Ghost'),
  createIcon('heart', ['00000000', '01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'], 'Heart'),
  createIcon('skull', ['00111100', '01111110', '11011011', '11011011', '11011011', '01111110', '00100100', '00111100'], 'Skull'),
  createIcon('rocket', ['00011000', '00111100', '01111110', '11111111', '11111111', '01111110', '00100100', '01000010'], 'Rocket'),
  createIcon('flower', ['00011000', '00111100', '01111110', '00111100', '11111111', '01100110', '00100100', '01000010'], 'Flower'),
  createIcon('cat', ['00111100', '01111110', '10100101', '10111101', '11111111', '11111111', '10100101', '01000010'], 'Cat'),
  createIcon('ship', ['00000000', '00011000', '00111100', '01111110', '11111111', '01111110', '00111100', '00011000'], 'Ship'),
]

export const getRandomIcon = () => pixelIcons[Math.floor(Math.random() * pixelIcons.length)]

