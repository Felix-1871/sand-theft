# Sand Theft · The Glass Housing Program

Cezary Baryka already owns a glass house. He sets out to build a whole settlement, and the nearest playground has enough sand to get him started.

## Extraction

The playground starts with 100,000 grains, and Cezary collects one grain per click. Every area has a finite supply. Emptying it opens the next, and the player chooses when to move on. Sand, equipment, helpers, and the settlement carry over from one area to the next.

Sand buys one-time equipment and repeatable helpers. Shop items appear as sand is extracted from their area and remain available later in that run. The next hire of the same type costs 35% more before discounts, rounded up. Helpers work while the page is visible.

| Area | Sand supply | Base planet payout |
| --- | ---: | ---: |
| Playground | 100,000 | — |
| Municipal Beach | 14,000,000 | — |
| Strategic Sand Quarry | 245,000,000 | — |
| Baltic Seabed | 2,500,000,000 | — |
| Desert of National Importance | 23,000,000,000 | 1 |
| Lunar Regolith Depot | 400,000,000,000 | 2 |
| Martian Dust Customs Zone | 6,000,000,000,000 | 4 |
| Saturn Ring Reserve | 85,000,000,000,000 | 8 |

## Glass Settlement

Emptying the playground opens the settlement with Cezary's original house available to assign. New houses start at 1,000 grains, with an additional 250 grains on the base price for each one built. Assigning homes moves in families permanently. The homes still count toward the total.

The three paths improve manual digging, helpers, or construction. Each path has four programs, costing 1, 2, 4, and 8 homes, with each program requiring the previous one in that path. Players can mix paths. Percentages of the same kind within a path add together. Flat equipment and family bonuses apply before the corresponding multipliers.

## Glass Planet

Emptying the desert enables an optional reset for planets. Payout depends on the deepest area fully cleared in the current run. A Planet reset takes Cezary back to the playground with all areas restocked. It clears the run's sand, shop purchases, and settlement, unless Portable Settlement is owned.

Each planet ever earned adds 300% of base extraction, even after spending it. The Off-World Zoning Charter costs 1 planet and permanently opens the three bonus areas in sequence. The Census doubles future payouts, and the Permit for an Entire Universe costs 18 planets.

## Glass Universe

The permit makes the first Universe reset available immediately. Subsequent resets require earning 18 fresh planets, including any spent, and award one Universe each. Universe resets clear the spendable planet balance and ordinary Planet upgrades. Lifetime planet extraction, the Charter, access to Glass Universe, and Universe upgrades carry over.

The Universe tree opens the settlement immediately, preserves the Census and settlement through resets, and adds two planets to doubled payouts. The final purchase, **Put a Glass Roof on Everything**, completes the game. Buying the full tree takes six Universes.

The full catalog of equipment, helpers, family programs, and prestige upgrades lives in [dist/campaign.js](dist/campaign.js). Progress, including completion, saves locally. The former campaign keeps its separate save, and the game does not award offline production.
