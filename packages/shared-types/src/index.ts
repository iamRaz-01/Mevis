export interface Entity {
  id: string;
  type: string;
  status: string;
}

export interface Volunteer extends Entity {
  type: 'Volunteer';
  name: string;
  location: string;
  certification: string;
}

export interface Incident extends Entity {
  type: 'Incident';
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Zone extends Entity {
  type: 'Zone';
  code: string;
  capacity: number;
}

export interface Gate extends Entity {
  type: 'Gate';
  code: string;
  isOpen: boolean;
}

export interface Context {
  contextId: string;
  activeIncidentsCount: number;
  availableVolunteersCount: number;
  timestamp: string;
}

export interface KnowledgeObject {
  chunkId: string;
  parentAssetId: string;
  contentText: string;
  provenance: {
    sourceDocument: string;
    section: string;
  };
}
