import { sampleTree } from '../../test/fixtures'
import { describeCatalog, summarizeCatalog } from './catalog-stats'

describe('summarizeCatalog', () => {
  it('counts nothing for an empty catalog', () => {
    expect(summarizeCatalog([])).toEqual({ total: 0, classes: 0, withMovements: 0 })
  })

  it('counts every account at any depth, the classes and the ones that accept movements', () => {
    expect(summarizeCatalog(sampleTree())).toEqual({ total: 8, classes: 2, withMovements: 3 })
  })
})

describe('describeCatalog', () => {
  it('reads as a sentence with the right plurals', () => {
    expect(describeCatalog({ total: 8, classes: 2, withMovements: 3 })).toBe(
      '8 cuentas en 2 clases; 3 admiten movimientos.',
    )
  })

  it('uses the singular when there is only one of each', () => {
    expect(describeCatalog({ total: 1, classes: 1, withMovements: 1 })).toBe(
      '1 cuenta en 1 clase; 1 admite movimientos.',
    )
  })
})
