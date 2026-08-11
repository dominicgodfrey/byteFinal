export type Ingredient = {
  name: string;
  /** Amount for one serving. Multiply to scale. */
  quantity: number;
  unit: string;
};

export type Cook = {
  _id: string;
  photoUrl: string;
  photoPublicId?: string;
  servings: number;
  notes?: string;
  cookedAt: string;
};

export type Recipe = {
  _id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  /** What the author typed amounts for. Display only. */
  enteredForServings: number;
  cooks: Cook[];
  tags: string[];
  isPublic: boolean;
  author: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

/** What the form sends. Quantities per serving. */
export type RecipeInput = {
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  enteredForServings: number;
  tags: string[];
  isPublic: boolean;
};
