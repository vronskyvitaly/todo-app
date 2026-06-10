import { z } from "zod";

export const todoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(250, "Title must be 250 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
  important: z.boolean().default(false),
  dueDate: z.string().nullable().optional().default(null),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  tags: z.string().optional().default(""),
  reminderMinutes: z.string().optional().default(""),
});

export type TodoFormValues = z.infer<typeof todoSchema>;

// Convert form values to WS payload
export function formToPayload(data: TodoFormValues) {
  return {
    title: data.title,
    description: data.description ?? "",
    important: data.important,
    dueDate: data.dueDate || null,
    priority: data.priority,
    tags: data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    reminderAt: data.reminderMinutes
      ? new Date(Date.now() + parseInt(data.reminderMinutes) * 60 * 1000).toISOString()
      : null,
  };
}
