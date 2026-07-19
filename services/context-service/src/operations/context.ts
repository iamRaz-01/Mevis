export interface Volunteer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly teamId: string | null;
  readonly organizationId: string;
  readonly certifications: readonly string[];
  readonly languages: readonly string[];
  readonly createdAt: string;
}

export interface VenueZone {
  readonly id: string;
  readonly name: string;
}

export interface VenueGate {
  readonly id: string;
  readonly name: string;
  readonly zoneId: string | null;
}

export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly zones: ReadonlyArray<VenueZone>;
  readonly gates: ReadonlyArray<VenueGate>;
  readonly createdAt: string;
}

export interface Resource {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly serialNumber: string;
  readonly capabilities: readonly string[];
  readonly createdAt: string;
}

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly organizationId: string;
  readonly capabilities: readonly string[];
  readonly createdAt: string;
}

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly createdAt: string;
}
