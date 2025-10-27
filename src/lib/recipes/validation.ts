/**
 * Validation schemas for recipe-related operations
 * 
 * This module provides centralized validation using Zod schemas to ensure
 * data integrity and type safety across all recipe operations.
 */

import { z } from "zod";

// Base units that recipes can produce
export const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);

// All supported units for recipe ingredients
export const unitEnum = z.enum([
  "g", "kg", "mg", "lb", "oz", 
  "ml", "l", "pint", "quart", "gallon", 
  "tsp", "tbsp", "cup", "floz", 
  "each", "slices", "pinch", "dash", 
  "large", "medium", "small"
]);

// Recipe item schema for ingredients
export const recipeItemSchema = z.object({
  ingredientId: z.number().int().positive("Ingredient ID must be a positive integer"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: unitEnum,
  note: z.string().optional(),
  price: z.number().positive().optional()
});

// Recipe section schema for multi-step recipes
export const recipeSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  method: z.string().optional(),
  order: z.number().int().min(0),
  bakeTemp: z.number().int().positive().optional(),
  bakeTime: z.number().int().positive().optional(),
  hasTimer: z.boolean().default(false),
  items: z.array(recipeItemSchema).default([])
});

// Sub-recipe schema for recipes that use other recipes as ingredients
export const subRecipeSchema = z.object({
  id: z.string().optional(),
  subRecipeId: z.number().int().positive("Sub-recipe ID must be a positive integer"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: unitEnum,
  note: z.string().optional()
});

// Basic recipe creation schema
export const basicRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name too long"),
  description: z.string().optional(),
  yieldQuantity: z.coerce.number().positive("Yield quantity must be positive"),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  method: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  shelfLifeId: z.number().int().positive().optional(),
  storageId: z.number().int().positive().optional(),
  bakeTime: z.number().int().positive().optional(),
  bakeTemp: z.number().int().positive().optional(),
  portionsPerBatch: z.number().int().positive().optional(),
  portionSize: z.number().positive().optional(),
  portionUnit: baseUnitEnum.optional(),
  items: z.array(recipeItemSchema).min(1, "At least one ingredient is required")
});

// Advanced recipe schema with sections and sub-recipes
export const advancedRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name too long"),
  description: z.string().optional(),
  yieldQuantity: z.coerce.number().positive("Yield quantity must be positive"),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  method: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  shelfLifeId: z.number().int().positive().optional(),
  storageId: z.number().int().positive().optional(),
  bakeTime: z.number().int().positive().optional(),
  bakeTemp: z.number().int().positive().optional(),
  portionsPerBatch: z.number().int().positive().optional(),
  portionSize: z.number().positive().optional(),
  portionUnit: baseUnitEnum.optional(),
  sections: z.array(recipeSectionSchema).default([]),
  subRecipes: z.array(subRecipeSchema).default([])
});

// Simplified recipe schema for quick recipe creation
export const simplifiedRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name too long"),
  recipeType: z.enum(["single", "batch"]).default("single"),
  servings: z.coerce.number().int().positive().default(1),
  method: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  categoryId: z.number().int().positive().optional(),
  shelfLifeId: z.number().int().positive().optional(),
  storageId: z.number().int().positive().optional(),
  bakeTime: z.number().int().positive().optional(),
  bakeTemp: z.number().int().positive().optional(),
  ingredientIds: z.array(z.number().int().positive()).min(1, "At least one ingredient is required"),
  quantities: z.array(z.number().positive()).min(1, "Quantities are required"),
  units: z.array(unitEnum).min(1, "Units are required")
});

// Recipe update schema (extends basic schema but makes name optional for updates)
export const recipeUpdateSchema = basicRecipeSchema.partial().extend({
  id: z.number().int().positive("Recipe ID is required"),
  name: z.string().min(1, "Recipe name is required").max(100, "Recipe name too long").optional()
});

// Wholesale product schema
export const wholesaleProductSchema = z.object({
  recipeId: z.number().int().positive(),
  price: z.number().positive("Price must be positive"),
  currency: z.string().default("GBP"),
  unit: z.string().default("each"),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

// Type exports for use in other modules
export type BasicRecipeData = z.infer<typeof basicRecipeSchema>;
export type AdvancedRecipeData = z.infer<typeof advancedRecipeSchema>;
export type SimplifiedRecipeData = z.infer<typeof simplifiedRecipeSchema>;
export type RecipeUpdateData = z.infer<typeof recipeUpdateSchema>;
export type RecipeItemData = z.infer<typeof recipeItemSchema>;
export type RecipeSectionData = z.infer<typeof recipeSectionSchema>;
export type SubRecipeData = z.infer<typeof subRecipeSchema>;
export type WholesaleProductData = z.infer<typeof wholesaleProductSchema>;
