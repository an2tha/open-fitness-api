import { z } from 'zod';

const numericSchema = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const cleaned = val.replace(',', '.').replace(/[^-0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  });

export const foodNutrientSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  value: numericSchema,
});

export const foodSchema = z.object({
  id: z.number(),
  externalId: z.string().optional(),
  dataSource: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  servingSize: z.string().nullable().optional(),
  servingUnit: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  calories: numericSchema,
  protein: numericSchema,
  fat: numericSchema,
  carbohydrates: numericSchema,
  fiber: numericSchema,
  sugar: numericSchema,
  sodium: numericSchema,
  other_nutrients: z.array(foodNutrientSchema).optional(),
});

export const muscleSchema = z.object({
  id: z.number(),
  name: z.string(),
  group: z.string().nullable(),
  role: z.string(),
});

export const equipmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().nullable(),
});

export const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  muscles: z.array(muscleSchema).optional(),
  equipment: z.array(equipmentSchema).optional(),
});

export const supplementSchema = z.object({
  id: z.number(),
  externalId: z.string().optional(),
  dataSource: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  servingSize: z.string().nullable().optional(),
  servingUnit: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const nutrientSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
});

export const healthPingSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
});

export const healthDbSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export const healthStatsSchema = z.object({
  uptime: z.number(),
  memory: z.record(z.string(), z.number()),
  counts: z.object({
    foods: z.number(),
    exercises: z.number(),
    supplements: z.number(),
  }),
  node_version: z.string(),
  timestamp: z.string(),
});

export type FoodNutrient = z.output<typeof foodNutrientSchema>;
export type Food = z.output<typeof foodSchema>;
export type Muscle = z.output<typeof muscleSchema>;
export type Equipment = z.output<typeof equipmentSchema>;
export type Exercise = z.output<typeof exerciseSchema>;
export type Supplement = z.output<typeof supplementSchema>;
export type Nutrient = z.output<typeof nutrientSchema>;
export type HealthPing = z.output<typeof healthPingSchema>;
export type HealthDb = z.output<typeof healthDbSchema>;
export type HealthStats = z.output<typeof healthStatsSchema>;
