# Map mods, tiered for the EK CI Elementalist (glis80qp)

Written 06/09/2026. Source pool: poe.re/maps (`reference/poere-map-mods.json`, the English entry per id; opt `nm:!0` = nightmare pool, `prefix:!0` = prefix). Tiers and reasons are this build's, worked from the PoB numbers below — not poe.re's `scary` scores.

## The numbers the tiers rest on (PoB glis80qp, 05/09/2026)

ES 4,738 · armour 3,555 · EHP 108k · max hit phys 7,715 / fire 27,028 / cold 44,596 / lightning 37,163 / chaos immune (CI) · resists 75 / 80 / 76 with fire +13, cold +59, lightning +41 over cap · spell block 75%, attack block 30% · ES recovery: 395/s regen (Zealot's Oath) + 825/s ES leech, recharge on top · mana 907 with 88 unreserved, regen 115/s against EK's 45.7 per cast = 135/s at full speed, no mana leech · spell suppression 0 · 100% elemental-ailment avoidance (two 50% avoid-shock abyss jewels + Stormshroud) · auras: Haste only (heralds are not auras) · no curses of his own, no charge generation.

## Tiers

- **Brick** (`brick`) — Never. Kills this character outright or turns EK off.
- **Danger** (`danger`) — Safe bans it, Loose runs it. A real chance of a one-shot on 4.7k ES.
- **Watch** (`watch`) — Run it, know it. Nothing the regex needs to stop.
- **Slower** (`dps`) — Only slows the clear. Free exp mod for anyone else's build.
- **Free** (`free`) — Does nothing to a chaos-immune, ailment-immune spell caster.

Safe bans Brick + Danger. Loose bans Brick + the Danger lines flagged `loose` (the recovery/block killers: crit, cannot be leeched from, less recovery rate, reduced block / less armour, and 15% penetration in the nightmare pool).

## Regexes (poe.re output for the four profiles saved in Cameron's poe.re, verified by `scripts/test.js`)

### T16 · Safe — `t16-safe` · 109/250 · bans 15

```
"!te of|lier$|' at|ur$|' s|m resistances$|ve phy|er at|from$|\d+ e|h vu|t reg|h tem|tiles$|th el" "!y: (n|m)"
```

15 of the 78 normal-pool mods banned: the four bricks plus everything that turns an ordinary hit into a spike — crit, Vulnerability, Elemental Weakness, Temporal Chains, speed, extra projectiles, chain, impale, no leech, less recovery, reduced block. Roughly one alch roll in four passes.

Banned: Rare Monsters have Elemental Thorns reflecting (900-1500) Elemental Damage · Rare Monsters have Physical Thorns reflecting (400-800) Physical Damage · Players cannot Regenerate Life, Mana or Energy Shield · Players have -(5-12)% to all maximum Resistances · (15-30)% increased Monster Movement Speed · Monsters fire 2 additional Projectiles · Monsters' Attacks have (25-60)% chance to Impale on Hit · Monsters' skills Chain 2 additional times · Monsters cannot be Leeched from · Monsters have (160-400)% increased Critical Strike Chance · Players are Cursed with Elemental Weakness · Players are Cursed with Temporal Chains · Players are Cursed with Vulnerability · Players have (20-40)% reduced Chance to Block · Players have (20-60)% less Recovery Rate of Life and Energy Shield

### T16 · Loose — `t16-loose` · 70/250 · bans 8

```
"!te of|lier$|ur$|m resistances$|ve phy|from$|\d+ e|t reg" "!y: (n|m)"
```

Eight banned: the bricks (no regen, both thorns, minus max res) and the four that switch your recovery or your block off (crit, cannot be leeched, less recovery, reduced block / less armour). Roughly one roll in two passes. Everything else you run with your eyes open.

Banned: Rare Monsters have Elemental Thorns reflecting (900-1500) Elemental Damage · Rare Monsters have Physical Thorns reflecting (400-800) Physical Damage · Players cannot Regenerate Life, Mana or Energy Shield · Players have -(5-12)% to all maximum Resistances · Monsters cannot be Leeched from · Monsters have (160-400)% increased Critical Strike Chance · Players have (20-40)% reduced Chance to Block · Players have (20-60)% less Recovery Rate of Life and Energy Shield

### Nightmare / 16.5 · Safe — `nm-safe` · 197/250 · bans 40

```
"!re monsters h|ith te|to mo|rs fi|er at|te of|m resistances$|re sha|stab|' at|trate|ur$|g vin|drow|element$|' s|em$|from$|rch$|wb|h vu|ech$|t reg|teo|s def|mum p|haz|rfe|^au|th el|rks" "!y: (n|m)"
```

Both pools, 40 mods banned. Honest number: about one roll in twelve passes. The nightmare pool is built to kill a 4.7k-ES character, so rolling these yourself at 98 is a bad deal — buy them pre-rolled with the Safe link below and let the trade filter do the rejecting.

Banned: Rare Monsters have Elemental Thorns reflecting (900-1500) Elemental Damage · Rare Monsters have Physical Thorns reflecting (400-800) Physical Damage · Players cannot Regenerate Life, Mana or Energy Shield · Players have -(5-12)% to all maximum Resistances · (15-30)% increased Monster Movement Speed · Monsters fire 2 additional Projectiles · Monsters' Attacks have (25-60)% chance to Impale on Hit · Monsters' skills Chain 2 additional times · Monsters cannot be Leeched from · Monsters have (160-400)% increased Critical Strike Chance · Players are Cursed with Elemental Weakness · Players are Cursed with Temporal Chains · Players are Cursed with Vulnerability · Players have (20-40)% reduced Chance to Block · Players have (20-60)% less Recovery Rate of Life and Energy Shield · Area contains Drowning Orbs · Monsters gain (180-200)% of their Physical Damage as Extra Damage of a random Element · Players are assaulted by Bloodstained Sawblades · Rare Monsters have Physical Thorns reflecting 1500 Physical Damage · Rare Monsters have Volatile Cores · Area contains Unstable Tentacle Fiends · Players are Cursed with Vulnerability · Players are targeted by a Meteor when they use a Flask · Players have -20% to all maximum Resistances · Players have (30-25)% less Defences · (35-45)% increased Monster Cast Speed · Area contains Labyrinth Hazards · Area contains Runes of the Searing Exarch · Monsters fire 2 additional Projectiles · Monsters inflict 2 Grasping Vines on Hit · Monsters' skills Chain 3 additional times · Players have 40% less effect of Flasks applied to them · Rare monsters in area are Shaper-Touched · +(70-75)% to Monster Critical Strike Multiplier · Area contains patches of moving Marked Ground, inflicting random Marks · Auras from Player Skills which affect Allies also affect Enemies · Monster Damage Penetrates 15% Elemental Resistances · Monsters gain a Power Charge on Hit · Players have (60-50)% reduced Maximum total Life, Mana and Energy Shield Recovery per second from Leech · The Maven interferes with Players

### Nightmare / 16.5 · Loose — `nm-loose` · 114/250 · bans 20 (+1 side-effect)

```
"!re monsters h|to mo|te of|m resistances$|stab|trate|ur$|drow|element$|from$|h vu|wb|t reg|teo|s def" "!y: (n|m)"
```

Both pools, 20 banned: the ten nightmare bricks, the four normal bricks, crit at both strengths, 15% penetration, cannot be leeched, less recovery, reduced block. About one roll in three passes. Side-effect: the triple-curse brick prints as three plain curse lines, so this also skips plain Vulnerability maps — no regex can tell them apart.

Banned: Rare Monsters have Elemental Thorns reflecting (900-1500) Elemental Damage · Rare Monsters have Physical Thorns reflecting (400-800) Physical Damage · Players cannot Regenerate Life, Mana or Energy Shield · Players have -(5-12)% to all maximum Resistances · Monsters cannot be Leeched from · Monsters have (160-400)% increased Critical Strike Chance · Players have (20-40)% reduced Chance to Block · Players have (20-60)% less Recovery Rate of Life and Energy Shield · Area contains Drowning Orbs · Monsters gain (180-200)% of their Physical Damage as Extra Damage of a random Element · Players are assaulted by Bloodstained Sawblades · Rare Monsters have Physical Thorns reflecting 1500 Physical Damage · Rare Monsters have Volatile Cores · Area contains Unstable Tentacle Fiends · Players are Cursed with Vulnerability · Players are targeted by a Meteor when they use a Flask · Players have -20% to all maximum Resistances · Players have (30-25)% less Defences · +(70-75)% to Monster Critical Strike Multiplier · Monster Damage Penetrates 15% Elemental Resistances
Side-effect: Players are Cursed with Vulnerability

Pass-rate method: equal weights per mod, 3 prefixes + 3 suffixes drawn without replacement from the pool(s). Normal pool 43 prefixes / 35 suffixes; both pools 62 / 56. T16 Safe ≈ 0.25, T16 Loose ≈ 0.48, Nightmare Safe ≈ 0.08, Nightmare Loose ≈ 0.29. Real weights differ (the 'inhabited by' prefixes are light at T16), so treat these as order-of-magnitude.

## Buy links (live counts 06/09/2026, buyout only)

- **Nightmare 8-mod · 70%+ More Maps · Safe** — 59 listed, 60–80c. Your farming search with the full Safe ban list. Few listings, but every one of them is a map this character can run. Not-group: 33 ids.
- **Nightmare 8-mod · 70%+ More Maps · Loose** — 514 listed. Same search, bricks and recovery-killers only. Read the eight lines before you buy — Shaper-touched, grasping vines, Maven, marked ground and the speed and projectile mods are all still in here. Not-group: 17 ids.
- **Nightmare 8-mod · any More Maps · Safe** — 406 listed. Drop the 70% floor when the Safe pool runs dry. Sort by More Maps on the trade site. Not-group: 33 ids.
- **Nightmare 8-mod · any More Maps · Loose** — 2,732 listed. The wide net. Only for when you're happy to eyeball every map. Not-group: 17 ids.
- **T16 8-mod corrupted · Safe** — 10,000+ listed. Ordinary T16s at eight mods, Safe list applied. The cheapest way to buy exp maps; add a pack-size floor on the trade site for denser ones. Not-group: 15 ids.
- **T16 8-mod corrupted · Loose** — 10,000+ listed. Same, bricks and recovery-killers only. Not-group: 8 ids.

Trade shape (his own search, made safe): `type: "Nightmare Map"`, and-group `pseudo_number_of_prefix_mods ≥ 4`, `pseudo_number_of_suffix_mods ≥ 4`, `pseudo_map_more_map_drops ≥ 70`; not-group of `explicit.stat_<id>`. A 33-filter not-group is accepted by the API (tested). T16: `type_filters.category = map`, `map_filters.map_tier 16–16`, `misc_filters.corrupted = true`. No price cap on map links. The cheapest Safe 70%+ Nightmare maps were 60–80c; the ten cheapest all carried mods from both pools, which is the evidence that nightmare maps roll the normal pool too.

## Every line, both pools

### Normal pool (78)

| Tier | Loose | P/S | Line | Why (this build) | Trade id | poe.re id | Reward |
|---|---|---|---|---|---|---|---|
| brick |  | P | Rare Monsters have Elemental Thorns reflecting (900-1500) Elemental Damage | EK lands dozens of hits a second. Every hit on a rare reflects 900–1,500 elemental back at you — you delete yourself. | 3938822425 | 1078205993 |  |
| brick |  | P | Rare Monsters have Physical Thorns reflecting (400-800) Physical Damage | Same as elemental thorns, and 3.5k armour mitigates none of it. | 3278889477 | -235013251 |  |
| brick |  | S | Players cannot Regenerate Life, Mana or Energy Shield | EK costs 135 mana a second and you regen 115 with 88 unreserved. No regen means no casts after the first second — and no ES regen either. | 1910157106 | 1305115176 |  |
| brick |  | S | Players have -(5-12)% to all maximum Resistances | Every elemental hit does up to 50% more. On 4.7k ES this is the mod that one-shots you. | 3376488707 | -477049138 |  |
| danger |  | P | (15-30)% increased Monster Movement Speed / (20-45)% increased Monster Attack Speed / (20-45)% increased Monster Cast Speed | Fast monsters reach you mid-cast, and 20–45% attack speed is a lot of extra hits into 4.7k ES. | 2306522833 | 17483843 |  |
| danger |  | P | Monsters fire 2 additional Projectiles | Triples the projectiles in the air — the hardest mod to dodge on a low-armour ES build. | 1309819744 | 1634487773 |  |
| danger |  | P | Monsters' Attacks have (25-60)% chance to Impale on Hit | Impale stacks up to +50% of stored physical, and 3.5k armour barely dents it. Phys max hit is already 7.7k. | 1541224187 | -1204380788 |  |
| danger |  | P | Monsters' skills Chain 2 additional times | Chained projectiles wrap back around corners — nasty in corridors. | 3183973644 | -481946502 |  |
| danger | ban | S | Monsters cannot be Leeched from | Two-thirds of your ES recovery is leech (825/s of about 1,220/s). Without it you are on 395/s regen and recharge. | 1140978125 | 252096506 |  |
| danger | ban | S | Monsters have (160-400)% increased Critical Strike Chance / +(30-45)% to Monster Critical Strike Multiplier | The classic exp-killer. Turns an ordinary hit into a double-damage spike on a 4.7k ES pool. | 2753083623 | -1344829253 |  |
| danger |  | S | Players are Cursed with Elemental Weakness | Fire is only 13 over cap. EW pulls you under 75% and every fire hit scales up from there. | 558910024 | 1882321261 |  |
| danger |  | S | Players are Cursed with Temporal Chains | Slows your casting, movement and cooldowns. Everything you would dodge, you now dodge late. | 2326202293 | 1598599541 |  |
| danger |  | S | Players are Cursed with Vulnerability | Phys max hit is 7.7k. Vulnerability takes about a third off that. | 1366534040 | 1202132179 |  |
| danger | ban | S | Players have (20-40)% reduced Chance to Block / Players have (20-30)% less Armour | 75% spell block is your main layer against spells. 20–40% reduced takes it to 45–60%, and the armour goes with it. | 3729221884 | -999805715 |  |
| danger | ban | S | Players have (20-60)% less Recovery Rate of Life and Energy Shield | Cuts regen, leech and recharge together — up to 60% less of every ES recovery you have. | 4181072906 | -2050206104 |  |
| watch |  | P | (14-40)% increased Monster Damage | Flat more-damage. Fine alone; it is the multiplier under crit and curses. | 1890519597 | -580302769 |  |
| watch |  | P | Area contains two Unique Bosses | Two bosses at once. Fine at 37M DPS — just do not stand between them. | 799271621 | 955801458 |  |
| watch |  | P | Monsters deal (50-110)% extra Physical Damage as Cold | Extra cold. Cold is your best-covered element (max hit 45k, +59 over cap) — the safest of the three. | 3448216135 | 1799781772 |  |
| watch |  | P | Monsters deal (50-110)% extra Physical Damage as Fire | Extra fire. Fire is your thinnest side (max hit 27k, only +13 over cap). Never together with Elemental Weakness. | 1497673356 | -26777606 |  |
| watch |  | P | Monsters deal (50-110)% extra Physical Damage as Lightning | Extra lightning. Max hit 37k. Fine on its own. | 3416853625 | 2132856290 |  |
| watch |  | P | Monsters' Action Speed cannot be modified to below Base Value / Monsters' Movement Speed cannot be modified to below Base Value / Monsters cannot be Taunted | No chill or freeze slows — monsters stay at full speed. | 798009319 | 2105788016 |  |
| watch |  | P | Unique Boss deals (15-25)% increased Damage / Unique Boss has (20-30)% increased Attack and Cast Speed | Faster, harder-hitting boss. Give it room. | 124877078 | -1088873049 |  |
| watch |  | P | Unique Bosses are Possessed | Boss carries tormented-spirit buffs. Do not face-tank it. | 2588474575 | -106071007 |  |
| watch |  | S | Area has patches of Burning Ground | Burning ground is a fire DoT, not an ignite — your ailment immunity does not cover it. Do not cast standing in it. | 133340941 | 1211148661 |  |
| watch |  | S | Buffs on Players expire (30-100)% faster | Flask effects and golem buffs run out sooner. Annoying, not deadly. | 1217583941 | -946283701 |  |
| watch |  | S | Monsters gain a Frenzy Charge on Hit | Monsters speed up as they land hits. Kill fast, and you will. | 1742567045 | -1094717370 |  |
| watch |  | S | Monsters gain a Power Charge on Hit | Monster crit ramps as they hit you. Never alongside a crit mod. | 406353061 | 1283094925 |  |
| watch |  | S | Monsters have (45-100)% increased Area of Effect | Bigger slams and ground effects. Give bosses room. |  | 1899039946 |  |
| watch |  | S | Monsters Hinder on Hit with Spells | 30% slow when a spell hits you. | 962720646 | 1743546402 |  |
| watch |  | S | Monsters Maim on Hit with Attacks | 30% slow when an attack hits you. | 4164174520 | -80588106 |  |
| watch |  | S | Players gain (30-50)% reduced Flask Charges | Fewer flask uses. Annoying, not deadly. | 2549889921 | -763914456 |  |
| watch |  | S | Players have (20-40)% less Cooldown Recovery Rate | Frostblink comes back slower. | 941368244 | -1473394034 |  |
| dps |  | P | (20-100)% more Monster Life | Slower kills only. | 95249895 | -172005981 |  |
| dps |  | P | +(15-25)% Monster Chaos Resistance / +(20-40)% Monster Elemental Resistances | Heralds add fire, cold and lightning on top of EK's physical — monster resists trim that. DPS only. | 1054098949 | -694214737 |  |
| dps |  | P | +(20-40)% Monster Physical Damage Reduction | Part of EK's hit is still physical. Slower, not dangerous. | 839186746 | 823410479 |  |
| dps |  | P | Monsters cannot be Stunned / (15-30)% more Monster Life | Slower kills only. | 1041951480 | 1541760497 |  |
| dps |  | P | Monsters gain (20-80)% of Maximum Life as Extra Maximum Energy Shield | Slower kills only. | 2887760183 | -1616686189 |  |
| dps |  | P | Monsters have +(30-100)% chance to Suppress Spell Damage | EK is a spell — suppressed hits do half damage. Slower, not dangerous. | 2138205941 | -268547495 |  |
| dps |  | P | Unique Boss has (25-35)% increased Life / Unique Boss has (45-70)% increased Area of Effect | Longer boss fight only. | 3040667106 | -106750911 |  |
| dps |  | S | Area has patches of Consecrated Ground | Monsters regen on it. Irrelevant at 37M DPS. | 1948962470 | -1139261923 |  |
| dps |  | S | Monsters gain an Endurance Charge on Hit | Monsters take less physical. Slower. | 687813731 | -225071089 |  |
| dps |  | S | Monsters have (30-70)% chance to Avoid Elemental Ailments | Fewer freezes and shocks from your heralds. Slower clear, nothing more. | 322206271 | -1772662453 |  |
| dps |  | S | Monsters take (25-45)% reduced Extra Damage from Critical Strikes | You are 97% crit with 505% multi — this is a real DPS cut, but only DPS. | 337935900 | -54649013 |  |
| dps |  | S | Players are Cursed with Enfeeble | Less damage dealt. Nothing else. | 4103440490 | 339937661 |  |
| dps |  | S | Players cannot inflict Exposure | Minor DPS. | 1026390635 | 1428847539 |  |
| dps |  | S | Players have (15-25)% less Area of Effect | Smaller herald explosions. | 2312028586 | 829751875 |  |
| free |  | P | (20-30)% increased number of Rare Monsters | More rares is more exp. You want this one. | 3126771445 | -683043845 |  |
| free |  | P | (25-60)% less effect of Curses on Monsters | You do not curse anything. | 3796523155 | -539026720 |  |
| free |  | P | All Monster Damage from Hits always Ignites | Ignite is an ailment and you avoid 100% of them. | 816367946 | 2080363489 |  |
| free |  | P | Area contains many Totems | Totems die to one volley. | 1000591322 | -1099682289 |  |
| free |  | P | Area has increased monster variety | Flavour. | 3561450806 | 156744008 |  |
| free |  | P | Area is inhabited by Abominations | Flavour. |  | 1082020744 |  |
| free |  | P | Area is inhabited by Animals | Flavour. |  | 1424047266 |  |
| free |  | P | Area is inhabited by Cultists of Kitava | Flavour. |  | -1934587276 |  |
| free |  | P | Area is inhabited by Demons | Flavour. |  | 980061401 |  |
| free |  | P | Area is inhabited by Ghosts | Flavour. |  | 1723792253 |  |
| free |  | P | Area is inhabited by Goatmen | Flavour. |  | -210607554 |  |
| free |  | P | Area is inhabited by Humanoids | Flavour. |  | -617888797 |  |
| free |  | P | Area is inhabited by Lunaris fanatics | Flavour. |  | -737013402 |  |
| free |  | P | Area is inhabited by ranged monsters | A few more projectiles coming in. Fine. |  | -1047451686 |  |
| free |  | P | Area is inhabited by Sea Witches and their Spawn | Flavour. |  | 775962019 |  |
| free |  | P | Area is inhabited by Skeletons | Flavour. |  | 58884108 |  |
| free |  | P | Area is inhabited by Solaris fanatics | Flavour. |  | 194321329 |  |
| free |  | P | Area is inhabited by Undead | Flavour. |  | -688435205 |  |
| free |  | P | Monsters are Hexproof | You do not curse anything. | 4154059009 | 1551446200 |  |
| free |  | P | Monsters gain (21-35)% of their Physical Damage as Extra Chaos Damage / Monsters Inflict Withered for 2 seconds on Hit | CI: chaos immune, and Withered does nothing to you. | 1840747977 | 10729340 |  |
| free |  | P | Monsters have a (15-20)% chance to Ignite, Freeze and Shock on Hit | Ailments — you avoid 100% of them. | 2553656203 | -166549521 |  |
| free |  | P | Monsters have a (20-50)% chance to avoid Poison, Impale, and Bleeding | You use none of the three. |  | -627831782 |  |
| free |  | S | (20-30)% increased Magic Monsters | More magic packs is more exp. | 1821565133 | 583869527 |  |
| free |  | S | Area has patches of Chilled Ground | Chill is an ailment — immune. | 349586058 | 1062763755 |  |
| free |  | S | Area has patches of desecrated ground | Chaos DoT — CI. | 3577222856 | -128171261 |  |
| free |  | S | Area has patches of Shocked Ground which increase Damage taken by (20-50)% | Shocked ground applies the shock ailment — your 100% avoidance covers it. | 3246076198 | 472035128 |  |
| free |  | S | Monsters Blind on Hit | Blind hits accuracy and evasion. You use neither. | 1629869774 | 2122294281 |  |
| free |  | S | Monsters Poison on Hit | Poison is chaos — CI. | 3350803563 | 1578069823 |  |
| free |  | S | Monsters steal Power, Frenzy and Endurance charges on Hit | You do not run on charges. | 3222482040 | -1358177810 |  |
| free |  | S | Players have -(10-20)% to amount of Suppressed Spell Damage Prevented / Monsters have (30-50)% increased Accuracy Rating | No suppression to lose, and accuracy against zero evasion changes nothing. |  | 151806012 |  |
| free |  | S | Players have (15-25)% less Accuracy Rating | Spells do not roll accuracy. |  | -114660370 |  |
| free |  | S | Players have (25-60)% reduced effect of Non-Curse Auras from Skills | Heralds are not auras. Only Haste shrinks. | 2450628570 | 1101434369 |  |

### Nightmare pool (44) — rolls on top of the normal pool

| Tier | Loose | P/S | Line | Why (this build) | Trade id | poe.re id | Reward |
|---|---|---|---|---|---|---|---|
| brick |  | P | Area contains Drowning Orbs | Orbs that follow you and drown you. You cannot cast your way out. | 25225034 | -887278806 |  |
| brick |  | P | Monsters gain (180-200)% of their Physical Damage as Extra Damage of a random Element | Monsters deal nearly three times their damage, as elemental. | 4062840317 | -645418310 |  |
| brick |  | P | Players are assaulted by Bloodstained Sawblades | Sawblades track you across the whole map — constant physical hits into 3.5k armour. | 3052102815 | 1061710360 | +35% Currency |
| brick |  | P | Rare Monsters have Physical Thorns reflecting 1500 Physical Damage / Rare Monsters have Elemental Thorns reflecting 2500 Elemental Damage | 1,500 physical and 2,500 elemental back per hit on rares. The nightmare version of the thorns brick. | 3278889477 | -1430865583 | +35% Currency |
| brick |  | P | Rare Monsters have Volatile Cores | Every rare can drop volatiles that chase you and explode. Your own exclusion — keep it. | 1706239920 | 1665221611 | +35% Scarabs |
| brick |  | S | Area contains Unstable Tentacle Fiends | Fiends spawn and beam you for big elemental hits. Your own exclusion — keep it. | 1943574423 | -1629200695 |  |
| brick |  | S | Players are Cursed with Vulnerability / Players are Cursed with Temporal Chains / Players are Cursed with Elemental Weakness | Vulnerability, Temporal Chains and Elemental Weakness at once. | 1366534040 | 647925005 |  |
| brick |  | S | Players are targeted by a Meteor when they use a Flask | A meteor every time a flask fires. If your flasks are instilled to auto-use, that is a meteor every few seconds. | 4102870672 | 1333860371 | +35% Currency |
| brick |  | S | Players have -20% to all maximum Resistances | 75% max res becomes 55% — every elemental hit does 1.8×. Run nothing with this. | 3376488707 | -2038489408 |  |
| brick |  | S | Players have (30-25)% less Defences | Defences includes energy shield. 30% less puts you on a 3.3k pool. | 943960754 | 1464066514 | +35% Scarabs |
| danger |  | P | (35-45)% increased Monster Cast Speed / (35-45)% increased Monster Attack Speed / (25-30)% increased Monster Movement Speed | 35–45% attack and cast speed, 25–30% move speed. Everything is on you sooner and hits more often. | 2306522833 | -933231182 |  |
| danger |  | P | Area contains Labyrinth Hazards | Trap gauntlets in the layout. Physical spikes. | 2577650864 | 1538178254 |  |
| danger |  | P | Area contains Runes of the Searing Exarch | Exploding fire runes on the ground — fire is your thinnest max hit. | 2073168229 | 707446389 |  |
| danger |  | P | Monsters fire 2 additional Projectiles / Monsters have 100% increased Area of Effect | Triple projectiles and double-size everything. | 1309819744 | 1469490158 |  |
| danger |  | P | Monsters inflict 2 Grasping Vines on Hit | Rooted in place while things hit you. Maps reward, but not at 98. | 1751584857 | -931745379 | +35% Maps |
| danger |  | P | Monsters' skills Chain 3 additional times / Monsters' Projectiles can Chain when colliding with Terrain | Three chains plus terrain bounces. Projectiles never leave. | 3183973644 | -949334443 |  |
| danger |  | P | Players have 40% less effect of Flasks applied to them | Every flask does 40% less — that is your block flask and your ES flask. Currency reward; Loose only. | 1207482628 | -105914721 | +35% Currency |
| danger |  | P | Rare monsters in area are Shaper-Touched | Shaper beams and slams from every rare pack. | 2931889194 | -1818595967 |  |
| danger | ban | S | +(70-75)% to Monster Critical Strike Multiplier / Monsters have (650-700)% increased Critical Strike Chance | 650–700% crit chance with +75% multi. Roughly every second hit is a crit for double. Nothing at 98 should run this. | 2753083623 | 246480838 |  |
| danger |  | S | Area contains patches of moving Marked Ground, inflicting random Marks | Random marks on you — an Assassin's Mark means monsters crit you. Scarabs reward, not worth it at 98. | 2796704737 | 1932675161 | +35% Scarabs |
| danger |  | S | Auras from Player Skills which affect Allies also affect Enemies | Your Haste becomes their Haste. | 2156372077 | 1861748274 |  |
| danger | ban | S | Monster Damage Penetrates 15% Elemental Resistances | 15% penetration is -15% max res on every elemental hit: 75% becomes 60%, damage taken goes up 60%. | 1898978455 | -1158025910 |  |
| danger |  | S | Monsters gain a Power Charge on Hit / Monsters have +1 to Maximum Power Charges | Monster crit ramps to four charges as they hit you. Maps reward, but pairs terribly with any crit mod. | 406353061 | 1494523238 | +35% Maps |
| danger |  | S | Players have (60-50)% reduced Maximum total Life, Mana and Energy Shield Recovery per second from Leech | Halves your leech cap. With 'cannot be leeched from' it is the pair that kills CI leech builds. | 2946888410 | 1205583947 |  |
| danger |  | S | The Maven interferes with Players | Maven fires her abilities at you mid-map. | 1594156261 | 1756122717 |  |
| watch |  | P | Map Boss is accompanied by a Synthesis Boss | A second boss at the map boss. Fine. | 4150353141 | -2064669900 |  |
| watch |  | P | Rare Monsters each have 1 additional Modifier / (35-45)% increased number of Rare Monsters | More, nastier rares. More exp too. | 2550456553 | -1647756153 |  |
| watch |  |  | Buffs on Players expire 100% faster / 35% more Scarabs found in this Area | Flask effects and golem buffs run out twice as fast. Scarabs reward. | 1217583941 | -1298230190 (no EN text) | +35% Scarabs |
| watch |  | S | Monsters cannot be Stunned / Monsters' Action Speed cannot be modified to below Base Value / Monsters' Movement Speed cannot be modified to below Base Value | No chill or freeze slows — monsters stay at full speed. | 798009319 | 670500310 |  |
| watch |  | S | Monsters gain a Frenzy Charge on Hit / Monsters have +1 to Maximum Frenzy Charges | Faster, harder-hitting monsters as they land hits. Maps reward — fine if you kill first. | 1742567045 | -1621497665 | +35% Maps |
| watch |  | S | Unique Monsters have a random Shrine Buff | A unique with an Acceleration or Echoing shrine hits hard. Maps reward — worth it, just respect the uniques. | 872972810 | 639399394 | +35% Maps |
| dps |  | P | +50% Monster Physical Damage Reduction / +55% Monster Elemental Resistances / +35% Monster Chaos Resistance | Big DPS cut. Only DPS. | 839186746 | -258709095 |  |
| dps |  |  | (90-100)% more Monster Life / 47% more Currency found in this Area | Double monster life. Slow, and a Currency reward. | 95249895 | -875993462 (no EN text) | +35% Currency |
| dps |  | S | 25% chance for Rare Monsters to Fracture on death | More rares. Good. | 3097694855 | 1313044496 |  |
| dps |  | S | Debuffs on Monsters expire 100% faster | Your chills and shocks fall off quicker. Currency reward — take it. | 1200027417 | 1117764869 | +35% Currency |
| dps |  |  | Monsters gain (70-80)% of Maximum Life as Extra Maximum Energy Shield / 35% more Maps found in this Area | Slower kills only. Maps reward. | 2887760183 | 646965355 (no EN text) | +35% Maps |
| dps |  | S | Monsters have +1 to Maximum Endurance Charges / Monsters gain an Endurance Charge when hit | Monsters take less physical. Slower — and a Maps reward, so worth having. | 3707756896 | 357242916 | +35% Maps |
| dps |  |  | Monsters have +100% chance to Suppress Spell Damage / 35% more Maps found in this Area | Every EK hit is suppressed — half damage. Slow, and a Maps reward. | 2138205941 | -938285245 (no EN text) | +35% Maps |
| dps |  | S | Players have (30-25)% less Area of Effect | Smaller herald explosions. | 2312028586 | 284489036 |  |
| dps |  | S | Rare monsters in area Temporarily Revive on death | Kill the rares twice. More exp. | 1593763475 | 972998450 |  |
| free |  | P | Monsters gain (80-100)% of their Physical Damage as Extra Chaos Damage | Chaos — CI. | 1840747977 | 127168403 |  |
| free |  | P | Monsters have +50% Chance to Block Attack Damage | You cast. Free Currency reward. | 881836292 | -1940135977 | +35% Currency |
| free |  | P | Monsters Ignite, Freeze and Shock on Hit / All Monster Damage can Ignite, Freeze and Shock | Ailments — immune. Free Scarabs reward. | 2919181457 | -126908257 | +35% Scarabs |
| free |  | S | Monsters Poison on Hit / Monsters have 100% increased Poison Duration / All Damage from Monsters' Hits can Poison | Poison is chaos — CI. | 3350803563 | 1014295028 |  |

## Caveats

- In-game search is per line, case-insensitive; `!` negates; `"!y: (n|m)"` keeps only rares. The triple-curse nightmare line prints as three plain curse lines, so no regex can ban it without also banning plain Vulnerability / Temporal Chains / Elemental Weakness — Safe bans those anyway; Loose picks up plain Vulnerability as a side-effect.
- poe.re's English data has no entry for four nightmare lines (70–80% life as ES + Maps, buffs expire 100% faster + Scarabs, +100% suppress + Maps, 90–100% more life + Currency). None matters to this build. poe.re's text for Volatile Cores is 'Rare Monsters have Volatile Cores'; the trade stat reads 'Rare Monsters have #% chance to have a Volatile Core'. The nightmare regexes cover it with `re monsters h` either way; the trade links use the stat id.
- Shocked ground counts as free because it applies the shock ailment, which 100% avoidance covers. Burning ground is a plain fire DoT (not an ignite) and stays Watch. Meteor-on-flask is a brick on the assumption the flasks fire automatically (instilled); with manual flasks it is Danger.
- 'Players have X% less Defences' reduces energy shield as well as armour and evasion — brick for CI. Its trade stat is 'Players have #% more Defences' (943960754) with a negative value.
- Tiers reflect the 05/09 PoB. Re-check after the helmet / boots / gloves upgrades: more ES and the block flask move Danger lines toward Watch, not the other way.
