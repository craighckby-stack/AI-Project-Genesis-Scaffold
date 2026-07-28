import { ChatCommandType } from '../types';

export interface CommandPayloadMap {
  SET_PARAM: { key: string; value: number | string };
  BASH: { command: string; timeout?: number };
  FILE_WRITE: { path: string; content: string };
  // Add additional strict mappings here
}



