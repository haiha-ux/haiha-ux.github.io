import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc', 'mc'] as const;
export const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const;

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    domain: z.enum(['edge-ai', 'robot-learning', 'pcb', 'cad', 'other']),
    repo: z.string(),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    demo: z
      .object({
        kind: z.enum(['iframe', 'pcb3d', 'kicanvas', 'chart', 'wilson', 'undistort']),
        src: z.string().optional(),
        title: z.string().optional(),
      })
      .optional(),
    star: z.union([z.object({ planet: z.enum(PLANETS) }), z.object({ sign: z.enum(SIGNS) })]).optional(),
    year: z.number(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

export const collections = { projects };
