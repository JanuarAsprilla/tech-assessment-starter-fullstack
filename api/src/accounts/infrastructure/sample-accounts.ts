import { Account } from '../domain/account.js';
import { AccountCode } from '../domain/account-code.js';
import { Nature } from '../domain/nature.js';

/** Catálogo de ejemplo del enunciado. Sirve de semilla y de fixture de pruebas. */
export function sampleAccounts(): Account[] {
  const code = (raw: string) => AccountCode.create(raw);

  const asset = Account.createClass({
    code: code('1'),
    name: 'Activo',
    nature: Nature.Debit,
  });
  const available = Account.createChild(asset, {
    code: code('11'),
    name: 'Disponible',
  });
  const cash = Account.createChild(available, {
    code: code('1105'),
    name: 'Caja',
  });
  const cashGeneral = Account.createChild(cash, {
    code: code('110505'),
    name: 'Caja general',
  });
  const pettyCash = Account.createChild(cash, {
    code: code('110510'),
    name: 'Caja menor',
  });

  const liability = Account.createClass({
    code: code('2'),
    name: 'Pasivo',
    nature: Nature.Credit,
  });
  const financialDebt = Account.createChild(liability, {
    code: code('21'),
    name: 'Obligaciones financieras',
  });
  const nationalBanks = Account.createChild(financialDebt, {
    code: code('2105'),
    name: 'Bancos nacionales',
  });

  return [
    asset,
    available,
    cash,
    cashGeneral,
    pettyCash,
    liability,
    financialDebt,
    nationalBanks,
  ];
}
