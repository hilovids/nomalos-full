import { Match } from "tournament-pairings/dist/Match";

export class Tournament {
  id: string;
  name: string;
  description?: string;
  registrationTime: Date;
  startTime: Date;
  endTime: Date | null;
  status: "upcoming" | "active" | "finished";
  timing: "short" | "long";
  participants: string[]; // Swiss-style player objects
  matches: Match[]; // Swiss-style match objects
  results: { [userId: string]: number }; // userId -> score
  currentRound: number;
  totalRounds: number;
  firstBadge: string | null = null;
  secondBadge: string | null = null;
  participantBadge: string | null = null;

  constructor(params: {
    id: string;
    name: string;
    description?: string;
    registrationTime: Date;
    startTime: Date;
    endTime?: Date | null;
    status?: "upcoming" | "active" | "finished";
    timing?: "short" | "long";
    participants: string[];
    matches?: Match[];
    results?: { [userId: string]: number };
    currentRound?: number;
    totalRounds?: number;
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
    this.timing = params.timing || "short";
    this.participants = params.participants || [];
    this.matches = params.matches || [];
    this.results = params.results || {};
    this.currentRound = params.currentRound || 1;
    this.totalRounds = params.totalRounds || 1;
    this.firstBadge = params.firstBadge || null;
    this.secondBadge = params.secondBadge || null;
    this.participantBadge = params.participantBadge || null;
  }
}