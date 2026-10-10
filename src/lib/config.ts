// ---------------------------------------------------------------------------
// Configurable display copy & content for OUR BUCKET LIST.
// Shared live data lives in Supabase; this file only shapes the experience.
// ---------------------------------------------------------------------------

export const SITE = {
  title: "Our Bucket List",
  eyebrow: "A LITTLE BOOK OF OUR SOMEDAY",
  heroSupport:
    "All the little things we dream of doing, all the places we want to see, and all the memories we haven't made yet. Let's keep them here, babe.",
  heroAnnotation: "Made for two hearts in two different places.",
  partners: ["Razal", "Julian"],
  partnerLine: "Razal & Julian",
  routeLine: "India → Philippines",
  loginHeading: "Our little world is waiting.",
  loginSupport: "A little space for the things we're dreaming of together.",
  dreamsHeading: "Things We Want to Do",
  dreamsSub: "Little dreams, big adventures, and everything in between.",
  doneHeading: "Things We've Done",
  doneSub: "Every little dream that found its way into real life.",
  placesHeading: "Places We Want to Find",
  placesSub: "Little pins on a map we're drawing together.",
  notesHeading: "Little Things I Want You to Know",
  notesSub: "Small letters tucked between the pages of our book.",
  closingHeading: "And this is only the beginning.",
  closingSupport:
    "We don't have to do everything today. We just have to keep dreaming, one little thing at a time.",
  footer: "Made with love for Razal & Julian.",
  privacyNote:
    "This is a private book for two. Only the two of us can read these pages — everything here is shared between our two accounts.",
};

export const PRIORITY_META: Record<string, { label: string; hint: string }> = {
  whenever: { label: "Whenever", hint: "no rush at all" },
  soon: { label: "Soon", hint: "we're itching to do this" },
  someday: { label: "Someday", hint: "a lovely maybe" },
};

export const STATUS_META: Record<string, { label: string }> = {
  dreaming: { label: "Dreaming" },
  planned: { label: "Planned" },
  completed: { label: "Completed" },
};

export const PLACE_STATUS_META: Record<string, { label: string }> = {
  dreaming: { label: "Someday" },
  planned: { label: "Planning" },
  visited: { label: "Been together" },
};

// Category icon keys → painted vignette artwork.
export const CATEGORY_ART: Record<string, string> = {
  firsts: "/art/vignette-firsts.jpg",
  everyday: "/art/vignette-everyday.jpg",
  places: "/art/vignette-places.jpg",
  food: "/art/vignette-food.jpg",
  adventures: "/art/vignette-adventures.jpg",
  cozy: "/art/vignette-cozy.jpg",
  games: "/art/vignette-games.jpg",
  future: "/art/vignette-future.jpg",
  surprises: "/art/vignette-surprises.jpg",
  other: "/art/vignette-other.jpg",
};

export const POSTCARD_ART = [
  "/art/postcard-coast.jpg",
  "/art/postcard-oldtown.jpg",
  "/art/postcard-lake.jpg",
];

// Optional starter dreams, offered deliberately during onboarding.
export const STARTER_DREAMS: { title: string; icon: string; priority?: string }[] = [
  { title: "Meet each other in person for the very first time.", icon: "firsts", priority: "soon" },
  { title: "Walk together while holding hands.", icon: "firsts" },
  { title: "Watch the sunset together.", icon: "cozy" },
  { title: "Cook a meal together.", icon: "food" },
  { title: "Have a cozy movie night.", icon: "cozy" },
  { title: "Play chess sitting beside each other.", icon: "games" },
  { title: "Exchange handwritten letters.", icon: "surprises" },
  { title: "Visit a beautiful garden.", icon: "places" },
  { title: "Explore a new city together.", icon: "adventures" },
  { title: "Take a train journey.", icon: "adventures" },
  { title: "Make a playlist for a long journey.", icon: "everyday" },
  { title: "Have a little picnic.", icon: "food" },
  { title: "Try each other's favorite food.", icon: "food" },
  { title: "Take a rainy-day walk.", icon: "cozy" },
  { title: "Build a cozy home together someday.", icon: "future", priority: "someday" },
  { title: "Visit a place neither of us has seen before.", icon: "places" },
];

export const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
  { name: "Firsts Together", icon: "firsts" },
  { name: "Little Everyday Things", icon: "everyday" },
  { name: "Places to Go", icon: "places" },
  { name: "Food & Cooking", icon: "food" },
  { name: "Adventures", icon: "adventures" },
  { name: "Cozy Days", icon: "cozy" },
  { name: "Games & Challenges", icon: "games" },
  { name: "Future Dreams", icon: "future" },
  { name: "Surprises", icon: "surprises" },
  { name: "Other Dreams", icon: "other" },
];
