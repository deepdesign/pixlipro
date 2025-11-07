export interface Palette {
  id: string
  name: string
  colors: string[]
}

export const palettes: Palette[] = [
  {
    id: 'neon',
    name: 'Neon Pop',
    colors: ['#ff3cac', '#784ba0', '#2b86c5', '#00f5d4', '#fcee0c'],
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    colors: ['#f7c5cc', '#ffdee8', '#c4f3ff', '#d9f0ff', '#fdf5d7'],
  },
  {
    id: 'sunset',
    name: 'Sunset Drive',
    colors: ['#ff7b00', '#ff5400', '#ff0054', '#ad00ff', '#6300ff'],
  },
  {
    id: 'synth',
    name: 'Synthwave',
    colors: ['#ff4ecd', '#ff9f1c', '#2ec4b6', '#cbf3f0', '#011627'],
  },
]

export const defaultPaletteId = 'neon'

export const getPalette = (id: string) => palettes.find((palette) => palette.id === id) ?? palettes[0]

export const getRandomPalette = () => palettes[Math.floor(Math.random() * palettes.length)]

