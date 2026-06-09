import { time } from 'drizzle-orm/mysql-core';
import { pgTable, uuid, text, boolean, timestamp, pgEnum , integer} from 'drizzle-orm/pg-core';
import { redis } from '../config/redis.js';
export const roleEnum = pgEnum('role', ['user', 'admin']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull().unique(),
  role: roleEnum('role').default('user'),
  provider: text('provider').default('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('apikeys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name : text('name'),
  key: text('key').notNull().unique(),
  isActive : boolean().notNull().default(true),
  url :  text('url'),
  rateLimit: integer('rate_limit').notNull().default(100),
  createdAT : timestamp('created_at').defaultNow()
})

export const requestLogs = pgTable('requestlogs',{
  id: uuid('id').defaultRandom().primaryKey(),
  apiKey : text('key').notNull().references(() => apiKeys.key,{onDelete:'cascade'}),
  status : integer('status').notNull(),
  method : text('method').notNull(),
  responseTime: integer('response_time'),
  route: text('route').notNull(),
  isBlocked: boolean().default(false),
  createdAt: timestamp('created_at').defaultNow()
})
