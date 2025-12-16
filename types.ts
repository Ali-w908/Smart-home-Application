export enum DoorStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface LogEntry {
  id: string;
  timestamp: number;
  event: string; // e.g., "Door Opened", "Door Closed"
  type: 'info' | 'alert';
}

export interface AppState {
  lampOn: boolean;
  plugOn: boolean;
  doorStatus: DoorStatus;
  temperature: number;
  buzzerOn: boolean;
  alarmThreshold: number;
  isAlarmActive: boolean;
}

export interface HardwareCommand {
  type: 'SET_LAMP' | 'SET_PLUG' | 'SET_THRESHOLD' | 'SET_BUZZER';
  value: boolean | number;
}