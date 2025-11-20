import { pgTable, serial, text, timestamp, integer, pgEnum, json, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ... (Enum ها و جداول قبلی users, requests, items, logs سرجایشان باشند) ...

export const roleEnum = pgEnum('role', [
  'USER', 'MANAGER', 'PROCUREMENT', 'ADMIN_MANAGER', 'FINANCE_MANAGER', 'CEO'
]);

export const statusEnum = pgEnum('status', [
  'DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_ACTION', 'WAITING_FOR_PROFORMA'
]);

// جداول قبلی (users, requests, ...) را اینجا کپی کن یا دست نزن
// من فقط جدول جدید را اینجا می‌نویسم که به فایل اضافه کنی:

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('USER'),
  phone: text('phone'),
  managerId: integer('manager_id'), 
  createdAt: timestamp('created_at').defaultNow(),
});

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  totalAmount: integer('total_amount').default(0),
  status: statusEnum('status').default('DRAFT'),
  currentApproverId: integer('current_approver_id').references(() => users.id),
  proformaData: json('proforma_data'), 
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const requestItems = pgTable('request_items', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  price: integer('price'),
  link: text('link'),
});

export const requestLogs = pgTable('request_logs', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 👇 جدول جدید: اعلان‌ها
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// روابط (Relations)
export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, { fields: [users.managerId], references: [users.id], relationName: "manager_subordinates" }),
  subordinates: many(users, { relationName: "manager_subordinates" }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  requester: one(users, { fields: [requests.requesterId], references: [users.id] }),
  currentApproverId: one(users, { fields: [requests.currentApproverId], references: [users.id] }),
  items: many(requestItems),
  logs: many(requestLogs),
}));

export const requestItemsRelations = relations(requestItems, ({ one }) => ({
  request: one(requests, { fields: [requestItems.requestId], references: [requests.id] }),
}));

export const requestLogsRelations = relations(requestLogs, ({ one }) => ({
  request: one(requests, { fields: [requestLogs.requestId], references: [requests.id] }),
  actor: one(users, { fields: [requestLogs.actorId], references: [users.id] }),
}));

// 👇 رابطه برای نوتیفیکیشن
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));