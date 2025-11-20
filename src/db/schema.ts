import { pgTable, serial, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. تعریف نقش‌ها و وضعیت‌ها
export const roleEnum = pgEnum('role', ['USER', 'MANAGER', 'ADMIN']);
export const statusEnum = pgEnum('status', ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_ACTION']);

// 2. جدول کاربران (با قابلیت سلسله مراتب)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').default('USER'),
  phone: text('phone'),
  managerId: integer('manager_id'), // به خودش اشاره می‌کند (Self-referencing)
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. جدول درخواست‌های خرید
export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  totalAmount: integer('total_amount').default(0),
  status: statusEnum('status').default('DRAFT'),
  currentApproverId: integer('current_approver_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. آیتم‌های داخل هر درخواست
export const requestItems = pgTable('request_items', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  price: integer('price'),
  link: text('link'),
});

// 5. لاگ و تاریخچه
export const requestLogs = pgTable('request_logs', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  actorId: integer('actor_id').notNull().references(() => users.id),
  action: text('action').notNull(), // 'SUBMIT', 'APPROVE', 'REJECT', 'COMMENT'
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// =================================================
// تعریف روابط (Relations) - حیاتی برای کوئری‌ها
// =================================================

// روابط جدول کاربران
export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: "manager_subordinates"
  }),
  subordinates: many(users, {
    relationName: "manager_subordinates"
  }),
}));

// روابط جدول درخواست‌ها
export const requestsRelations = relations(requests, ({ one, many }) => ({
  requester: one(users, {
    fields: [requests.requesterId],
    references: [users.id],
  }),
  currentApprover: one(users, {
    fields: [requests.currentApproverId],
    references: [users.id],
  }),
  items: many(requestItems), // 👈 این خط باعث می‌شود ارور 'items' حل شود
  logs: many(requestLogs),
}));

// روابط جدول آیتم‌ها
export const requestItemsRelations = relations(requestItems, ({ one }) => ({
  request: one(requests, {
    fields: [requestItems.requestId],
    references: [requests.id],
  }),
}));

// روابط جدول لاگ‌ها
export const requestLogsRelations = relations(requestLogs, ({ one }) => ({
  request: one(requests, {
    fields: [requestLogs.requestId],
    references: [requests.id],
  }),
  actor: one(users, {
    fields: [requestLogs.actorId],
    references: [users.id],
  }),
}));