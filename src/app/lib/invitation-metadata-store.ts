// Simple in-memory storage for invitation metadata (MVP)
// In production, this should use Redis or a database table
const metadataStore = new Map<number, any>();

export function storeInvitationMetadata(invitationId: number, profileData: any) {
  metadataStore.set(invitationId, profileData);
}

export function getInvitationMetadata(invitationId: number): any | null {
  return metadataStore.get(invitationId) || null;
}

export function deleteInvitationMetadata(invitationId: number) {
  metadataStore.delete(invitationId);
}
