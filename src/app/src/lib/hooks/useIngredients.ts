'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Ingredient {
  id: number;
  name: string;
  supplierId?: number;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  densityGPerMl?: number;
  allergens: string[];
  customConversions?: string;
  notes?: string;
}

// Fetch ingredients
async function fetchIngredients(companyId: number): Promise<Ingredient[]> {
  const response = await fetch(`/api/ingredients?companyId=${companyId}`);
  if (!response.ok) throw new Error('Failed to fetch ingredients');
  return response.json();
}

// Create ingredient
async function createIngredient(formData: FormData): Promise<Ingredient> {
  const response = await fetch('/api/ingredients', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create ingredient');
  }
  return response.json();
}

// Update ingredient
async function updateIngredient(id: number, formData: FormData): Promise<Ingredient> {
  const response = await fetch(`/api/ingredients/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update ingredient');
  }
  return response.json();
}

// Delete ingredient
async function deleteIngredient(id: number): Promise<void> {
  const response = await fetch(`/api/ingredients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete ingredient');
}

export function useIngredients(companyId: number) {
  return useQuery({
    queryKey: ['ingredients', companyId],
    queryFn: () => fetchIngredients(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateIngredient(companyId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createIngredient,
    onMutate: async (newIngredient) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ingredients', companyId] });
      
      // Snapshot the previous value
      const previousIngredients = queryClient.getQueryData<Ingredient[]>(['ingredients', companyId]);
      
      // Optimistically update to the new value
      const tempIngredient = {
        id: Date.now(), // Temporary ID
        name: newIngredient.get('name') as string,
        packQuantity: parseFloat(newIngredient.get('packQuantity') as string),
        packUnit: newIngredient.get('packUnit') as string,
        packPrice: parseFloat(newIngredient.get('packPrice') as string),
        allergens: [],
        ...Object.fromEntries(newIngredient),
      };
      
      queryClient.setQueryData<Ingredient[]>(['ingredients', companyId], (old = []) => [...old, tempIngredient]);
      
      // Return context with snapshot
      return { previousIngredients };
    },
    onError: (err, newIngredient, context) => {
      // Rollback on error
      if (context?.previousIngredients) {
        queryClient.setQueryData(['ingredients', companyId], context.previousIngredients);
      }
    },
    onSuccess: () => {
      // Refetch to get the real data with correct ID
      queryClient.invalidateQueries({ queryKey: ['ingredients', companyId] });
    },
  });
}

export function useUpdateIngredient(companyId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateIngredient(id, formData),
    onMutate: async ({ id, formData }) => {
      await queryClient.cancelQueries({ queryKey: ['ingredients', companyId] });
      
      const previousIngredients = queryClient.getQueryData<Ingredient[]>(['ingredients', companyId]);
      
      // Optimistically update
      queryClient.setQueryData<Ingredient[]>(['ingredients', companyId], (old = []) =>
        old.map(ingredient =>
          ingredient.id === id
            ? { ...ingredient, ...Object.fromEntries(formData) }
            : ingredient
        )
      );
      
      return { previousIngredients };
    },
    onError: (err, variables, context) => {
      if (context?.previousIngredients) {
        queryClient.setQueryData(['ingredients', companyId], context.previousIngredients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', companyId] });
    },
  });
}

export function useDeleteIngredient(companyId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteIngredient,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['ingredients', companyId] });
      
      const previousIngredients = queryClient.getQueryData<Ingredient[]>(['ingredients', companyId]);
      
      // Optimistically remove
      queryClient.setQueryData<Ingredient[]>(['ingredients', companyId], (old = []) =>
        old.filter(ingredient => ingredient.id !== id)
      );
      
      return { previousIngredients };
    },
    onError: (err, id, context) => {
      if (context?.previousIngredients) {
        queryClient.setQueryData(['ingredients', companyId], context.previousIngredients);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', companyId] });
    },
  });
}
