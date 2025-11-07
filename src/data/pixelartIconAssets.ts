import gamepadIcon from 'pixelarticons/svg/gamepad.svg?url'
import lightbulbIcon from 'pixelarticons/svg/lightbulb.svg?url'
import mastodonIcon from 'pixelarticons/svg/mastodon.svg?url'
import moonIcon from 'pixelarticons/svg/moon.svg?url'
import moonStarsIcon from 'pixelarticons/svg/moon-stars.svg?url'
import musicIcon from 'pixelarticons/svg/music.svg?url'
import paintBucketIcon from 'pixelarticons/svg/paint-bucket.svg?url'
import pixelarticonsIcon from 'pixelarticons/svg/pixelarticons.svg?url'
import shipIcon from 'pixelarticons/svg/ship.svg?url'
import sunIcon from 'pixelarticons/svg/sun.svg?url'
import sunAltIcon from 'pixelarticons/svg/sun-alt.svg?url'
import teaIcon from 'pixelarticons/svg/tea.svg?url'
import trophyIcon from 'pixelarticons/svg/trophy.svg?url'

export interface PixelArtIconAsset {
  id: string
  label: string
  url: string
}

const iconAsset = (id: string, label: string, url: string): PixelArtIconAsset => ({ id, label, url })

export const pixelArtIconAssets: PixelArtIconAsset[] = [
  iconAsset('sun', 'Sun Burst', sunIcon),
  iconAsset('sun-alt', 'Sun Alt', sunAltIcon),
  iconAsset('moon', 'Moon', moonIcon),
  iconAsset('moon-stars', 'Moon + Stars', moonStarsIcon),
  iconAsset('ship', 'Starship', shipIcon),
  iconAsset('gamepad', 'Gamepad', gamepadIcon),
  iconAsset('trophy', 'Trophy', trophyIcon),
  iconAsset('paint-bucket', 'Paint Bucket', paintBucketIcon),
  iconAsset('lightbulb', 'Lightbulb', lightbulbIcon),
  iconAsset('music', 'Music', musicIcon),
  iconAsset('tea', 'Tea', teaIcon),
  iconAsset('mastodon', 'Mastodon', mastodonIcon),
  iconAsset('pixelarticons', 'Pixelarticons', pixelarticonsIcon),
]

export const pixelArtIconIds = pixelArtIconAssets.map((icon) => icon.id)

export const getPixelArtIconById = (id: string) => pixelArtIconAssets.find((icon) => icon.id === id)

