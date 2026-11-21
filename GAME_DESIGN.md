# Sand Theft Game Design Document

Sand Theft is a comedic single-player incremental game about stealing increasingly unreasonable quantities of sand to fulfil the promise of a glass house. The player starts at a playground, expands their operation, takes questionable contracts, and builds the gloriously impractical house only at the end.

**Platform:** Browser on PC or touch devices

**Target duration:** About one hour, depending on play style; balance requires human playtesting

**Structure:** One run and one ending; progress saves locally, with no offline production

## Creative direction

The game treats the glass-home promise associated with Stefan Żeromski's *Przedwiośnie* as the extremely serious goal of an extremely silly operation. Its ending also draws on the crude, skittish, absurd humor of *Kapitan Bomba*. Use original characters and writing.

The tone is cheerful, mischievous, occasionally vulgar, and increasingly absurd. The player becomes an unlikely sand industrialist. The world reacts with mild confusion and visual jokes.

## Core loop

1. Steal sand by clicking the selected location or using owned equipment.
2. Spend sand on equipment to gather faster and on optional contracts to obtain permits.
3. Spend permits on permanent specialities: click strength, machine output, or equipment discounts.
4. Reach lifetime milestones to reveal a modal introducing the next location. Continuing moves the operation there for free.
5. Accumulate 5,000,000 stored sand to build the glass house and see the ending.

Stored sand is spendable. Lifetime sand only increases and unlocks locations and contracts; spending never reverses unlocks. Only one location is active at a time, and its finite supply caps manual and automatic collection. A location milestone pauses production and opens an announcement; continuing moves to the new location automatically. The location list is a progress display, not a set of purchase or travel buttons. Machines stop when the current location is empty. Production runs only while the game is open and visible.

## Locations

| Location | Supply | Lifetime unlock | Visual joke |
| --- | ---: | ---: | --- |
| Playground sandbox | 250 | Start | Toys, a buried shoe, and annoyed children are revealed. |
| Beach | 1,500 | 100 | Sunbathers remain as the beach disappears. |
| Desert | 10,000 | 600 | Camels and a desert sign remain on bare ground. |
| Seabed | 7,000,000 | 4,000 | Fish stare at a rectangular excavation. |

Each has full, partly empty, and empty art: full above 50% remaining, partly empty at 50% or less, and empty at zero.

## Equipment

Equipment is purchased once and carries across locations. Automatic rates add together before research bonuses.

| Equipment | Base cost | Effect | Available |
| --- | ---: | --- | --- |
| Bucket | 20 | Sets base manual collection to 3 per click. | Start |
| Suspicious Helper | 100 | +2 sand per second | Start |
| Wheelbarrow | 300 | +10 sand per second | Beach unlocked |
| Excavator | 1,000 | +50 sand per second | Desert unlocked |
| Sand Barge | 3,000 | +200 sand per second | Desert unlocked |
| Extremely Large Vacuum | 10,000 | +1,000 sand per second | Seabed unlocked |

## Contracts and research

Contracts are optional one-time sand deliveries. Each has a lifetime unlock, costs stored sand, and grants one permit. Players get at most nine permits and can spend each once on a research rank. There are twelve possible ranks, so they must choose their emphasis.

| Contract | Lifetime unlock | Sand cost | Reward |
| --- | ---: | ---: | --- |
| The sandbox audit | 100 | 50 | 1 permit |
| Beachfront paperwork | 600 | 500 | 1 permit |
| A discreet delivery | 4,000 | 5,000 | 1 permit |
| The mayor's bunker | 25,000 | 50,000 | 1 permit |
| International sand summit | 200,000 | 200,000 | 1 permit |
| A favour for the moon | 1,000,000 | 600,000 | 1 permit |
| The great sand shortage | 2,000,000 | 200,000 | 1 permit |
| The suspicious hourglass | 3,000,000 | 300,000 | 1 permit |
| One last favour | 4,000,000 | 400,000 | 1 permit |

| Research | Effect per rank | Maximum |
| --- | --- | ---: |
| Scoop School | +15 sand per click | 4 ranks |
| Machine Union | +20% of base machine output | 4 ranks |
| Creative Accounting | Equipment costs 15% less of base cost; round up | 4 ranks |

All contracts and equipment together cost at most 1,769,970 sand before discounts. The locations contain 7,011,750 sand, leaving enough to reach the 5,000,000-sand goal even after every purchase. The numbers are initial balance values, not a guarantee of real-world completion time. A simple simulated strategy with frequent early clicks, occasional later clicks, prompt purchases, and automation-first research finishes in roughly 54 minutes; human testing should adjust pacing.

## Interface and tone

A single screen shows the stash, per-second output, lifetime haul, location progress, current scene and gather button, equipment, contracts, permits, research, and progress toward the house. Locked items explain their requirements. Locations show remaining sand, and completed purchases and contracts remain visible. Short flavour messages accompany events.

Treat the plan with complete confidence. Examples: “The children will adapt,” “A company vehicle,” and “The moon is short on sand. Apparently.”

## Ending

At 5,000,000 stored sand the player can build the house. A brief construction reveal shows a magnificent transparent house. The toilet is visible from the street, curtains fail, the interior becomes unbearably hot, and cracks appear. The ending closes with **THE DREAM HAS BEEN REALISED**, another crack, and a restart button.

A sequence of illustrated frames and text is sufficient; the ending is not a playable building sequence.

## Art, audio, and scope

Use bright 2D cartoon art, exaggerated expressions, oversized machinery, simple sound effects, and a dramatic house reveal. Keep the loop responsive to mouse and touch.

A finished build allows collection, automatic location transitions, buying upgrades, fulfilling contracts, spending permits, saving and resuming progress, reaching the ending, and restarting. Verify finite supplies, affordability, unlocks, discount calculations, the full winning path, old-save migration, and pacing.

Out of scope: multiplayer, procedural locations, offline progress, individual worker simulation, and building a settlement during the run.
