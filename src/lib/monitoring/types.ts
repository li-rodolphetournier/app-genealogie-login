/**
 * Types pour le système de monitoring
 */

export type SecurityAlertLevel = 'low' | 'medium' | 'high' | 'critical';

export type SecurityAlertType = 
  | 'failed_login'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'file_upload_failed'
  | 'validation_error'
  | 'csrf_failed'
  | 'sql_injection_attempt'
  | 'xss_attempt';

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  level: SecurityAlertLevel;
  message: string;
  timestamp: string;
  ip?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

export interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  alertsLast24h: number;
  alertsLast7d: number;
  topAlertTypes: Array<{ type: SecurityAlertType; count: number }>;
}

export interface SecurityTestResult {
  id: string;
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  timestamp: string;
  duration: number;
  details?: string;
  error?: string;
}

