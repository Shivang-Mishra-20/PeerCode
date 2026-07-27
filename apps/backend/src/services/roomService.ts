import { prisma } from '../lib/prisma';
import {
  CreateRoomPayload,
  RoomResponse,
  SaveSnapshotPayload,
  CodeSnapshotDTO,
  SupportedLanguage,
} from '@peercode/shared';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['javascript', 'typescript', 'python', 'cpp'];

export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const isSupportedLanguage = (lang?: string): lang is SupportedLanguage => {
  return typeof lang === 'string' && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

export const createRoom = async (payload: CreateRoomPayload = {}): Promise<RoomResponse> => {
  const language = payload.language || 'javascript';

  if (payload.language && !isSupportedLanguage(payload.language)) {
    throw new ServiceError(
      400,
      `Invalid language specified. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
    );
  }

  const room = await prisma.room.create({
    data: {
      name: payload.name ? payload.name.trim() : null,
      language,
    },
  });

  return {
    id: room.id,
    name: room.name,
    language: room.language as SupportedLanguage,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
};

export const getRoomById = async (id: string): Promise<RoomResponse> => {
  if (!id || typeof id !== 'string') {
    throw new ServiceError(400, 'Room ID is required');
  }

  const room = await prisma.room.findUnique({
    where: { id },
  });

  if (!room) {
    throw new ServiceError(404, `Room with ID '${id}' not found`);
  }

  return {
    id: room.id,
    name: room.name,
    language: room.language as SupportedLanguage,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
};

export interface ExtendedSaveSnapshotPayload extends SaveSnapshotPayload {
  stateBytes?: Buffer | Uint8Array | null;
}

export interface ExtendedCodeSnapshotDTO extends CodeSnapshotDTO {
  stateBytes?: Buffer | null;
}

export const saveSnapshot = async (
  roomId: string,
  payload: ExtendedSaveSnapshotPayload
): Promise<ExtendedCodeSnapshotDTO> => {
  if (!roomId) {
    throw new ServiceError(400, 'Room ID is required');
  }

  if (!payload || typeof payload.content !== 'string') {
    throw new ServiceError(400, 'Snapshot content is required');
  }

  const language = payload.language || 'javascript';

  if (payload.language && !isSupportedLanguage(payload.language)) {
    throw new ServiceError(
      400,
      `Invalid language specified. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
    );
  }

  // Ensure room record exists via upsert
  const room = await prisma.room.upsert({
    where: { id: roomId },
    create: {
      id: roomId,
      language,
    },
    update: {},
  });

  const stateBytesBuffer = payload.stateBytes ? Buffer.from(payload.stateBytes) : null;

  const snapshot = await prisma.codeSnapshot.create({
    data: {
      roomId,
      content: payload.content,
      stateBytes: stateBytesBuffer,
      language: room.language,
    },
  });

  return {
    id: snapshot.id,
    roomId: snapshot.roomId,
    content: snapshot.content,
    stateBytes: snapshot.stateBytes,
    language: snapshot.language as SupportedLanguage,
    createdAt: snapshot.createdAt.toISOString(),
  };
};

export const getLatestSnapshot = async (
  roomId: string
): Promise<ExtendedCodeSnapshotDTO | null> => {
  if (!roomId) {
    throw new ServiceError(400, 'Room ID is required');
  }

  // Gracefully handle uninitialized rooms
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return null;
  }

  const snapshot = await prisma.codeSnapshot.findFirst({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
  });

  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.id,
    roomId: snapshot.roomId,
    content: snapshot.content,
    stateBytes: snapshot.stateBytes,
    language: snapshot.language as SupportedLanguage,
    createdAt: snapshot.createdAt.toISOString(),
  };
};
