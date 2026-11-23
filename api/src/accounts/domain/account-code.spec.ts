import { AccountCode } from './account-code.js';
import { AccountLevel } from './account-level.js';
import { InvalidAccountCodeError } from './errors.js';

describe('AccountCode', () => {
  describe('create', () => {
    it.each(['1', '11', '1105', '110505'])(
      'accepts the valid code %s',
      (raw) => {
        expect(AccountCode.create(raw).value).toBe(raw);
      },
    );

    it.each([
      ['empty', ''],
      ['blank', '   '],
      ['letters', '11a5'],
      ['symbols', '11-05'],
      ['decimal', '11.5'],
      ['sql fragment', "1' OR '1'='1"],
    ])('rejects a non-numeric code (%s)', (_label, raw) => {
      expect(() => AccountCode.create(raw)).toThrow(InvalidAccountCodeError);
    });

    it.each(['111', '11050', '1105051', '12345678901234567890'])(
      'rejects the code %s because its length is not a valid level',
      (raw) => {
        expect(() => AccountCode.create(raw)).toThrow(InvalidAccountCodeError);
      },
    );

    it('trims surrounding whitespace before validating', () => {
      expect(AccountCode.create(' 1105 ').value).toBe('1105');
    });
  });

  describe('level', () => {
    it.each([
      ['1', AccountLevel.Class],
      ['11', AccountLevel.Group],
      ['1105', AccountLevel.Account],
      ['110505', AccountLevel.Subaccount],
    ])('maps code %s to its level', (raw, level) => {
      expect(AccountCode.create(raw).level).toBe(level);
    });
  });

  describe('parent', () => {
    it.each([
      ['110505', '1105'],
      ['1105', '11'],
      ['11', '1'],
    ])('returns %s -> %s', (child, parent) => {
      expect(AccountCode.create(child).parent()?.value).toBe(parent);
    });

    it('returns null for a class, which has no parent', () => {
      expect(AccountCode.create('1').parent()).toBeNull();
    });
  });

  describe('equals', () => {
    it('compares by value', () => {
      expect(
        AccountCode.create('1105').equals(AccountCode.create('1105')),
      ).toBe(true);
      expect(AccountCode.create('1105').equals(AccountCode.create('11'))).toBe(
        false,
      );
    });
  });

  describe('isDescendantOf', () => {
    it('is true when the other code is a prefix at any higher level', () => {
      expect(
        AccountCode.create('110505').isDescendantOf(AccountCode.create('1')),
      ).toBe(true);
      expect(
        AccountCode.create('110505').isDescendantOf(AccountCode.create('1105')),
      ).toBe(true);
    });

    it('is false for unrelated or equal codes', () => {
      expect(
        AccountCode.create('2105').isDescendantOf(AccountCode.create('11')),
      ).toBe(false);
      expect(
        AccountCode.create('11').isDescendantOf(AccountCode.create('11')),
      ).toBe(false);
    });
  });
});
