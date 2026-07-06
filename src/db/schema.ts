import { pgTable, serial, varchar, integer, date, timestamp, unique } from "drizzle-orm/pg-core";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  waGroupLink: varchar("wa_group_link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  nisn: varchar("nisn", { length: 20 }).notNull().unique(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Status: H = Hadir, A = Alpa, I = Izin, S = Sakit, T = Terlambat
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: varchar("status", { length: 1 }).notNull().default("H"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("attendance_student_date_unique").on(table.studentId, table.date),
]);
