import { readFileSync } from "node:fs";
import pg from "pg";

const env = {};
for (const line of readFileSync(new URL("../.env.setup", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { DATABASE_URL, RAZAL_EMAIL } = env;

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("→ Connected to Postgres");

// 1. Get relationship
const relRes = await client.query("select id from public.relationships where name = 'Our Little World' limit 1");
if (relRes.rows.length === 0) {
  throw new Error("Relationship 'Our Little World' not found");
}
const relId = relRes.rows[0].id;
console.log(`→ Relationship ID: ${relId}`);

// 2. Get user ID
const userRes = await client.query(
  "select id from auth.users where email = $1 limit 1",
  [RAZAL_EMAIL]
);
const userId = userRes.rows[0]?.id;
if (!userId) throw new Error(`User ${RAZAL_EMAIL} not found`);
console.log(`→ Author User ID: ${userId}`);

// 3. Categories definitions
const categoriesData = [
  { name: "Firsts Together", icon: "firsts", sort: 1 },
  { name: "Little Everyday Things", icon: "everyday", sort: 2 },
  { name: "Cozy Days", icon: "cozy", sort: 3 },
  { name: "Places to Go", icon: "places", sort: 4 },
  { name: "Food & Games", icon: "games", sort: 5 },
  { name: "Future Dreams", icon: "future", sort: 6 },
];

const categoryIdMap = {};

for (const c of categoriesData) {
  const existing = await client.query(
    "select id from public.categories where relationship_id = $1 and (name = $2 or icon = $3) limit 1",
    [relId, c.name, c.icon]
  );
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.query("update public.categories set name = $1, icon = $2, sort_order = $3 where id = $4", [c.name, c.icon, c.sort, id]);
    categoryIdMap[c.name] = id;
    console.log(`  ✓ Updated category: ${c.name} (${id})`);
  } else {
    const inserted = await client.query(
      "insert into public.categories (relationship_id, name, icon, sort_order) values ($1, $2, $3, $4) returning id",
      [relId, c.name, c.icon, c.sort]
    );
    categoryIdMap[c.name] = inserted.rows[0].id;
    console.log(`  + Created category: ${c.name} (${inserted.rows[0].id})`);
  }
}

// 4. Bucket list items
const listItems = [
  // 1. The firsts we'll never forget
  { cat: "Firsts Together", priority: "soon", title: "Meet each other in person for the very first time." },
  { cat: "Firsts Together", priority: "soon", title: "Run into each other's arms at the airport." },
  { cat: "Firsts Together", priority: "soon", title: "Give you the flowers I've been dreaming of giving you." },
  { cat: "Firsts Together", priority: "soon", title: "Hold your hand for the first time." },
  { cat: "Firsts Together", priority: "soon", title: "Look into your eyes without a screen between us." },
  { cat: "Firsts Together", priority: "soon", title: "Have our first real hug and never want it to end." },
  { cat: "Firsts Together", priority: "soon", title: "Take our first photograph together." },
  { cat: "Firsts Together", priority: "soon", title: "Hear each other laugh right beside us." },
  { cat: "Firsts Together", priority: "soon", title: "Have our first date in the same place." },
  { cat: "Firsts Together", priority: "soon", title: "Say \"I love you\" while looking into each other's eyes." },

  // 2. Little things that feel like us
  { cat: "Little Everyday Things", priority: "whenever", title: "Fall asleep on a call together." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Watch the sunrise and sunset on the same call." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Write each other handwritten letters." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Make a playlist of songs that remind us of each other." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Have a no-phones date, just us." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Cook the same recipe while video calling." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Have a silly competition and let the loser choose our next date." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Make each other laugh when one of us has a terrible day." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Create our own collection of inside jokes." },
  { cat: "Little Everyday Things", priority: "whenever", title: "Have a random midnight conversation that lasts until morning." },

  // 3. Our cute date collection
  { cat: "Cozy Days", priority: "whenever", title: "Have a picnic under a flowering tree." },
  { cat: "Cozy Days", priority: "whenever", title: "Watch a movie while sharing snacks on the same couch." },
  { cat: "Cozy Days", priority: "whenever", title: "Go on a rainy-day walk together." },
  { cat: "Cozy Days", priority: "whenever", title: "Visit a bookstore and pick a book for each other." },
  { cat: "Cozy Days", priority: "whenever", title: "Have a beach date at sunset." },
  { cat: "Cozy Days", priority: "whenever", title: "Go stargazing somewhere quiet." },
  { cat: "Cozy Days", priority: "whenever", title: "Buy each other a tiny, unexpected gift." },
  { cat: "Cozy Days", priority: "whenever", title: "Visit a flower shop and choose flowers for each other." },
  { cat: "Cozy Days", priority: "whenever", title: "Have a baking date and make a beautiful mess." },
  { cat: "Cozy Days", priority: "whenever", title: "Spend an entire day doing absolutely nothing together." },

  // 4. Places we'll explore
  { cat: "Places to Go", priority: "soon", title: "Explore Julian's favorite places in the Philippines." },
  { cat: "Places to Go", priority: "soon", title: "Show Julian my favorite places in Kerala." },
  { cat: "Places to Go", priority: "whenever", title: "Watch a sunset together on a beautiful beach." },
  { cat: "Places to Go", priority: "whenever", title: "Take a spontaneous road trip." },
  { cat: "Places to Go", priority: "whenever", title: "Visit a mountain viewpoint." },
  { cat: "Places to Go", priority: "whenever", title: "Explore a new city without planning every minute." },
  { cat: "Places to Go", priority: "whenever", title: "Take a train journey together." },
  { cat: "Places to Go", priority: "whenever", title: "Visit a garden filled with flowers." },
  { cat: "Places to Go", priority: "whenever", title: "Stay in a cozy little cottage." },
  { cat: "Places to Go", priority: "someday", title: "Take a trip somewhere neither of us has visited before." },

  // 5. Food, games and silly challenges
  { cat: "Food & Games", priority: "whenever", title: "Cook a meal for each other." },
  { cat: "Food & Games", priority: "whenever", title: "Try each other's favorite food." },
  { cat: "Food & Games", priority: "whenever", title: "Make homemade pizza together." },
  { cat: "Food & Games", priority: "whenever", title: "Have a dessert-tasting date." },
  { cat: "Food & Games", priority: "whenever", title: "Play chess sitting next to each other." },
  { cat: "Food & Games", priority: "whenever", title: "Have a video-game tournament." },
  { cat: "Food & Games", priority: "whenever", title: "Teach each other something we're good at." },
  { cat: "Food & Games", priority: "whenever", title: "Play board games on a rainy evening." },
  { cat: "Food & Games", priority: "whenever", title: "Make a mystery meal using random ingredients." },
  { cat: "Food & Games", priority: "whenever", title: "Create our own couple quiz and see who knows whom better." },

  // 6. The someday chapter
  { cat: "Future Dreams", priority: "soon", title: "Plan a trip together from beginning to end." },
  { cat: "Future Dreams", priority: "soon", title: "Save up for a special holiday together." },
  { cat: "Future Dreams", priority: "soon", title: "Celebrate a birthday in person." },
  { cat: "Future Dreams", priority: "soon", title: "Celebrate our anniversary together in the same place." },
  { cat: "Future Dreams", priority: "whenever", title: "Exchange meaningful gifts we've chosen ourselves." },
  { cat: "Future Dreams", priority: "whenever", title: "Make a scrapbook of our journey." },
  { cat: "Future Dreams", priority: "whenever", title: "Build traditions that belong only to us." },
  { cat: "Future Dreams", priority: "someday", title: "Talk honestly about our future and what we both want." },
  { cat: "Future Dreams", priority: "someday", title: "Build a peaceful, loving home together someday, if we're both ready." },
  { cat: "Future Dreams", priority: "someday", title: "Look back at our original bucket list and see how far we've come." },
];

let insertedCount = 0;
let skippedCount = 0;

for (const item of listItems) {
  const catId = categoryIdMap[item.cat];
  const existing = await client.query(
    "select id from public.bucket_list_items where relationship_id = $1 and title = $2 limit 1",
    [relId, item.title]
  );
  if (existing.rows.length === 0) {
    await client.query(
      `insert into public.bucket_list_items (relationship_id, category_id, title, priority, status, created_by)
       values ($1, $2, $3, $4, 'dreaming', $5)`,
      [relId, catId, item.title, item.priority, userId]
    );
    insertedCount++;
  } else {
    skippedCount++;
  }
}

console.log(`\n🎉 Done! Added ${insertedCount} new bucket list items (${skippedCount} already existed). Total: ${listItems.length} items across 6 chapters.`);

await client.end();
