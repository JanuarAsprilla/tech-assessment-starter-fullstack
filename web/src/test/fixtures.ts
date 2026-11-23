import type { AccountNode } from '../features/accounts/types'

/** Catálogo de ejemplo del enunciado, con la forma exacta que devuelve `GET /accounts/tree`. */
export function sampleTree(): AccountNode[] {
  return [
    {
      code: '1',
      name: 'Activo',
      nature: 'debit',
      level: 'class',
      acceptsMovements: false,
      children: [
        {
          code: '11',
          name: 'Disponible',
          nature: 'debit',
          level: 'group',
          acceptsMovements: false,
          children: [
            {
              code: '1105',
              name: 'Caja',
              nature: 'debit',
              level: 'account',
              acceptsMovements: false,
              children: [
                {
                  code: '110505',
                  name: 'Caja general',
                  nature: 'debit',
                  level: 'subaccount',
                  acceptsMovements: true,
                  children: [],
                },
                {
                  code: '110510',
                  name: 'Caja menor',
                  nature: 'debit',
                  level: 'subaccount',
                  acceptsMovements: true,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: '2',
      name: 'Pasivo',
      nature: 'credit',
      level: 'class',
      acceptsMovements: false,
      children: [
        {
          code: '21',
          name: 'Obligaciones financieras',
          nature: 'credit',
          level: 'group',
          acceptsMovements: false,
          children: [
            {
              code: '2105',
              name: 'Bancos nacionales',
              nature: 'credit',
              level: 'account',
              acceptsMovements: true,
              children: [],
            },
          ],
        },
      ],
    },
  ]
}
