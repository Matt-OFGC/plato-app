export type RecipeStep = {
  id: string;
  title: string;
  temperatureC?: number;
  durationMin?: number;
  hasTimer?: boolean;
  instructions: string[];
};

export type Ingredient = {
  id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'each';
  quantity: number;
  costPerUnit?: number; // cost per unit of the given unit (e.g. per g)
  isOptional?: boolean;
  stepId?: string; // assign ingredient to a step for step view
};

export type RecipeMock = {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  baseServings: number;
  steps: RecipeStep[];
  ingredients: Ingredient[];
  notes?: string;
  allergens?: string[];
  storage?: string;
  shelfLife?: string;
  sellPrice?: number;
};

const DEFAULT_RECIPE: RecipeMock = {
  id: 'old-skool-sponge',
  title: 'Old Skool Sponge',
  category: 'Uncategorized',
  imageUrl: '/images/placeholder-cake.png',
  baseServings: 15,
  allergens: ['Eggs', 'Gluten'],
  storage: 'Ambient, covered',
  shelfLife: '2 days',
  steps: [
    {
      id: 'sponge',
      title: 'Sponge Layer',
      temperatureC: 160,
      durationMin: 40,
      hasTimer: true,
      instructions: [
        'In the KitchenAid bowl beat the stork and caster sugar on med-high until light and fluffy (5–10 mins).',
        'Crack eggs into a separate bowl, add vanilla extract and whisk until combined.',
        'Gradually add eggs to the stork and caster sugar, medium-high speed, rest 1 minute between additions until fully incorporated.',
        'Add sieved self-raising flour, fold through on lowest setting until just combined. Do not overmix.',
        'Bake at 160°C for ~40 minutes. Cool before icing.',
      ],
    },
    {
      id: 'icing',
      title: 'Icing Layer',
      durationMin: 10,
      instructions: [
        'Combine icing sugar with a little water to make a thick, spreadable icing.',
        'Spread evenly over cooled sponge and add sprinkles.',
      ],
    },
  ],
  ingredients: [
    { id: 'stork', name: 'Stork', unit: 'g', quantity: 405, costPerUnit: 0.005, stepId: 'sponge' },
    { id: 'caster-sugar', name: 'Caster Sugar', unit: 'g', quantity: 405, costPerUnit: 0.0025, stepId: 'sponge' },
    { id: 'eggs', name: 'Whole Egg', unit: 'each', quantity: 7, costPerUnit: 0.22, stepId: 'sponge' },
    { id: 'flour', name: 'Self Raising Flour', unit: 'g', quantity: 405, costPerUnit: 0.0018, stepId: 'sponge' },
    { id: 'baking-powder', name: 'Baking Powder', unit: 'tbsp', quantity: 1, costPerUnit: 0.05, stepId: 'sponge' },
    { id: 'vanilla', name: 'Vanilla Extract', unit: 'tbsp', quantity: 1, costPerUnit: 0.3, stepId: 'sponge' },
    { id: 'icing-sugar', name: 'Icing Sugar', unit: 'g', quantity: 200, costPerUnit: 0.002, stepId: 'icing' },
    { id: 'sprinkles', name: 'Sprinkles', unit: 'g', quantity: 50, costPerUnit: 0.01, stepId: 'icing' },
    { id: 'vanilla-icing', name: 'Vanilla Extract', unit: 'tsp', quantity: 1, costPerUnit: 0.15, stepId: 'icing' },
  ],
  notes: 'Mock recipe used for layout & interaction testing only.',
};

export async function getMockRecipeById(id: string): Promise<RecipeMock> {
  // In the mock we just return DEFAULT_RECIPE regardless of id
  return { ...DEFAULT_RECIPE, id };
}


