import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    try {
      const validationPipe = new ValidationPipe();
      await validationPipe.transform(value, metadata);
      return value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new WsException(error.getResponse());
      }
      throw error;
    }
  }
}
