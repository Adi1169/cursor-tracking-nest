import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { GenerateRandomColor } from 'src/common/utils';
import { CursorPosDto, CursorBroadcastDto } from 'src/dto/cursor.dto';
import { JoinRoomDto } from 'src/dto/room.dto';
import { UsePipes } from '@nestjs/common';
import { WsValidationPipe } from './gateway-validation.pipe';

interface CustomSocket extends Socket {
  userId: string;
  room: string;
  cursorColor: string;
}

@UsePipes(WsValidationPipe)
@WebSocketGateway()
export class CursorGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly redisClient;
  constructor(private readonly redisService: RedisService) {
    this.redisClient = this.redisService.getClient();
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: CustomSocket,
  ) {
    // Set the user's name, room and cursor color
    client.userId = joinRoomDto.userId;
    client.room = joinRoomDto.room;
    client.cursorColor = this.getUserRoomColor(joinRoomDto.room);

    // Subscribe the client to the room
    client.join(joinRoomDto.room);

    client.emit('joinRoom', {
      message: `You have joined room ${joinRoomDto.room}`,
      cursorColor: client.cursorColor,
    });
  }

  @SubscribeMessage('cursorMove')
  handleCursorMove(
    @MessageBody() data: CursorPosDto,
    @ConnectedSocket() client: CustomSocket,
  ) {
    if (!client.userId || !client.room) {
      // if the client is not subscribed to a room, ask them to join a room first
      client.emit('cursorMove', {
        message: 'Please join a room first using joinRoom Event',
      });
    }

    const cursorBoardcastDto: CursorBroadcastDto = {
      id: client.userId,
      cursorColor: client.cursorColor,
      cursorPos: data,
    };
    // Emit the cursor position to all clients in the specified room (room) except the sender
    this.server.to(client.room).emit('cursorMove', cursorBoardcastDto);
  }

  handleDisconnect(client: CustomSocket) {
    // Remove the user's cursor color from the room
    if (client.room) {
      this.redisClient.srem(client.room, client.cursorColor);
    }
  }

  private getUserRoomColor(room: string): string {
    // Generate a random color and check if it is already in use
    let color = GenerateRandomColor();

    // check in redis set with room name
    // if color is already in use, generate
    // a new color and check again
    while (!this.redisClient.sismember(room, color)) {
      color = GenerateRandomColor();
    }
    this.redisClient.sadd(room, color);
    return color;
  }
}
