import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateAccount } from '../application/create-account.use-case.js';
import { DeleteAccount } from '../application/delete-account.use-case.js';
import { GetCatalogTree } from '../application/get-catalog-tree.use-case.js';
import type { AccountNode, AccountView } from '../application/account-view.js';
import { CreateAccountDto } from './dto/create-account.dto.js';

/** Capa fina: traduce HTTP a casos de uso. No contiene reglas de negocio. */
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly createAccount: CreateAccount,
    private readonly deleteAccount: DeleteAccount,
    private readonly getCatalogTree: GetCatalogTree,
  ) {}

  @Post()
  create(@Body() dto: CreateAccountDto): Promise<AccountView> {
    return this.createAccount.execute(dto);
  }

  @Get('tree')
  tree(): Promise<AccountNode[]> {
    return this.getCatalogTree.execute();
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('code') code: string): Promise<void> {
    return this.deleteAccount.execute({ code });
  }
}
