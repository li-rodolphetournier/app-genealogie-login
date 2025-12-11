/**
 * Système de logging spécialisé pour l'authentification
 * Permet de tracer tous les événements d'auth pour déboguer les problèmes de déconnexion
 */

export type AuthLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type AuthLogEntry = {
  timestamp: string;
  level: AuthLogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
};

class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private maxLogs = 100; // Garder les 100 derniers logs
  private isEnabled = true;
  private listeners: Array<(entry: AuthLogEntry) => void> = [];

  constructor() {
    // En production, désactiver les logs sauf si une variable d'environnement est définie
    if (typeof window !== 'undefined') {
      this.isEnabled = 
        process.env.NODE_ENV === 'development' || 
        window.location.search.includes('debug=auth') ||
        localStorage.getItem('auth-debug') === 'true';
    }
  }

  private addLog(level: AuthLogLevel, category: string, message: string, data?: any) {
    if (!this.isEnabled) return;

    const entry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      stack: level === 'error' ? new Error().stack : undefined,
    };

    this.logs.push(entry);
    
    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notifier les listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Erreur dans un listener de log:', error);
      }
    });

    // Afficher dans la console avec un préfixe coloré
    const prefix = `[AUTH:${category}]`;
    const style = this.getStyle(level);
    
    if (data) {
      console.log(`%c${prefix} ${message}`, style, data);
    } else {
      console.log(`%c${prefix} ${message}`, style);
    }

    // En cas d'erreur, aussi logger dans console.error
    if (level === 'error') {
      console.error(`[AUTH:${category}] ${message}`, data || '', entry.stack);
    }
  }

  private getStyle(level: AuthLogLevel): string {
    const styles = {
      debug: 'color: #6b7280; font-weight: normal',
      info: 'color: #3b82f6; font-weight: normal',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold; background: #fee2e2',
    };
    return styles[level];
  }

  debug(category: string, message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.addLog('error', category, message, data);
  }

  // Méthodes spécialisées pour différents contextes
  login(message: string, data?: any) {
    this.info('LOGIN', message, data);
  }

  logout(message: string, data?: any) {
    this.info('LOGOUT', message, data);
  }

  session(message: string, data?: any) {
    this.debug('SESSION', message, data);
  }

  redirect(from: string, to: string, reason?: string) {
    this.info('REDIRECT', `Redirection: ${from} → ${to}`, { reason });
  }

  middleware(message: string, data?: any) {
    this.debug('MIDDLEWARE', message, data);
  }

  hook(message: string, data?: any) {
    this.debug('HOOK', message, data);
  }

  // Récupérer les logs
  getLogs(): AuthLogEntry[] {
    return [...this.logs];
  }

  // Récupérer les logs d'une catégorie spécifique
  getLogsByCategory(category: string): AuthLogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Récupérer les logs d'un niveau spécifique
  getLogsByLevel(level: AuthLogLevel): AuthLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Exporter les logs au format JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Vider les logs
  clearLogs() {
    this.logs = [];
  }

  // S'abonner aux nouveaux logs
  subscribe(listener: (entry: AuthLogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Activer/désactiver le logging
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Vérifier si le logging est activé
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Instance singleton
export const authLogger = new AuthLogger();

// Exporter aussi les méthodes directement pour faciliter l'utilisation
export const logAuth = {
  debug: (category: string, message: string, data?: any) => authLogger.debug(category, message, data),
  info: (category: string, message: string, data?: any) => authLogger.info(category, message, data),
  warn: (category: string, message: string, data?: any) => authLogger.warn(category, message, data),
  error: (category: string, message: string, data?: any) => authLogger.error(category, message, data),
  login: (message: string, data?: any) => authLogger.login(message, data),
  logout: (message: string, data?: any) => authLogger.logout(message, data),
  session: (message: string, data?: any) => authLogger.session(message, data),
  redirect: (from: string, to: string, reason?: string) => authLogger.redirect(from, to, reason),
  middleware: (message: string, data?: any) => authLogger.middleware(message, data),
  hook: (message: string, data?: any) => authLogger.hook(message, data),
  getLogs: () => authLogger.getLogs(),
  exportLogs: () => authLogger.exportLogs(),
  clearLogs: () => authLogger.clearLogs(),
  subscribe: (listener: (entry: AuthLogEntry) => void) => authLogger.subscribe(listener),
};

