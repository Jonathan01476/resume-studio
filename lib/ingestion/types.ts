import { z } from 'zod';
export const sourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255),
  kind: z.enum(['pdf', 'image', 'text', 'prompt']),
  mime: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']),
  text: z.string().max(60000),
  status: z.enum(['ready', 'needs-vision', 'extraction-failed']),
  message: z.string().max(1000),
  storageKey: z.string().max(400),
});
export type ResumeSource = z.infer<typeof sourceSchema>;
