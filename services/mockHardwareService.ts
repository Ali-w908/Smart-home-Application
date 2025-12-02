import { HardwareCommand, DoorStatus } from '../types';

// In a real app, this would use Bluetooth or HTTP to talk to the Arduino.
// Here, we mock the behavior with local state and event emitters for the "Digital Twin" simulation.

class MockHardwareService {
  private listeners: ((state: any) => void)[] = [];
  
  // Internal simulated state
  private state = {
    lampOn: false,
    plugOn: false,
    buzzerOn: false,
    doorStatus: DoorStatus.CLOSED,
    temperature: 24, // Celsius
  };

  constructor() {
    // Simulate minor temperature fluctuations
    setInterval(() => {
        // Randomly fluctuate temperature by 0.1 degree occasionally
        if (Math.random() > 0.7) {
            const change = (Math.random() - 0.5) * 0.2;
            this.updateState({ temperature: parseFloat((this.state.temperature + change).toFixed(1)) });
        }
    }, 5000);
  }

  // Mimic receiving data from Arduino
  public subscribe(callback: (state: any) => void) {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.state }));
  }

  private updateState(partial: Partial<typeof this.state>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  // Public API to send commands TO the hardware
  public async sendCommand(command: HardwareCommand): Promise<boolean> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    switch (command.type) {
      case 'SET_LAMP':
        this.updateState({ lampOn: command.value as boolean });
        break;
      case 'SET_PLUG':
        this.updateState({ plugOn: command.value as boolean });
        break;
      case 'SET_BUZZER':
        this.updateState({ buzzerOn: command.value as boolean });
        break;
      // Threshold is usually handled software-side in the app, 
      // but some embedded systems might want to know it.
    }
    return true;
  }

  // --- Simulation Tools (For the User Interface specific to testing) ---
  // These wouldn't exist in the prod app, but are needed for the demo since we have no sensors.
  public simulateDoorChange(isOpen: boolean) {
    this.updateState({ doorStatus: isOpen ? DoorStatus.OPEN : DoorStatus.CLOSED });
  }

  public simulateTempChange(temp: number) {
    this.updateState({ temperature: temp });
  }
}

export const hardwareService = new MockHardwareService();