export const RARITIES = {
  uncommon: { label: "Uncommon", color: "#8ce6a4" },
  rare: { label: "Rare", color: "#77c8ff" },
  epic: { label: "Epic", color: "#c39bff" },
  legendary: { label: "Legendary", color: "#ffcf71" },
  mystical: { label: "Mystical", color: "#80efdf" },
  op: { label: "OP", color: "#ff86bd" },
};
export const DEFAULT_PACK_CHANCES = {
  uncommon: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mystical: 0.9,
  op: 0.1,
};
const tiers = [
  "uncommon",
  "uncommon",
  "uncommon",
  "uncommon",
  "rare",
  "rare",
  "epic",
  "legendary",
  "mystical",
  "op",
];
const definitions = [
  [
    "woodland",
    "Woodland Wilds",
    100,
    "#83ce99",
    "🌲",
    "Small paws. Big forest energy.",
    [
      ["🦝", "Moonlight Raccoon"],
      ["🦫", "Builder Beaver"],
      ["🦔", "Pocket Hedgehog"],
      ["🦌", "Meadow Deer"],
      ["🐿️", "Acorn Scout"],
      ["🦡", "Midnight Badger"],
      ["🦨", "Velvet Skunk"],
      ["🫎", "Northern Moose"],
      ["🐗", "Bramble Boar"],
      ["🦥", "Ancient Sloth"],
    ],
  ],
  [
    "safari",
    "Savannah Sun",
    125,
    "#e4be70",
    "🌅",
    "Meet the legends of the golden plains.",
    [
      ["🦁", "Sunbeam Lion"],
      ["🐘", "Gentle Giant"],
      ["🦒", "Skywatch Giraffe"],
      ["🦓", "Zigzag Zebra"],
      ["🦏", "Ironhide Rhino"],
      ["🦛", "River Hippo"],
      ["🐆", "Shadow Leopard"],
      ["🦬", "Thunder Bison"],
      ["🦧", "Canopy Sage"],
      ["🦍", "Silverback King"],
    ],
  ],
  [
    "ocean",
    "Deep Blue",
    150,
    "#69c9eb",
    "🌊",
    "Dive for a collection from the deep.",
    [
      ["🐬", "Wave Rider"],
      ["🐳", "Bubble Whale"],
      ["🐋", "Ocean Voyager"],
      ["🦈", "Reef Hunter"],
      ["🐠", "Coral Dancer"],
      ["🐡", "Spiky Puffer"],
      ["🦀", "Claw Captain"],
      ["🦞", "Crimson Lobster"],
      ["🦑", "Ink Phantom"],
      ["🪼", "Crystal Jelly"],
    ],
  ],
  [
    "sky",
    "Sky Riders",
    125,
    "#b4c8ff",
    "☁️",
    "A flock of colourful high flyers.",
    [
      ["🦅", "Summit Eagle"],
      ["🦉", "Twilight Owl"],
      ["🦜", "Jungle Parrot"],
      ["🦚", "Royal Peacock"],
      ["🦩", "Sunset Flamingo"],
      ["🦢", "Moonlit Swan"],
      ["🦆", "Puddle Duck"],
      ["🐦", "Bluebird Scout"],
      ["🐦‍🔥", "Solar Phoenix"],
      ["🐧", "Emperor Penguin"],
    ],
  ],
  [
    "farm",
    "Farmyard Friends",
    75,
    "#d9b992",
    "🌾",
    "Your cosy countryside collection.",
    [
      ["🐮", "Clover Cow"],
      ["🐷", "Puddle Pig"],
      ["🐔", "Sunrise Chicken"],
      ["🐣", "Golden Chick"],
      ["🐑", "Cloud Sheep"],
      ["🐐", "Mountain Goat"],
      ["🐴", "Chestnut Horse"],
      ["🐇", "Lucky Rabbit"],
      ["🐕", "Faithful Hound"],
      ["🐈", "Harvest Cat"],
    ],
  ],
  [
    "bugs",
    "Tiny Titans",
    100,
    "#b8d977",
    "🍃",
    "Tiny explorers with larger-than-life names.",
    [
      ["🦋", "Prism Butterfly"],
      ["🐝", "Honey Pilot"],
      ["🐞", "Lucky Ladybird"],
      ["🐜", "Trail Captain"],
      ["🪲", "Emerald Beetle"],
      ["🦗", "Meadow Musician"],
      ["🕷️", "Silk Weaver"],
      ["🦂", "Desert Guardian"],
      ["🪳", "Armour Scout"],
      ["🐛", "Jade Caterpillar"],
    ],
  ],
  [
    "prehistoric",
    "Lost World",
    175,
    "#b3cf88",
    "🌋",
    "Unearth creatures and ancient treasures.",
    [
      ["🦖", "Tiny Tyrant"],
      ["🦕", "Fern Grazer"],
      ["🐊", "Marsh Snapper"],
      ["🦎", "Stone Lizard"],
      ["🐢", "Mossback Turtle"],
      ["🐍", "Jungle Serpent"],
      ["🐉", "Ancient Dragon"],
      ["🦴", "Fossil Knight"],
      ["🥚", "Mystery Hatchling"],
      ["🪨", "Meteor Guardian"],
    ],
  ],
  [
    "space",
    "Cosmic Voyagers",
    200,
    "#b8a1ff",
    "🚀",
    "Launch a crew from another galaxy.",
    [
      ["🧑‍🚀", "Star Explorer"],
      ["🛸", "Orbit Visitor"],
      ["🛰️", "Signal Scout"],
      ["🌌", "Nebula Spirit"],
      ["🌠", "Shooting Star"],
      ["☄️", "Comet Runner"],
      ["🪐", "Ringed Monarch"],
      ["🌕", "Lunar Watcher"],
      ["🌞", "Solar Sovereign"],
      ["🤖", "Galactic Sentinel"],
    ],
  ],
  [
    "mythic",
    "Mythic Realms",
    250,
    "#e4a7e8",
    "✨",
    "A storybook pack full of magic.",
    [
      ["🦄", "Starlight Unicorn"],
      ["🧚", "Petal Fairy"],
      ["🧞", "Sapphire Genie"],
      ["🧜", "Pearl Mermaid"],
      ["🧝", "Forest Elf"],
      ["🧌", "Bridge Troll"],
      ["🧙‍♀️", "Moon Witch"],
      ["🧛", "Velvet Vampire"],
      ["🐲", "Jade Dragon"],
      ["👑", "Eternal Crown"],
    ],
  ],
  [
    "treats",
    "Sweet Street",
    100,
    "#f1a7be",
    "🍰",
    "Collect a deliciously playful new look.",
    [
      ["🍩", "Sprinkle Donut"],
      ["🧁", "Cloud Cupcake"],
      ["🍪", "Cookie Champion"],
      ["🍦", "Vanilla Swirl"],
      ["🍫", "Cocoa Knight"],
      ["🍭", "Rainbow Lollipop"],
      ["🍬", "Candy Comet"],
      ["🥨", "Pretzel Pal"],
      ["🧇", "Golden Waffle"],
      ["🍿", "Popcorn Superstar"],
    ],
  ],
  [
    "arcade",
    "Arcade Legends",
    150,
    "#92d9cd",
    "🎟️",
    "A celebration of your favourite pastimes.",
    [
      ["👾", "Pixel Invader"],
      ["🎮", "Console Captain"],
      ["🕹️", "Joystick Hero"],
      ["🎲", "Lucky Roller"],
      ["♟️", "Checkmate Shadow"],
      ["🧩", "Puzzle Pro"],
      ["🎯", "Bullseye Ace"],
      ["🪀", "Orbit Yo-Yo"],
      ["🎸", "Neon Rockstar"],
      ["🎧", "Legendary DJ"],
    ],
  ],
  [
    "royal",
    "Royal Relics",
    250,
    "#f4cc83",
    "⚜️",
    "Unlock treasures worthy of a throne.",
    [
      ["💎", "Crystal Regent"],
      ["🔮", "Oracle Orb"],
      ["🪄", "Enchanted Wand"],
      ["⚔️", "Dawn Duelist"],
      ["🛡️", "Royal Defender"],
      ["🏹", "Silver Archer"],
      ["🗝️", "Vault Keeper"],
      ["🏰", "Cloud Castle"],
      ["🧿", "Mystic Eye"],
      ["💫", "Astral Emperor"],
    ],
  ],
];
export const PACKS = definitions.map(
  ([id, name, price, color, value, description]) => ({
    id: "pack-" + id,
    type: "pack",
    name,
    price,
    color,
    value,
    description,
    chances: { ...DEFAULT_PACK_CHANCES },
  }),
);
export const PACK_AVATARS = definitions.flatMap(([packId, , , , , , avatars]) =>
  avatars.map(([value, name], index) => ({
    id: `avatar-${packId}-${index + 1}`,
    type: "avatar",
    packId: "pack-" + packId,
    name,
    value,
    rarity: tiers[index],
    price: 0,
    description: `${RARITIES[tiers[index]].label} · ${PACKS.find((p) => p.id === "pack-" + packId).name}`,
  })),
);
export function eligiblePackItems(packId, items) {
  return items.filter(
    (i) => i.type === "avatar" && i.packId === packId && !i.hidden,
  );
}
export function validPackChances(chances) {
  return (
    chances &&
    typeof chances === "object" &&
    !Array.isArray(chances) &&
    Object.keys(chances).length === 6 &&
    Object.keys(RARITIES).every(
      (r) =>
        typeof chances[r] === "number" &&
        Number.isFinite(chances[r]) &&
        chances[r] >= 0 &&
        chances[r] <= 100 &&
        Math.abs(chances[r] * 100 - Math.round(chances[r] * 100)) < 1e-7,
    ) &&
    Object.values(chances).reduce((s, v) => s + Math.round(v * 100), 0) ===
      10000
  );
}
export function packOdds(chances = DEFAULT_PACK_CHANCES) {
  return Object.entries(RARITIES).map(([rarity, meta]) => ({
    rarity,
    ...meta,
    chance: chances[rarity],
  }));
}
export function packReady(items, chances) {
  return (
    validPackChances(chances) &&
    Object.keys(RARITIES).every(
      (r) => chances[r] === 0 || items.some((i) => i.rarity === r),
    )
  );
}
export function choosePackRarity(chances, roll) {
  if (
    !validPackChances(chances) ||
    !Number.isInteger(roll) ||
    roll < 0 ||
    roll >= 10000
  )
    throw new Error("Invalid pack draw");
  let n = roll;
  for (const rarity of Object.keys(RARITIES)) {
    n -= Math.round(chances[rarity] * 100);
    if (n < 0) return rarity;
  }
}
