export class Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // URL or icon name
  awardedTo: string[]; // user IDs

  constructor(params: {
    id: string;
    name: string;
    description: string;
    icon: string;
    awardedTo?: string[];
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.icon = params.icon;
    this.awardedTo = params.awardedTo || [];
  }
}