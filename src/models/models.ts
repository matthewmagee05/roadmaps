export interface Team {
  name: string;
  swimlanes: Feature[];
}

export interface Feature {
  name: string;
  epics: Epic[];
}

export interface Epic {
  title: string;
  type: string;
  startDate: string;
  endDate: string;
}

export interface OfficeTimeline {
  Swimlane: string;
  Type: string;
  Status: string;
  Title: string;
  StartDate: string;
  EndDate: string;
}

export enum TicketType {
  Capability = "Capability",
  Feature = "Feature",
  Epic = "Epic",
  Story = "Story",
  Spike = "Spike",
}
