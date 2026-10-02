import { assertEquals } from "jsr:@std/assert@1";
import { getXPLevel } from "./level.ts";

Deno.test("returns level 1 for zero XP", () => {
  assertEquals(getXPLevel(0), {
    level: 1,
    name: "Iniciante",
    levelXp: 0,
    levelXpRequired: 500,
    levelProgress: 0,
  });
});

Deno.test("returns level 2 at 500 XP", () => {
  assertEquals(getXPLevel(500), {
    level: 2,
    name: "Curiosa",
    levelXp: 0,
    levelXpRequired: 500,
    levelProgress: 0,
  });
});

Deno.test("returns level 3 at 1000 XP", () => {
  assertEquals(getXPLevel(1000), {
    level: 3,
    name: "Aventureira",
    levelXp: 0,
    levelXpRequired: 1000,
    levelProgress: 0,
  });
});

Deno.test("returns level 4 and 34% progress at 2340 XP", () => {
  assertEquals(getXPLevel(2340), {
    level: 4,
    name: "Exploradora",
    levelXp: 340,
    levelXpRequired: 1000,
    levelProgress: 34,
  });
});

Deno.test("keeps the final title for levels above the named range", () => {
  assertEquals(getXPLevel(12000).name, "Lendária");
  assertEquals(getXPLevel(12000).level, 14);
});
