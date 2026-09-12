// Measured bottle database. One row per bottle a brand sells; the storefront
// derives brand pages, size pages and "fits" lists from this table, so adding a
// row is how a new brand appears everywhere.
//
// hole:     hole diameter (mm) that fits the bottle: measured base + 1 mm.
// measured: base width as measured (mm), null when only the hole size is known.
// height:   bottle height (mm), null when not measured.
// type:     travel-spray | rollerball | decant | sample
// shape:    round | square
// aliases:  extra search terms (abbreviations, retailer names).

const b = (brand, product, volume, type, hole, extra = {}) => ({
  brand,
  product,
  volume,
  type,
  hole,
  shape: "round",
  measured: null,
  height: null,
  aliases: [],
  ...extra,
});

export const bottles = [
  // 15 mm
  b("Yves Saint Laurent", "Travel Spray", "10ml", "travel-spray", 15, { aliases: ["YSL"] }),
  b("Maison Margiela", "'REPLICA' Travel Spray", "10ml", "travel-spray", 15, { aliases: ["Replica"] }),
  b("DecantX", "Travel Spray", "10ml", "decant", 15, { aliases: ["Decant X"] }),
  b("Prada", "Travel Spray", "10ml", "travel-spray", 15),
  b("Gucci", "Travel Spray", "10ml", "travel-spray", 15),
  b("Charlotte Tilbury", "Travel Spray", "10ml", "travel-spray", 15),
  b("Carolina Herrera", "Travel Spray", "10ml", "travel-spray", 15),
  b("Burberry", "Travel Spray", "10ml", "travel-spray", 15),
  b("Marc Jacobs", "Travel Spray", "10ml", "travel-spray", 15),
  b("Jimmy Choo", "Travel Spray", "10ml", "travel-spray", 15),
  b("Armani", "Travel Spray", "10ml", "travel-spray", 15, { aliases: ["Giorgio Armani"] }),
  b("Ariana Grande", "Travel Spray", "10ml", "travel-spray", 15),
  b("Henry Rose", "Travel Spray", "8ml", "travel-spray", 15),
  b("Ellis Brooklyn", "Travel Spray", "10ml", "travel-spray", 15),

  // 16 mm
  b("LoveShackFancy", "Travel Spray", "10ml", "travel-spray", 16),
  b("Commodity", "Travel Spray", "10ml", "travel-spray", 16),
  b("Clean Reserve", "Rollerball", "10ml", "rollerball", 16),
  b("Boy Smells", "Travel Spray", "10ml", "travel-spray", 16),

  // 17 mm
  b("NEST New York", "Rollerball", "6ml", "rollerball", 17, { aliases: ["Nest"] }),
  b("Fenty", "Travel Spray", "10ml", "travel-spray", 17, { aliases: ["Fenty Beauty"] }),

  // 18 mm
  b("FORVR Mood", "Travel Spray", "10ml", "travel-spray", 18),
  b("World of Chris Collins", "Travel Spray", "7.5ml", "travel-spray", 18),
  b("KILIAN Paris", "Travel Spray", "7.5ml", "travel-spray", 18, { aliases: ["Kilian"] }),

  // 19 mm
  b("ScentSplit", "Travel Spray", "9ml", "decant", 19, { aliases: ["Scent Split"] }),
  b("NEST New York", "Travel Spray", "8ml", "travel-spray", 19, { aliases: ["Nest"] }),
  b("Versace", "Travel Spray", "10ml", "travel-spray", 19),
  b("SKYLAR", "Rollerball", "10ml", "rollerball", 19),
  b("The 7 Virtues", "Travel Spray", "10ml", "travel-spray", 19),
  b("Henry Rose", "Travel Spray", "7.5ml", "travel-spray", 19),
  b("Maison Louis Marie", "Travel Spray", "10ml", "travel-spray", 19),

  // 20 mm
  b("Viktor&Rolf", "Travel Spray", "10ml", "travel-spray", 20, { aliases: ["Viktor and Rolf"] }),
  b("Glossier", "Travel Spray", "8ml", "travel-spray", 20),
  b("Phlur", "Travel Spray", "9.5ml", "travel-spray", 20),

  // 21 mm
  b("DedCool", "Travel Spray", "15ml", "travel-spray", 21),

  // 22 mm
  b("TOM FORD", "Travel Spray", "10ml", "travel-spray", 22, { aliases: ["Tom Ford"] }),
  b("Jo Malone London", "Travel Spray", "10ml", "travel-spray", 22, { aliases: ["Jo Malone"] }),
  b("Valentino", "Travel Spray", "10ml", "travel-spray", 22),
];

export const bottleTypes = {
  "travel-spray": "Travel spray",
  rollerball: "Rollerball",
  decant: "Decant",
  sample: "Sample vial",
};
