import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  isNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPosDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class CursorBroadcastDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  cursorColor: string;

  @ValidateNested()
  @Type(() => CursorPosDto)
  cursorPos: CursorPosDto;
}
