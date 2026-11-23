/** Naturaleza contable. Se define en la clase y la heredan todos sus descendientes. */
export const Nature = {
  Debit: 'debit',
  Credit: 'credit',
} as const;

export type Nature = (typeof Nature)[keyof typeof Nature];
