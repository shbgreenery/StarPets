import { ok } from '../../utils/response'
import { CONSUMABLES } from '../../utils/catalog'

// 商店道具目录
export default defineEventHandler(() => {
  return ok(CONSUMABLES)
})
