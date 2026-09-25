import { z } from 'zod';
const text = z.string().max(12000);
const short = z.string().max(300);
export const safeUrl = z.union([
  z.literal(''),
  z
    .string()
    .max(2048)
    .url()
    .refine((v) => ['https:', 'http:'].includes(new URL(v).protocol), 'Use an http or https URL'),
]);
const date = z.string().regex(/^$|^\d{4}(-(?:0[1-9]|1[0-2]))?$/, 'Use YYYY or YYYY-MM');
const strings = z.array(short).max(50);
const entry = { id: z.string().uuid() };
export const experienceSchema = z.object({
  ...entry,
  organization: short,
  position: short,
  location: short,
  startDate: date,
  endDate: date,
  current: z.boolean(),
  bullets: z.array(text).max(30),
  technologies: strings,
  url: safeUrl,
  details: text,
});
export const projectSchema = z.object({
  ...entry,
  title: short,
  description: text,
  longDescription: text,
  bullets: z.array(text).max(30),
  technologies: strings,
  github: safeUrl,
  liveUrl: safeUrl,
  images: z.array(safeUrl.refine((v) => v.length > 0)).max(12),
  architecture: text,
});
export const educationSchema = z.object({
  ...entry,
  institution: short,
  degree: short,
  major: short,
  minor: short,
  startDate: date,
  endDate: date,
  location: short,
  coursework: strings,
  achievements: strings,
});
export const certificationSchema = z.object({
  ...entry,
  name: short,
  issuer: short,
  issueDate: date,
  credentialId: short,
  credentialUrl: safeUrl,
  description: text,
});
export const skillSchema = z.object({ ...entry, category: short, items: strings });
export const sectionNames = [
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
] as const;
export type SectionName = (typeof sectionNames)[number];
export const resumeSchema = z
  .object({
    id: z.string().uuid(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    title: short,
    profile: z.object({
      name: short.min(1, 'Name is required'),
      headline: short,
      summary: text,
      email: z.union([z.literal(''), z.email()]),
      phone: short,
      location: short,
      website: safeUrl,
      github: safeUrl,
      linkedin: safeUrl,
    }),
    education: z.array(educationSchema).max(25),
    experience: z.array(experienceSchema).max(40),
    projects: z.array(projectSchema).max(40),
    certifications: z.array(certificationSchema).max(40),
    skills: z.array(skillSchema).max(30),
    sectionOrder: z
      .array(z.enum(sectionNames))
      .length(5)
      .refine((v) => new Set(v).size === 5, 'Each section must appear exactly once'),
    metadata: z.object({
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
      version: z.number().int().nonnegative(),
      sample: z.boolean(),
    }),
  })
  .superRefine((r, ctx) => {
    const ids = sectionNames.flatMap((s) => r[s].map((e) => e.id));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'Entry IDs must be unique' });
  });
export type Resume = z.infer<typeof resumeSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type SkillGroup = z.infer<typeof skillSchema>;
export function validateResume(value: unknown): Resume {
  return resumeSchema.parse(value);
}
