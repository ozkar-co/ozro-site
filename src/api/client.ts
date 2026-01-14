const API_BASE_URL = 'https://ozro-api.ozkar.co';

interface HealthResponse {
  status: string;
}

interface PlayersResponse {
  online: number;
}

interface StatsResponse {
  timestamp: string;
  accounts: {
    total: number;
    activeLastWeek: number;
  };
  characters: {
    total: number;
    activeLast24h: number;
    highestLevel: number;
    averageLevel: number;
    maxLevelCount: number;
  };
  guilds: {
    total: number;
  };
  economy: {
    totalZeny: string;
    bankZeny: string;
    averageZenyPerChar: number;
    averageZenyPerAccount: number;
  };
}

interface RankingsAccountResponse {
  timestamp: string;
  rankings: {
    account_id: number;
    userid: string;
    logincount: number;
    total_zeny: string;
    total_cards: string;
    total_cards_distinct: string;
    total_mvp_cards: string;
    total_boss_cards: string;
    total_diamonds: string;
  }[];
}

interface RankingsCharacterResponse {
  timestamp: string;
  rankings: {
    char_id: number;
    account_id: number;
    userid: string;
    name: string;
    class: number;
    base_level: number;
    base_exp: number;
    job_exp: string;
    fame: number;
  }[];
}

export const apiClient = {
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  async players(): Promise<PlayersResponse> {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  },

  async stats(): Promise<StatsResponse> {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async rankingsAccounts(): Promise<RankingsAccountResponse> {
    const response = await fetch(`${API_BASE_URL}/rankings/accounts`);
    if (!response.ok) throw new Error('Failed to fetch account rankings');
    return response.json();
  },

  async rankingsCharacters(): Promise<RankingsCharacterResponse> {
    const response = await fetch(`${API_BASE_URL}/rankings/characters`);
    if (!response.ok) throw new Error('Failed to fetch character rankings');
    return response.json();
  }
};
