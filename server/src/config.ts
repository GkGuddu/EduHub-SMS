import mongoose from 'mongoose';
import dns from 'dns';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
}

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGO_URI: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z
    .string({
      required_error: 'Configuration error: JWT_SECRET environment variable is required.',
    })
    .min(10, 'Configuration error: JWT_SECRET must be at least 10 characters long.'),
  COOKIE_SECRET: z
    .string({
      required_error: 'Configuration error: COOKIE_SECRET environment variable is required.',
    })
    .min(10, 'Configuration error: COOKIE_SECRET must be at least 10 characters long.'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ [EduHub SMS] Invalid server environment configuration:');
  const formattedErrors = parsed.error.format();
  for (const [key, value] of Object.entries(formattedErrors)) {
    if (key !== '_errors' && value && (value as any)._errors?.length > 0) {
      console.error(`  - ${key}: ${(value as any)._errors.join(', ')}`);
    }
  }
  console.error('\nPlease verify your .env file or hosting environment variables.\n');
  process.exit(1);
}

export const env = parsed.data;

export function getMongoUri(): string {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || env.MONGO_URI || env.MONGODB_URI;
  if (!uri || uri.trim().length === 0) {
    throw new Error('Database configuration error: MONGO_URI or MONGODB_URI environment variable is missing.');
  }
  return uri;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('Authentication configuration error: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET || env.COOKIE_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('Cookie configuration error: COOKIE_SECRET environment variable is missing.');
  }
  return secret;
}

export function getAuthCookieOptions(maxAgeOverride?: number): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
  maxAge: number;
} {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeOverride !== undefined ? maxAgeOverride : 7 * 24 * 60 * 60 * 1000,
  };
}

export function validateCloudinaryConfig(): {
  isConfigured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

  const isConfigured = missing.length === 0;
  if (isConfigured) {
    console.log(
      `[Cloudinary] Cloudinary configured successfully for cloud: "${process.env.CLOUDINARY_CLOUD_NAME}".`
    );
  } else {
    console.warn(
      `[Cloudinary] Cloudinary environment variables missing: ${missing.join(', ')}. Image/PDF uploads to Cloudinary will run in local mock mode.`
    );
  }

  return { isConfigured, missing };
}

export async function connectDB(): Promise<void> {
  const uri = getMongoUri();
  try {
    await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    const isAtlas = uri.includes('mongodb+srv') || uri.includes('mongodb.net');
    if (isAtlas) {
      console.log('[Database] MongoDB Atlas connected successfully');
    } else {
      console.log('[Database] Local MongoDB connected successfully');
    }
  } catch (error: any) {
    console.error('[Database] MongoDB connection failed:', error?.message || error);
    process.exit(1);
  }
}
