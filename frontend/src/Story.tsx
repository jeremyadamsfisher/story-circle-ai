interface Author {
  name: string;
  single_player: boolean;
  ai_player: boolean;
}

export interface Segment {
  content: string;
  author: Author;
}

interface WhoseTurnIsIt {
  name: string;
  single_player: boolean;
  ai_player: boolean;
}

export interface Story {
  id: string;
  segments: Segment[];
  whose_turn_is_it: WhoseTurnIsIt;
}
