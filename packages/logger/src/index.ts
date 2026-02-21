import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface LoggerOptions {
  service: string;
  level?: string;
  logDir?: string;
}

/**
 * 통합 로거 생성
 * - 콘솔 출력
 * - 일별 로테이션 파일 출력
 * - JSON 포맷 (구조화 로깅)
 */
export function createLogger(options: LoggerOptions): winston.Logger {
  const { service, level = 'info', logDir = 'logs' } = options;

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service: svc, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] [${svc}] ${level}: ${message}${metaStr}`;
    }),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: `${service}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: `${service}-error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      level: 'error',
      format: logFormat,
    }),
  ];

  return winston.createLogger({
    level,
    defaultMeta: { service },
    transports,
  });
}

export { winston };
