/**
 * Mentor vector store operations
 * Handles storing and retrieving vector embeddings using pgvector
 */

import { prisma } from "../prisma";

/**
 * Store embedding in knowledge index
 */
export async function storeEmbedding(
  companyId: number,
  entityType: string,
  entityId: number | null,
  content: string,
  embedding: number[],
  metadata?: Record<string, any>
) {
  try {
    // Check if embedding already exists
    // Note: PostgreSQL treats NULL as distinct in unique constraints, so we need to handle null entityId specially
    const existing = await prisma.mentorKnowledgeIndex.findFirst({
      where: {
        companyId,
        entityType,
        entityId: entityId ?? null,
      },
    });

    if (existing) {
      return await prisma.mentorKnowledgeIndex.update({
        where: { id: existing.id },
        data: {
          content,
          embedding: JSON.stringify(embedding),
          metadata,
          lastIndexedAt: new Date(),
        },
      });
    } else {
      return await prisma.mentorKnowledgeIndex.create({
        data: {
          companyId,
          entityType,
          entityId,
          content,
          embedding: JSON.stringify(embedding),
          metadata,
          lastIndexedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("[storeEmbedding] Error storing embedding:", error);
    throw error;
  }
}

/**
 * Search for similar content using vector similarity
 * Note: This is a simplified version. Full pgvector implementation would use cosine similarity
 */
export async function searchSimilarContent(
  companyId: number,
  queryEmbedding: number[],
  limit: number = 10,
  entityTypes?: string[]
) {
  try {
    // For now, we'll do a simple text search
    // TODO: Implement proper pgvector cosine similarity search
    // This requires enabling the pgvector extension and using vector similarity operators
    
    const where: any = {
      companyId,
    };

    if (entityTypes && entityTypes.length > 0) {
      where.entityType = { in: entityTypes };
    }

    // Get all embeddings for the company
    const allEmbeddings = await prisma.mentorKnowledgeIndex.findMany({
      where,
      take: 1000, // Limit for performance
    });

    // Simple cosine similarity calculation (simplified)
    // In production, this should use pgvector's built-in operators
    const results = allEmbeddings
      .map((item) => {
        if (!item.embedding) return null;
        
        try {
          const itemEmbedding = JSON.parse(item.embedding as string) as number[];
          const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
          
          return {
            ...item,
            similarity,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("[searchSimilarContent] Error searching similar content:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Delete embeddings for a specific entity
 */
export async function deleteEmbeddings(
  companyId: number,
  entityType: string,
  entityId?: number
) {
  try {
    const where: any = {
      companyId,
      entityType,
    };

    if (entityId !== undefined) {
      where.entityId = entityId;
    }

    return await prisma.mentorKnowledgeIndex.deleteMany({
      where,
    });
  } catch (error) {
    console.error("[deleteEmbeddings] Error deleting embeddings:", error);
    throw error;
  }
}

