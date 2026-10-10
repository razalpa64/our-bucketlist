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

export const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
  { name: "Firsts Together", icon: "firsts" },
  { name: "Little Everyday Things", icon: "everyday" },
  { name: "Cozy Days", icon: "cozy" },
  { name: "Places to Go", icon: "places" },
  { name: "Food & Games", icon: "games" },
  { name: "Future Dreams", icon: "future" },
];

export const STARTER_DREAMS: { title: string; icon: string; priority?: string }[] = [
  // 1. The firsts we'll never forget
  { title: "Meet each other in person for the very first time.", icon: "firsts", priority: "soon" },
  { title: "Run into each other's arms at the airport.", icon: "firsts", priority: "soon" },
  { title: "Give you the flowers I've been dreaming of giving you.", icon: "firsts", priority: "soon" },
  { title: "Hold your hand for the first time.", icon: "firsts", priority: "soon" },
  { title: "Look into your eyes without a screen between us.", icon: "firsts", priority: "soon" },
  { title: "Have our first real hug and never want it to end.", icon: "firsts", priority: "soon" },
  { title: "Take our first photograph together.", icon: "firsts", priority: "soon" },
  { title: "Hear each other laugh right beside us.", icon: "firsts", priority: "soon" },
  { title: "Have our first date in the same place.", icon: "firsts", priority: "soon" },
  { title: "Say \"I love you\" while looking into each other's eyes.", icon: "firsts", priority: "soon" },

  // 2. Little things that feel like us
  { title: "Fall asleep on a call together.", icon: "everyday" },
  { title: "Watch the sunrise and sunset on the same call.", icon: "everyday" },
  { title: "Write each other handwritten letters.", icon: "everyday" },
  { title: "Make a playlist of songs that remind us of each other.", icon: "everyday" },
  { title: "Have a no-phones date, just us.", icon: "everyday" },
  { title: "Cook the same recipe while video calling.", icon: "everyday" },
  { title: "Have a silly competition and let the loser choose our next date.", icon: "everyday" },
  { title: "Make each other laugh when one of us has a terrible day.", icon: "everyday" },
  { title: "Create our own collection of inside jokes.", icon: "everyday" },
  { title: "Have a random midnight conversation that lasts until morning.", icon: "everyday" },

  // 3. Our cute date collection
  { title: "Have a picnic under a flowering tree.", icon: "cozy" },
  { title: "Watch a movie while sharing snacks on the same couch.", icon: "cozy" },
  { title: "Go on a rainy-day walk together.", icon: "cozy" },
  { title: "Visit a bookstore and pick a book for each other.", icon: "cozy" },
  { title: "Have a beach date at sunset.", icon: "cozy" },
  { title: "Go stargazing somewhere quiet.", icon: "cozy" },
  { title: "Buy each other a tiny, unexpected gift.", icon: "cozy" },
  { title: "Visit a flower shop and choose flowers for each other.", icon: "cozy" },
  { title: "Have a baking date and make a beautiful mess.", icon: "cozy" },
  { title: "Spend an entire day doing absolutely nothing together.", icon: "cozy" },

  // 4. Places we'll explore
  { title: "Explore Julian's favorite places in the Philippines.", icon: "places", priority: "soon" },
  { title: "Show Julian my favorite places in Kerala.", icon: "places", priority: "soon" },
  { title: "Watch a sunset together on a beautiful beach.", icon: "places" },
  { title: "Take a spontaneous road trip.", icon: "places" },
  { title: "Visit a mountain viewpoint.", icon: "places" },
  { title: "Explore a new city without planning every minute.", icon: "places" },
  { title: "Take a train journey together.", icon: "places" },
  { title: "Visit a garden filled with flowers.", icon: "places" },
  { title: "Stay in a cozy little cottage.", icon: "places" },
  { title: "Take a trip somewhere neither of us has visited before.", icon: "places", priority: "someday" },

  // 5. Food, games and silly challenges
  { title: "Cook a meal for each other.", icon: "games" },
  { title: "Try each other's favorite food.", icon: "games" },
  { title: "Make homemade pizza together.", icon: "games" },
  { title: "Have a dessert-tasting date.", icon: "games" },
  { title: "Play chess sitting next to each other.", icon: "games" },
  { title: "Have a video-game tournament.", icon: "games" },
  { title: "Teach each other something we're good at.", icon: "games" },
  { title: "Play board games on a rainy evening.", icon: "games" },
  { title: "Make a mystery meal using random ingredients.", icon: "games" },
  { title: "Create our own couple quiz and see who knows whom better.", icon: "games" },

  // 6. The someday chapter
  { title: "Plan a trip together from beginning to end.", icon: "future", priority: "soon" },
  { title: "Save up for a special holiday together.", icon: "future", priority: "soon" },
  { title: "Celebrate a birthday in person.", icon: "future", priority: "soon" },
  { title: "Celebrate our anniversary together in the same place.", icon: "future", priority: "soon" },
  { title: "Exchange meaningful gifts we've chosen ourselves.", icon: "future" },
  { title: "Make a scrapbook of our journey.", icon: "future" },
  { title: "Build traditions that belong only to us.", icon: "future" },
  { title: "Talk honestly about our future and what we both want.", icon: "future", priority: "someday" },
  { title: "Build a peaceful, loving home together someday, if we're both ready.", icon: "future", priority: "someday" },
  { title: "Look back at our original bucket list and see how far we've come.", icon: "future", priority: "someday" },
];
