export class Tournament {
  id: string;
  name: string;
  description?: string;
  registrationTime: Date;
  startTime: Date;
  endTime: Date | null;
  status: "upcoming" | "active" | "finished";
  participants: string[]; // user IDs
  matches: string[]; // match IDs
  results: { [userId: string]: number }; // userId -> placement or score
  firstBadge: string | null = null; // badge ID for first place
  secondBadge: string | null = null
  participantBadge: string | null = null; // badge ID for all participants

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    registrationTime: Date;
    startTime: Date;
    endTime?: Date | null;
    status?: "upcoming" | "active" | "finished";
    participants?: string[];
    matches?: string[];
    results?: { [userId: string]: number };
    firstBadge?: string | null;
    secondBadge?: string | null;
    participantBadge?: string | null;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description || "";
    this.registrationTime = params.registrationTime;
    this.startTime = params.startTime;
    this.endTime = params.endTime || null;
    this.status = params.status || "upcoming";
    this.participants = params.participants || [];
    this.matches = params.matches || [];
    this.results = params.results || {};
    this.firstBadge = params.firstBadge || null;
    this.secondBadge = params.secondBadge || null;
    this.participantBadge = params.participantBadge || null;
  }
}