// Environment variable type definitions
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      
      // Database
      DATABASE_URL: string;
      PG_HOST?: string;
      PG_PORT?: string;
      PG_DATABASE?: string;
      PG_USER?: string;
      PG_PASSWORD?: string;
      
      // JWT
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      
      // CORS
      CORS_ORIGIN?: string;
      
      // File Upload
      MAX_FILE_SIZE?: string;
      UPLOAD_PATH?: string;
    }
  }
}

export {};
