export class Tournament {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date | null;
  status: "upcoming" | "active" | "finished";
  participants: string[]; // user IDs
  matches: string[]; // match IDs
  bracket: any; // bracket structure (can be refined)
  results: { [userId: string]: number }; // userId -> placement or score

  constructor(params: {
    id: string;
    name: string;
    startTime: Date;
    endTime?: Date | null;
    status?: "upcoming" | "active" | "finished";
    participants?: string[];
    matches?: string[];
    bracket?: any;
    results?: { [userId: string]: number };
  }) {
    this.id = params.id;
    this.name = params.name;
    this.startTime = params.startTime;
    this.endTime = params.endTime || null;
    this.status = params.status || "upcoming";
    this.participants = params.participants || [];
    this.matches = params.matches || [];
    this.bracket = params.bracket || null;
    this.results = params.results || {};
  }
}