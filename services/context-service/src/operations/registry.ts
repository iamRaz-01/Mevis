import { type Volunteer, type Venue, type Resource, type Team, type Organization } from "./context";
import { VolunteerAggregate } from "./volunteer";
import { VenueAggregate } from "./venue";
import { ResourceAggregate } from "./resource";
import { TeamAggregate } from "./team";
import { OrganizationAggregate } from "./organization";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("OperationalRegistry");

export interface VolunteerRepoPort {
  save(v: any): Promise<void>;
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
}

export class OperationalRegistry {
  private readonly volunteerAggregate = new VolunteerAggregate();
  private readonly venueAggregate = new VenueAggregate();
  private readonly resourceAggregate = new ResourceAggregate();
  private readonly teamAggregate = new TeamAggregate();
  private readonly organizationAggregate = new OrganizationAggregate();

  constructor(
    private readonly volunteerRepo: VolunteerRepoPort,
    private readonly venueRepo: any,
    private readonly zoneRepo: any,
    private readonly gateRepo: any,
    private readonly teamRepo: any,
    private readonly orgRepo: any,
    private readonly resourceRepo: any
  ) {}

  async registerVolunteer(v: Partial<Volunteer>): Promise<Volunteer> {
    this.volunteerAggregate.validate(v);

    const existingList = await this.volunteerRepo.findAll();
    if (existingList.some((row: any) => row.email === v.email)) {
      throw new Error(`Volunteer with email "${v.email}" is already registered.`);
    }

    const id = v.id || `VOL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const volunteer: Volunteer = {
      id,
      name: v.name!,
      email: v.email!,
      teamId: v.teamId || null,
      organizationId: v.organizationId!,
      certifications: v.certifications || [],
      languages: v.languages || [],
      createdAt: timestamp,
    };

    await this.volunteerRepo.save({
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email,
      team_id: volunteer.teamId,
      organization_id: volunteer.organizationId,
      certifications_json: JSON.stringify(volunteer.certifications),
      languages_json: JSON.stringify(volunteer.languages),
      created_at: volunteer.createdAt,
    });

    await globalEventBus.publish({
      type: "VolunteerRegistered",
      timestamp,
      payload: { volunteerId: id },
    });

    metrics.counter("world_volunteers_registered_total").increment();
    return volunteer;
  }

  async updateVolunteer(id: string, updates: Partial<Volunteer>): Promise<Volunteer> {
    const row = await this.volunteerRepo.findById(id);
    if (!row) throw new Error(`Volunteer "${id}" not found.`);

    const certifications = updates.certifications || (row.certifications_json ? JSON.parse(row.certifications_json) : []);
    const languages = updates.languages || (row.languages_json ? JSON.parse(row.languages_json) : []);

    const merged: Volunteer = {
      id,
      name: updates.name !== undefined ? updates.name : row.name,
      email: updates.email !== undefined ? updates.email : row.email,
      teamId: updates.teamId !== undefined ? updates.teamId : row.team_id,
      organizationId: updates.organizationId !== undefined ? updates.organizationId : row.organization_id,
      certifications,
      languages,
      createdAt: row.created_at,
    };

    this.volunteerAggregate.validate(merged);

    await this.volunteerRepo.save({
      id: merged.id,
      name: merged.name,
      email: merged.email,
      team_id: merged.teamId,
      organization_id: merged.organizationId,
      certifications_json: JSON.stringify(merged.certifications),
      languages_json: JSON.stringify(merged.languages),
      created_at: merged.createdAt,
    });

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "VolunteerUpdated",
      timestamp,
      payload: { volunteerId: id },
    });

    return merged;
  }

  async registerVenue(v: Partial<Venue>): Promise<Venue> {
    this.venueAggregate.validate(v);

    const id = v.id || `VENUE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const venue: Venue = {
      id,
      name: v.name!,
      zones: v.zones || [],
      gates: v.gates || [],
      createdAt: timestamp,
    };

    await this.venueRepo.save({
      id: venue.id,
      name: venue.name,
      created_at: venue.createdAt,
    });

    for (const z of venue.zones) {
      await this.zoneRepo.save({
        id: z.id,
        venue_id: venue.id,
        name: z.name,
      });
    }

    for (const g of venue.gates) {
      await this.gateRepo.save({
        id: g.id,
        venue_id: venue.id,
        zone_id: g.zoneId,
        name: g.name,
      });
    }

    await globalEventBus.publish({
      type: "VenueRegistered",
      timestamp,
      payload: { venueId: id },
    });

    metrics.counter("world_venues_registered_total").increment();
    return venue;
  }

  async registerResource(r: Partial<Resource>): Promise<Resource> {
    this.resourceAggregate.validate(r);

    const id = r.id || `RES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const resource: Resource = {
      id,
      name: r.name!,
      category: r.category!,
      serialNumber: r.serialNumber!,
      capabilities: r.capabilities || [],
      createdAt: timestamp,
    };

    await this.resourceRepo.save({
      id: resource.id,
      name: resource.name,
      category: resource.category,
      serial_number: resource.serialNumber,
      capabilities_json: JSON.stringify(resource.capabilities),
      created_at: resource.createdAt,
    });

    await globalEventBus.publish({
      type: "ResourceCreated",
      timestamp,
      payload: { resourceId: id },
    });

    metrics.counter("world_resources_created_total").increment();
    return resource;
  }

  async createTeam(t: Partial<Team>): Promise<Team> {
    this.teamAggregate.validate(t);

    const id = t.id || `TEAM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const team: Team = {
      id,
      name: t.name!,
      organizationId: t.organizationId!,
      capabilities: t.capabilities || [],
      createdAt: timestamp,
    };

    await this.teamRepo.save({
      id: team.id,
      name: team.name,
      organization_id: team.organizationId,
      capabilities_json: JSON.stringify(team.capabilities),
      created_at: team.createdAt,
    });

    await globalEventBus.publish({
      type: "TeamCreated",
      timestamp,
      payload: { teamId: id },
    });

    return team;
  }

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    this.organizationAggregate.validate(org);

    const id = org.id || `ORG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const organization: Organization = {
      id,
      name: org.name!,
      parentId: org.parentId || null,
      createdAt: timestamp,
    };

    await this.orgRepo.save({
      id: organization.id,
      name: organization.name,
      parent_id: organization.parentId,
      created_at: organization.createdAt,
    });

    await globalEventBus.publish({
      type: "OrganizationUpdated",
      timestamp,
      payload: { organizationId: id },
    });

    return organization;
  }
}
