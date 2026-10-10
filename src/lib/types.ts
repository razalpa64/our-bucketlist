export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Relationship = {
  id: string;
  name: string;
  featured_item_id: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  relationship_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type Priority = "whenever" | "soon" | "someday";
export type DreamStatus = "dreaming" | "planned" | "completed";

export type Dream = {
  id: string;
  relationship_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  priority: Priority;
  status: DreamStatus;
  created_by: string;
  location_name: string | null;
  target_date: string | null;
  completed_at: string | null;
  completion_note: string | null;
  completion_image_path: string | null;
  image_path: string | null;
  estimated_budget: number | null;
  private_note: string | null;
  tags: string[];
  doodle?: string | null;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  item_id: string;
  user_id: string;
  created_at: string;
};

export type PlaceStatus = "dreaming" | "planned" | "visited";

export type Place = {
  id: string;
  relationship_id: string;
  name: string;
  country: string | null;
  description: string | null;
  map_url: string | null;
  latitude: number | null;
  longitude: number | null;
  target_date: string | null;
  status: PlaceStatus;
  image_path: string | null;
  created_by: string;
  created_at: string;
};

export type SharedNote = {
  id: string;
  relationship_id: string;
  title: string;
  content: string;
  created_by: string;
  reveal_at: string | null;
  is_surprise: boolean;
  created_at: string;
  updated_at: string;
};

export type FutureLetter = {
  id: string;
  relationship_id: string;
  created_by: string;
  title: string;
  content: string;
  reveal_at: string;
  delivery_years: number;
  created_at: string;
  updated_at: string;
};

export type CurrencyCode = "INR" | "PHP" | "USD" | "EUR" | "GBP";

export type SavingsGoalCategory = "tickets" | "trip" | "experience" | "stay" | "special";

export type SavingsGoal = {
  id: string;
  relationship_id: string;
  bucket_list_item_id: string | null;
  title: string;
  target_amount: number;
  currency: CurrencyCode;
  category: SavingsGoalCategory;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SavingsContribution = {
  id: string;
  goal_id: string;
  relationship_id: string;
  user_id: string;
  amount: number;
  currency: CurrencyCode;
  note: string | null;
  created_at: string;
};

export type CalendarPlanType = "tentative" | "planned" | "confirmed" | "anniversary" | "trip";

export type CalendarPlan = {
  id: string;
  relationship_id: string;
  bucket_list_item_id: string | null;
  title: string;
  start_date: string;
  end_date: string | null;
  plan_type: CalendarPlanType;
  location: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceData = {
  relationship: Relationship | null;
  profiles: Profile[];
  categories: Category[];
  dreams: Dream[];
  favorites: Favorite[];
  places: Place[];
  notes: SharedNote[];
  futureLetters: FutureLetter[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  calendarPlans: CalendarPlan[];
};
