# Sand Theft Game Design Document

Sand Theft is a short comedic incremental game about stealing increasingly unreasonable quantities of sand to fulfil the promise of a glass house. The player starts at a playground, expands their operation across the world, and builds the gloriously impractical house only at the end.

**Working title:** Sand Theft  
**Format:** Single-player incremental game for PC and browser  
**Controls:** Mouse or touch  
**Target session:** Approximately 10–15 minutes, subject to playtesting  
**Scope:** A single game-jam run with one ending

# Creative direction

The game takes the glass-home promise associated with Stefan Żeromski’s *Przedwiośnie* and treats it as the extremely serious goal of an extremely silly operation. Its ending also draws on the crude, skittish, absurd humor of *Kapitan Bomba*. Use original writing and characters; the exact ending gags can be refined during production.

The tone is cheerful, mischievous, occasionally vulgar, and increasingly absurd. The player begins as a petty sand thief and becomes an unlikely sand industrialist. The world reacts with mild confusion and visual jokes. The growing scale is funny; the game does not frame the player’s choices as a solemn moral dilemma.

# Player goal and core loop

The goal is to gather enough sand to build one glass house. The house is the final payoff, not a building or resource produced throughout the run.

1. Steal sand from the selected location by clicking.

2. Spend some stored sand on equipment that increases manual or automatic gathering.

3. Unlock larger locations by reaching lifetime totals of sand stolen.

4. Select an unlocked location and continue gathering as its landscape changes.

5. Accumulate 60,000 stored sand and build the glass house.

Sand in storage is the spendable balance and the material required for the ending. Total sand stolen is a separate lifetime counter: gathering increases both counters, and spending reduces only stored sand. Location unlocks never reverse.

# Gathering and locations

One location is selected at a time. Clicking steals sand from that location; all purchased automatic equipment also gathers from it while the game is open. The player can switch among unlocked locations at any time. Each location has a finite supply, and gathering is capped at its remaining amount. When it is empty, gathering stops until the player selects a location with sand remaining.

| Location | Sand available | Lifetime sand needed to unlock | Visual progression |
| --- | ---: | ---: | --- |
| Playground sandbox | 250 | Available at start | Toys, a buried shoe, and increasingly annoyed children are revealed. |
| Beach | 1,500 | 100 | Sunbathers remain in place as the beach disappears around them. |
| Desert | 10,000 | 600 | Camels and a “Welcome to the Desert” sign remain on bare ground. |
| Seabed | 100,000 | 4,000 | Fish stare at a perfectly rectangular excavation. |

Each location has full, partly empty, and empty visual states. For implementation, use full above 50% remaining, partly empty at 50% or less, and empty at zero. An empty location remains selectable but clearly shows that it contains no sand.

The transition from sandbox to beach to desert to seabed conveys the scale of the operation. No travel, diving, or realistic extraction simulation is needed.

# Equipment and economy

Equipment is bought once and remains active for the run. It works in every unlocked location. Rates from automatic equipment add together. The player begins with 0 stored sand, 0 lifetime sand, 1 sand per click, and no automatic production.

| Equipment | Cost in sand | Effect | Available |
| --- | ---: | --- | --- |
| Bucket | 20 | Manual gathering becomes 3 sand per click. | Start |
| Suspicious Helper | 100 | Adds 2 sand per second. | Start |
| Wheelbarrow | 300 | Adds 10 sand per second. | Beach unlocked |
| Excavator | 1,000 | Adds 50 sand per second. | Desert unlocked |
| Sand Barge | 3,000 | Adds 200 sand per second. | Desert unlocked |
| Extremely Large Vacuum | 10,000 | Adds 1,000 sand per second. | Seabed unlocked |

These costs, rates, supplies, thresholds, and the 60,000-sand final target are initial tuning values. Playtest and adjust them together while preserving the progression and ensuring the player cannot spend their way into an unwinnable run.

The initial locations contain 111,750 sand in total. All upgrades together cost 14,420, leaving 97,330 available for the 60,000-sand ending even if every upgrade is purchased.

Automatic collection should account for elapsed time while the game is open and cap each increment at the selected location’s remaining sand. Fractional amounts may be tracked internally; display whole units consistently. Offline progress is outside the jam scope.

