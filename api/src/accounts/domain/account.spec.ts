import { Account } from './account.js';
import { AccountCode } from './account-code.js';
import {
  InvalidAccountNameError,
  InvalidAccountParentError,
} from './errors.js';
import { Nature } from './nature.js';

const code = (raw: string) => AccountCode.create(raw);

describe('Account', () => {
  describe('createClass', () => {
    it('creates a class with the given nature', () => {
      const account = Account.createClass({
        code: code('1'),
        name: 'Activo',
        nature: Nature.Debit,
      });

      expect(account.code.value).toBe('1');
      expect(account.name).toBe('Activo');
      expect(account.nature).toBe(Nature.Debit);
    });

    it('rejects a code that is not a class', () => {
      expect(() =>
        Account.createClass({
          code: code('11'),
          name: 'Disponible',
          nature: Nature.Debit,
        }),
      ).toThrow(InvalidAccountParentError);
    });
  });

  describe('createChild', () => {
    const asset = Account.createClass({
      code: code('1'),
      name: 'Activo',
      nature: Nature.Debit,
    });
    const liability = Account.createClass({
      code: code('2'),
      name: 'Pasivo',
      nature: Nature.Credit,
    });

    it('inherits the nature from its parent', () => {
      expect(
        Account.createChild(asset, { code: code('11'), name: 'Disponible' })
          .nature,
      ).toBe(Nature.Debit);
      expect(
        Account.createChild(liability, {
          code: code('21'),
          name: 'Obligaciones',
        }).nature,
      ).toBe(Nature.Credit);
    });

    it('rejects a child whose code does not descend directly from the parent', () => {
      expect(() =>
        Account.createChild(asset, { code: code('1105'), name: 'Caja' }),
      ).toThrow(InvalidAccountParentError);
      expect(() =>
        Account.createChild(asset, { code: code('21'), name: 'Obligaciones' }),
      ).toThrow(InvalidAccountParentError);
    });
  });

  describe('name', () => {
    it('trims the name', () => {
      const account = Account.createClass({
        code: code('1'),
        name: '  Activo  ',
        nature: Nature.Debit,
      });
      expect(account.name).toBe('Activo');
    });

    it.each([
      ['empty', ''],
      ['blank', '    '],
      ['too long', 'a'.repeat(121)],
    ])('rejects an invalid name (%s)', (_label, name) => {
      expect(() =>
        Account.createClass({ code: code('1'), name, nature: Nature.Debit }),
      ).toThrow(InvalidAccountNameError);
    });
  });
});
