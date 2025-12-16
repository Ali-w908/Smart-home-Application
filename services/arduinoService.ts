import { DoorStatus } from '../types';

// Arduino HTTP Service - Real communication with ESP8266 via WiFi
// This replaces the mock service for actual hardware integration

export interface ArduinoState {
    lampOn: boolean;        // Relay state (physical XOR happens with switch in series)
    plugOn: boolean;
    buzzerOn: boolean;
    doorStatus: DoorStatus;
    temperature: number;
    alarmThreshold: number;
    isConnected: boolean;
}

export type ArduinoCommand =
    | { type: 'LAMP_ON' }
    | { type: 'LAMP_OFF' }
    | { type: 'LAMP_TOGGLE' }
    | { type: 'PLUG_ON' }
    | { type: 'PLUG_OFF' }
    | { type: 'SET_THRESHOLD'; value: number }
    | { type: 'ALARM_ON' }
    | { type: 'ALARM_OFF' }
    | { type: 'STATUS' };

class ArduinoService {
    private listeners: ((state: ArduinoState) => void)[] = [];
    private arduinoIP: string = '';
    private pollingInterval: number | null = null;
    private isPolling: boolean = false;

    private state: ArduinoState = {
        lampOn: false,
        plugOn: false,
        buzzerOn: false,
        doorStatus: DoorStatus.CLOSED,
        temperature: 0,
        alarmThreshold: 27.0,
        isConnected: false,
    };

    // Set the Arduino IP address and start polling
    public connect(ip: string): void {
        this.arduinoIP = ip;
        this.startPolling();
    }

    public disconnect(): void {
        this.stopPolling();
        this.updateState({ isConnected: false });
    }

    public getIP(): string {
        return this.arduinoIP;
    }

    public isConnected(): boolean {
        return this.state.isConnected;
    }

    // Subscribe to state updates
    public subscribe(callback: (state: ArduinoState) => void): () => void {
        this.listeners.push(callback);
        callback(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify(): void {
        this.listeners.forEach(cb => cb({ ...this.state }));
    }

    private updateState(partial: Partial<ArduinoState>): void {
        this.state = { ...this.state, ...partial };
        this.notify();
    }

    // Start polling Arduino for status every 2 seconds
    private startPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Immediate first fetch
        this.fetchStatus();

        this.pollingInterval = window.setInterval(() => {
            this.fetchStatus();
        }, 2000);
    }

    private stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Fetch current status from Arduino
    private async fetchStatus(): Promise<void> {
        if (!this.arduinoIP || this.isPolling) return;

        this.isPolling = true;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`http://${this.arduinoIP}/STATUS`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.text();
            this.parseStatus(data);
            this.updateState({ isConnected: true });

        } catch (error) {
            console.error('Arduino fetch error:', error);
            this.updateState({ isConnected: false });
        } finally {
            this.isPolling = false;
        }
    }

    // Parse Arduino status response
    // Format: "TEMP:XX.XX,DOOR:STATUS,LAMP:STATUS,PLUG:STATUS,ALARM:STATUS,THRESHOLD:XX.X"
    private parseStatus(data: string): void {
        const parts = data.split(',');
        const statusObj: Partial<ArduinoState> = {};

        for (const part of parts) {
            const [key, value] = part.split(':');

            switch (key) {
                case 'TEMP':
                    statusObj.temperature = parseFloat(value);
                    break;
                case 'DOOR':
                    statusObj.doorStatus = value === 'OPEN' ? DoorStatus.OPEN : DoorStatus.CLOSED;
                    break;
                case 'LAMP':
                    statusObj.lampOn = value === 'ON';
                    break;
                case 'PLUG':
                    statusObj.plugOn = value === 'ON';
                    break;
                case 'ALARM':
                    statusObj.buzzerOn = value === 'ALARM';
                    break;
                case 'THRESHOLD':
                    statusObj.alarmThreshold = parseFloat(value);
                    break;
            }
        }

        this.updateState(statusObj);
    }

    // Send command to Arduino
    public async sendCommand(command: ArduinoCommand): Promise<boolean> {
        if (!this.arduinoIP) {
            console.error('No Arduino IP configured');
            return false;
        }

        let endpoint = '';

        switch (command.type) {
            case 'LAMP_ON':
                endpoint = 'LAMP_ON';
                break;
            case 'LAMP_OFF':
                endpoint = 'LAMP_OFF';
                break;
            case 'LAMP_TOGGLE':
                endpoint = 'LAMP_TOGGLE';
                break;
            case 'PLUG_ON':
                endpoint = 'PLUG_ON';
                break;
            case 'PLUG_OFF':
                endpoint = 'PLUG_OFF';
                break;
            case 'SET_THRESHOLD':
                endpoint = `SET_THRESHOLD:${command.value.toFixed(1)}`;
                break;
            case 'ALARM_ON':
                endpoint = 'ALARM_ON';
                break;
            case 'ALARM_OFF':
                endpoint = 'ALARM_OFF';
                break;
            case 'STATUS':
                endpoint = 'STATUS';
                break;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`http://${this.arduinoIP}/${endpoint}`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Parse the response to update local state
            const data = await response.text();
            this.parseStatus(data);
            this.updateState({ isConnected: true });

            return true;

        } catch (error) {
            console.error('Arduino command error:', error);
            this.updateState({ isConnected: false });
            return false;
        }
    }
}

// Export singleton instance
export const arduinoService = new ArduinoService();