# Interface

Use one main game screen:

- **Top:** stored sand, sand per second, and total sand stolen.

- **Center:** the selected location, its remaining sand, and a prominent **STEAL SAND** button.

- **Left:** unlocked locations and their remaining sand. Locked locations show their lifetime unlock requirement.

- **Right:** equipment, costs, and unavailable upgrade requirements. Purchased equipment is marked as owned.

- **Bottom:** progress toward 60,000 stored sand and the final build button.

The build button is disabled until the player has 60,000 sand in storage. It then changes to **BUILD THE GLASS HOUSE**. Pressing it ends gathering and begins the ending. The player does not build houses during the incremental run.

Show short flavor messages when buying equipment, unlocking a location, or emptying a location. Messages can dismiss automatically and should never block play.

# Humor and writing

The narration treats a ridiculous plan with complete confidence. Upgrade names, descriptions, and location reactions should be short enough to read during play.

Examples:

- First click: “You have acquired sand. Nobody saw anything.”

- Bucket: “Your pockets have been promoted to management.”

- Suspicious Helper: “Asks no questions. Answers even fewer.”

- Wheelbarrow: “A company vehicle.”

- Excavator: “For delicate playground work.”

- Sand Barge: “Technically, it floats.”

- Extremely Large Vacuum: “DO NOT USE ON CURTAINS.”

- Empty sandbox: “The children will adapt.”

- Beach unlocked: “A sandbox with excellent public transport links.”

These lines establish tone; they can be rewritten as the game develops.

# Ending

Once the player has 60,000 stored sand, selecting **BUILD THE GLASS HOUSE** starts a short construction sequence with absurdly grand music. The finished house sparkles and initially looks magnificent.

A character enters. The toilet is visible from the street, there are no curtains, and sunlight makes the interior unbearably hot. Their attempts to fix the problems cause further mishaps and cracks. The jokes escalate quickly and end with:

**THE DREAM HAS BEEN REALISED.**

After a beat, another crack is heard and the credits appear. Provide a restart button after the ending. A sequence of illustrated frames and text is sufficient; voice acting, a playable interior, and elaborate animation are not required.

# Art and audio

Use bright, simple 2D cartoon art with clear silhouettes and exaggerated expressions. Keep locations recognizable at a glance. Machinery becomes visibly oversized as the operation grows. The house should look sincerely impressive for a moment before its problems are revealed.

Minimum art: four location illustrations with three depletion states each, simple equipment icons, and a few ending frames. Small effects such as a shrinking sand pile, a floating number, or a shaking purchase icon are useful but optional.

Use a satisfying gathering sound, a purchase sound, and a dramatic musical sting for the reveal. Machinery loops and other audio polish are optional if time is tight.

# Jam deliverable and acceptance criteria

A playable build is complete when:

- A new run starts at the sandbox with the specified starting state.

- Manual and automatic gathering draw from the selected location and cannot collect more than its remaining sand.

- All six upgrades can be purchased once, apply their stated effects, and respect affordability and unlock conditions.

- Lifetime milestones unlock the beach, desert, and seabed without being reversed by spending.

- Players can switch among unlocked locations and see supplies and depletion states.

- Stored sand, lifetime sand, and automatic gathering rate are displayed clearly.

- The final build button enables at 60,000 stored sand and leads to the house ending and restart.

- A complete run is winnable even if all upgrades are purchased.

- The game is usable with mouse on PC and touch in a browser.

Prioritize a complete, readable loop and ending over extra animation or content. Polish after the full run works.

# Production priorities and playtesting

Build in this order: gathering and counters; locations and unlocks; equipment and automatic gathering; final target and ending; visual states and flavor text; audio and polish.

During playtesting, check how quickly the first upgrade and first location unlock arrive; whether automatic production feels rewarding; whether a location can run out without confusing the player; and whether the last stretch requires too much waiting. Confirm that spending and lifetime totals are distinguishable and that the ending lands as an absurd payoff.

Nice to have: more flavor text, animated machinery, sound effects, a volume control, and a Polish-language version.

Out of scope for the jam: prestige resets, offline progress, multiplayer, procedural locations, individual worker simulation, multiple endings, and building a settlement during the run.
