
import { LogEntry, DoorStatus } from "../types";

// Replaced AI service with deterministic state analysis for Week 11 Milestone
export const analyzeHomeSafety = (
  logs: LogEntry[],
  currentTemp: number,
  isAlarmActive: boolean,
  doorStatus: DoorStatus
): string => {
  // Priority 1: High Temperature Alarm
  if (isAlarmActive) {
    return `⚠️ CRITICAL: Temperature is ${currentTemp}°C! Physical and Software alarms are ACTIVE. Check room immediately.`;
  }

  // Priority 2: Door Open
  if (doorStatus === DoorStatus.OPEN) {
    return "🚪 SECURITY ALERT: Main door is currently OPEN. Please verify authorized access.";
  }

  // Priority 3: Frequent Activity (e.g., more than 3 events in last minute)
  const oneMinuteAgo = Date.now() - 60 * 1000;
  const recentLogs = logs.filter(l => l.timestamp > oneMinuteAgo);
  
  if (recentLogs.length > 2) {
    return `ℹ️ ACTIVITY NOTICE: Frequent door movement detected (${recentLogs.length} events in 1 min).`;
  }

  // Priority 4: Recent Activity
  if (recentLogs.length > 0) {
    const lastEvent = recentLogs[0];
    return `ℹ️ UPDATE: Last door activity was at ${new Date(lastEvent.timestamp).toLocaleTimeString()}. System is currently secure.`;
  }

  // Default: Normal
  return `✅ SYSTEM SECURE: Temperature is stable (${currentTemp}°C). Door is closed. No recent anomalies.`;
};
