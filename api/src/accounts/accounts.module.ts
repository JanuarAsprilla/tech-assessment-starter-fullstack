import { Module, type Provider } from '@nestjs/common';
import { CreateAccount } from './application/create-account.use-case.js';
import { DeleteAccount } from './application/delete-account.use-case.js';
import { GetCatalogTree } from './application/get-catalog-tree.use-case.js';
import type { AccountRepository } from './domain/account-repository.js';
import { ACCOUNT_REPOSITORY } from './accounts.tokens.js';
import { InMemoryAccountRepository } from './infrastructure/in-memory-account-repository.js';
import { sampleAccounts } from './infrastructure/sample-accounts.js';
import { AccountsController } from './presentation/accounts.controller.js';

/** Registra un caso de uso sin decoradores: la capa de aplicación no conoce Nest. */
function useCase<T>(UseCase: new (accounts: AccountRepository) => T): Provider {
  return {
    provide: UseCase,
    useFactory: (accounts: AccountRepository) => new UseCase(accounts),
    inject: [ACCOUNT_REPOSITORY],
  };
}

/** Único lugar que une los casos de uso con su implementación de persistencia. */
@Module({
  controllers: [AccountsController],
  providers: [
    {
      provide: ACCOUNT_REPOSITORY,
      useFactory: (): AccountRepository =>
        new InMemoryAccountRepository(sampleAccounts()),
    },
    useCase(CreateAccount),
    useCase(DeleteAccount),
    useCase(GetCatalogTree),
  ],
})
export class AccountsModule {}
