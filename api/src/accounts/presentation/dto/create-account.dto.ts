import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { NAME_MAX_LENGTH } from '../../domain/account.js';
import { MAX_CODE_LENGTH } from '../../domain/account-level.js';
import { Nature } from '../../domain/nature.js';

/**
 * Primera barrera: rechaza formas inválidas en el borde. El dominio vuelve a
 * validar sus invariantes, así que ninguna regla depende solo de este DTO.
 */
export class CreateAccountDto {
  @IsString({ message: 'El código debe ser texto.' })
  @Matches(/^\d+$/, { message: 'El código debe contener solo dígitos.' })
  @MaxLength(MAX_CODE_LENGTH, {
    message: `El código no puede superar ${MAX_CODE_LENGTH} dígitos.`,
  })
  code: string;

  @IsString({ message: 'El nombre debe ser texto.' })
  @Matches(/\S/, { message: 'El nombre es obligatorio.' })
  @MaxLength(NAME_MAX_LENGTH, {
    message: `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`,
  })
  name: string;

  @IsOptional()
  @IsIn(Object.values(Nature), {
    message: 'La naturaleza debe ser "debit" o "credit".',
  })
  nature?: Nature;
}
