# Timber & Steel

[![Play Now](https://img.shields.io/badge/PLAY%20NOW-Timber%20%26%20Steel-16856b?style=for-the-badge)](https://aaronc1992.github.io/timber-and-steel/)

**[Play in your browser](https://aaronc1992.github.io/timber-and-steel/)** — no download or installation needed.

An original, self-contained knife-throwing arcade game. Watch the rotating timber, then stick every blade without hitting another one. Boss targets appear every fifth stage. Earn in-game money to buy permanent knife and log skins; endless mode starts a fresh run each time.

## Play locally

Open `index.html` in a modern browser. No installation, account, server, or network connection is required. Alternatively, serve the folder with any static web server.

Only the game fills the browser viewport: no outside header, footer, captions, or side panels. The artwork keeps its original proportions and is centered against a matching background on wide screens. Menus automatically scale to remain fully visible without scrolling. Browser tabs and toolbars remain under the browser's control.

## Phones and tablets

Use a modern mobile browser in portrait or landscape. Tap the playfield to throw and the pause button to pause; extra simultaneous fingers are ignored. Menus use larger touch targets, landscape menus use a compact layout, and safe-area padding keeps controls away from screen notches. Touch gestures do not scroll the page during gameplay. Rotation/resizing keeps the same round and progression. Audio starts after interaction and uses the same volume settings as desktop.

## Knife modifiers

Hidden bonus: click or tap the period after **check** in the Settings heading to add $1,000 to your saved wallet. It is repeatable and also works in pause sound settings; it does not change round earnings or penalties. If saving fails, the bonus is rolled back.

The shop's **Modifiers** tab sells permanent gameplay upgrades, separate from cosmetic skins. **Skinny Knives** ($12,000) makes blades 35% narrower and reduces knife-to-knife collision spacing accordingly. Boss starter knives retain their normal width. **Quick Throw** ($14,000) reduces flight from 180 ms to 130 ms but keeps normal collision spacing.

Any number of purchased modifiers can be active together. Open an owned modifier and use **Activate modifier** or **Deactivate modifier** to toggle it without affecting others. Buying activates it. The free **Standard Knives** option disables all modifiers. Changes apply at the start of the next round (including restart), across Classic, Endless, and Dummy modes. Existing embedded knives keep their actual width; modifiers never bypass the dummy's critical parts. Previewing spends nothing. Purchases and active toggles persist, and profile reset removes purchased modifiers. Older saves retain their previously selected modifier as active.

Additional modifiers: **Steady Spin** ($16,000) slows rotation by 15% while retaining speed changes and reversals; **Golden Apples** ($18,000) raises apple bonuses to $50 in Classic/Endless; **Dummy Padding** ($10,000) reduces limb penalties to $15 in Dummy mode. Each combines independently with Skinny Knives and Quick Throw. Golden Apples has no effect in rounds without apples, and Dummy Padding has no effect outside Dummy mode.

For dependable saving and sharing on phones/tablets, open the deployed HTTPS version rather than a downloaded local file; mobile file-opening and localStorage behavior vary by browser. Saves belong to the current browser and site address and do not automatically sync between devices. Phone/tablet viewport and Chromium touch-emulation checks are covered during development; physical iOS Safari and Android device testing has not been performed.

- Click or tap the game area, or press **Space**, to throw.
- Slice the rotating apple for **$25 bonus money**. Each stage has one apple; it is optional and does not replace the required knife throws. Hitting an embedded knife still loses the round, even near an apple.
- Use the pause button or **Escape** to pause; **Escape** also resumes.
- Money is banked after each successful throw and stage completion. Losing, restarting, or returning to the menu never removes earnings. Classic and endless share the same wallet.
- Earnings are deliberately paced for longer-term unlocks: throws pay $5–$9, completion pays $30–$125, and bosses add $75. Reward scaling caps at level 20, so very high levels cannot produce unlimited per-stage payouts. Level one pays $60 for a clean completion, or $85 with its apple; a $1,200 item therefore needs at least 15 level-one clears, rather than only a handful. Replays remain rewarded. Existing balances, purchases, and shop prices are unchanged.
- Classic resumes at your highest unlocked stage with a fresh run-earnings counter. Endless starts at stage one. Your wallet is never reset when starting a run.
- **Level select** in the main menu lets you start at any unlocked Classic level, including level one. Completing replays still earns money and continues to the next level, without reducing your highest unlocked stage. Boss levels are marked; future levels remain locked.
- The **Skin shop** sells Copperhead ($1,200), Moonstone ($3,000), and Golden Hour ($6,000) knives; Silver Birch ($1,500), Cherrywood ($3,500), and Midnight Timber ($6,500) logs. The original knife and Classic Oak are free. All other skins stay locked until purchased, regardless of stage. Buying equips the skin; owned skins can be freely switched without paying again. Skins never change difficulty or hitboxes.
- Existing saves keep stage progress and settings. Their previous best score becomes starter money once; old level-based cosmetic unlocks are replaced with purchased ownership.
- The shop has **Knives**, **Logs**, and **Music**, four items per page. All 24 skins of each type stay together, with no gender-based sections. The 20 additional skins of each type range from $1,800 to $15,000; existing purchases are preserved.
- **Music** includes the free original Forest Afterglow and 20 original purchasable looping songs, priced from $1,200 to $10,000. Each has its own melody, tempo, bass progression, and synth arrangement, with styles from mellow ambience to arcade battle themes. Buying selects the song immediately; open an owned song and use **Select music** to switch without paying again. Song ownership and selection survive reloads. Tracks are synthesized locally, need no downloads, and use the existing music-volume control.
- Clicking any shop card opens a full-screen detail view without spending money. Skin details show enlarged artwork from the gameplay renderers; music details temporarily play that track at your music-volume setting. **Buy** is disabled and grey when funds are insufficient. Only an explicit Buy or Equip/Select action changes ownership or equipment. **Back** (or Escape) returns to the same shop page and restores your selected music without saving the preview.
- **Themes** sells Ocean Breeze, Rose Twilight, Royal Violet, and Golden Dusk ($4,000–$10,000), plus animated Aurora Waves, Neon Fireflies, and Solar Streams ($24,000–$28,000). The original Forest Classic theme is free. Themes recolor menu panels, buttons, text, HUD, and gameplay backgrounds. Opening a theme temporarily previews the full menu palette; Back restores your purchased selection.
- Three animated knife packs (Prismatic Pulse, Plasma Runner, Solar Sweep) and three animated log packs (Prismatic Rings, Plasma Heart, Solar Orbit) cost $18,000–$22,000. They have moving highlights, pulsing accents, or cycling colors, visible both in the shop and gameplay. Animated themes add drifting light effects. Packs never change collision geometry or difficulty; all ownership and selections persist. Animations freeze while paused and respect the system's reduced-motion preference. Profile reset removes purchased themes and animated packs as well.
- Additional log skins: Obsidian Forge, Thunder Oak, Lava Core, Glacier Pine, Jungle Totem, Galaxy Cedar, Dragon Ember, Neon Reactor, Storm Fortress, Solar Crown, Rose Garden, Lavender Grove, Peach Petal, Mint Macaron, Berry Blossom, Pearl Lagoon, Starlight Willow, Sunset Orchard, Aurora Meadow, and Crystal Palace. Each has an original wood palette and decorative emblem, with unchanged gameplay.
- Shop previews use the same Canvas rendering functions and cached wood textures as gameplay, not separate mockups. Logs are previewed at the standard circular stage-one shape; target size, outline, and boss markings still change with the stage, independently of the purchased skin.
- Throws take 180 ms. Higher stages alternate between slow stretches and fast bursts, with progressively quicker speed changes and direction reversals from stage three. Watch for openings instead of spamming; boss stages have sharper rotation changes.
- Music and effects have separate volume controls. Sound starts after a user interaction, in accordance with browser autoplay rules.
- Progress, wallet, purchases, equipped skins, and volume settings are stored in the browser's localStorage. Private browsing or browser storage settings can prevent persistence; failed purchases display an error and do not spend money.
- **Settings → Reset profile** (also available in pause sound settings) opens a confirmation screen. **Reset everything** permanently sets money and best earnings to $0, returns progression to level one, removes all purchased skins and music, restores free starter equipment, the original song and default audio settings, and ends the active run. Cancel changes nothing. Only this game's saved profile is reset; other browser data is untouched.

All artwork is drawn procedurally with Canvas and CSS; audio is synthesized with Web Audio. No external assets or services are needed.

## Gameplay regression tests

### Training dummy mode

The **Dummies** shop category includes the free original and 20 paid mechanical skins: 10 bold/sporty and 10 colorful designs, all together and available to every player. Prices range from $3,000 to $16,500. Skins customize limb colors, frame colors, visor lights, rivets, and stripe/dot/diamond details, including both swinging sections after a hit. Full-size previews use the same renderer as gameplay. Orange critical modules, collision geometry, penalties, and physics remain unchanged. Ownership/equipment persist; profile reset restores the original dummy.

Choose **Training dummy** on the main menu. A mechanical dummy is tied to the rotating log at its wrists and ankles. Aim for clear wood, avoiding embedded knives and the orange head, neck, and torso: these end the round. Blue arm and leg modules split at the knife contact point with sparks. The remaining section swings under gravity from its shoulder/hip joint after losing wrist/ankle support; the loose section swings independently from its wrist/ankle rope. Joints and ropes follow the rotating log, with impact momentum, rigid segment lengths, and damping. Both sections remain visible until the round is replaced and freeze when paused. Each module costs $25 from that round's eventual payout and cannot be penalized twice. There is no blood or human injury.

Unlike Classic and Endless, dummy rewards stay pending until the stage is completed. Limb penalties apply to the total including the completion bonus, with a minimum payout of $0. Failure, restart, or leaving a round forfeits pending winnings but never deducts saved wallet money. Completed rounds bank their net payout; the next round resets the dummy. Equipped knife and log skins work in this mode, and Classic unlock progress is unchanged.

The dummy HUD shows gross earnings, accumulated penalties, and the remaining total. Completion results show **Earned** before deductions (including the completion bonus), **Limb penalties**, and **Total payout** separately; for example, $305 earned minus $300 penalties pays $5. Failed rounds show the same breakdown but explicitly pay $0 because pending winnings are forfeited.

With Node.js installed, run `node --test tests\gameplay.test.cjs`. Tests exercise the actual game logic using seeded rotation patterns, including throw timing, pause behavior, collision detection, progression, and rapid-click difficulty.

## Deploy

Upload `index.html`, `style.css`, and `game.js` together to any static web host.

For **GitHub Pages**, push these files to a repository, then enable Pages in repository settings, choosing the branch and root folder. Visit the Pages URL GitHub provides.

For **Vercel**, import the repository as a project with no framework or build command, and deploy the repository root as static files.
