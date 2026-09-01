# Celtic Heroes Item & Loot Explorer v0.6

## Major change
The explorer now searches the full `itemlist.txt`, not only items connected to mob drops.

## Sources
- Mob drop: linked to a reconstructed loot-table source.
- Curated questline: manually documented from a supplied guide.
- Other / undocumented: exists in item data but exact vendor/quest/crafting source is not yet documented.

## First curated questline: Meteoric
The Meteoric proof-of-concept includes:
- class-specific armor material requirements by slot
- armor level milestones
- Remnant and Tablet boss reference data in the dataset
- Meteoric weapon quest summary
- class-specific Morrigan Priest item requirements

This is intentionally a proof of concept before importing the other major questline guides.

## Meteoric armor mapping note
The raw item file explicitly names Meteoric weapons, but the armor pieces are not
literally named "Meteoric". To avoid attaching the guide to incorrect equipment,
v0.6 includes a dedicated Meteoric Guide panel for the armor recipes and boss
material references. Once the actual armor item IDs are confirmed, those recipes
can be linked directly to the corresponding item cards.


## v0.6.1 source-correlation fix
The Meteoric Weapon Quest guide is now attached only to:
- Meteoric Sword
- Meteoric Totem
- Meteoric Bow
- Meteoric Dagger
- Meteoric Wand

Frozen Meteoric weapons are later upgrades and are no longer incorrectly shown as coming from the base Meteoric Weapon Quest.


## v0.7 Warden questline
Added the Warden armour + weapon line using exact item IDs rather than name inference.

Class sets:
- Warrior: Bloodstrike
- Druid: Goldsong
- Mage: Loremantle
- Ranger: Greythorn
- Rogue: Moonshadow

The Warden guide records the shared Moon / Sun / Oak / Elm / Crown / Dragon disc
requirements and the Stonevale bosses supplied by the user. These discs are not
class-specific.

Exact source mapping covers 30 Warden equipment items: five armor pieces and one
weapon for each of the five classes.


## v0.7.1 Warden set linking
Added exact Warden Armour Set Bonus records:
- Warrior: item 23455
- Rogue: item 23456
- Ranger: item 23457
- Druid: item 23458
- Mage: item 23459

Each class set bonus is now linked to its matching Warden guide entry and displayed
together with the five armor pieces and class weapon. Warden item pages also show
their full class set so users can jump between the pieces and the set bonus.


## v0.8 Meteoric set mapping
Added exact Meteoric class-set structure:
- Mage: Celestial + Meteoric Wand
- Druid: Cosmic + Meteoric Totem
- Ranger: Lunar + Meteoric Bow
- Rogue: Zodiac + Meteoric Dagger
- Warrior: Astral + Meteoric Sword

Meteoric item pages now show their class set together, using the same pattern as Warden.
Any Meteoric Armour Set Bonus records present in the raw item database are linked automatically.
Frozen Meteoric remains separate because it is a later upgrade tier.


## v0.9 navigation cleanup
Questline guides now live in their own **Quest Guides** section.

The top of the item browser is no longer used for one chip per progression line.
The app has two primary sections:
- Items & Loot
- Quest Guides

The Quest Guides section currently lists Warden and Meteoric in a dedicated guide browser,
which will scale cleanly as more major questlines are added.


## v0.9.1 guide item navigation
Links inside Quest Guides now open the selected armor piece, weapon, or set-bonus item
inside the guide detail panel using the exact same item renderer as the Items & Loot browser.
This keeps stats, source, set grouping, related items, and drop information visually uniform.
A Back to guide button returns to the questline overview.


## v0.9.2 set-bonus wording
Clarified that a Warden Armour Set Bonus is not an item source.
It is the additional stat package that becomes active while all five matching
armour pieces are equipped simultaneously. Set-bonus entries now use a
"Set bonus" section instead of "Source", while normal equipment still uses Source.


## v1.0 Frozen Meteoric
Added Frozen Meteoric as the upgrade tier after Meteoric.

Exact class sets:
- Warrior: Frozen Astral + Frozen Meteoric Sword
- Druid: Frozen Cosmic + Frozen Meteoric Totem
- Mage: Frozen Celestial + Frozen Meteoric Wand
- Ranger: Frozen Lunar + Frozen Meteoric Bow
- Rogue: Frozen Zodiac + Frozen Meteoric Dagger

Exact Frozen Armour Set Bonus items are linked for all five classes.

The Frozen guide includes:
- crest boss reference
- per-slot crest + Orb of Frostweaving requirements
- class crest colours
- total 2 of each crest type + 38 Orbs
- uniform item/stat pages and full-set navigation


## v1.1 Dragonlord
Added the Dragonlord questline with exact item-ID mapping for all five classes.

Includes:
- 5 armour pieces per class
- Dragonlord mainhand + offhand for each class
- exact level and material requirements from the supplied guide
- class colour mapping
- boss drop reference (Glashtyn through Snorri)
- note that mainhand must be obtained before offhand
- uniform item/stat view and linked class set navigation

No separate Dragonlord Armour Set Bonus record was found in the current item data,
so no artificial set bonus was added.


## v1.2 Exalted Dragonlord
Added the Exalted Dragonlord questline with exact item-ID mapping for:
- all five class armour sets
- EDL mainhands
- EDL offhands
- Exalted Dragon Armour Set Bonus items for all five classes

Requirements from the supplied guide:
- Gloves: 2 Unknown + 2 Incantations
- Boots: 2 Incantations + 2 Illusions
- Helm: 3 Illusions + 3 Summoning
- Pants: 3 Summoning + 3 Enchanting
- Chest: 4 Enchanting + 4 Conjuring
- Mainhand: 5 Arcane + 4 Conjuring
- Offhand: 4 Arcane + 5 Runes


## v1.2.1 Dragonlord set bonus correction
Corrected the set-bonus relationship:
- `Dragon Armour Set Bonus [Class]` (items 22555–22559) belongs to the Dragonlord armour sets.
- `Exalted Dragon Armour Set Bonus [Class]` (items 54490–54494) belongs to Exalted Dragonlord.

Dragonlord class set pages now include their actual full-set bonus alongside the five
Dragonlord armour pieces and weapons.


## v1.2.2 Exalted Dragonlord class colours + totals
EDL materials are now class-specific:
- Warrior: Red
- Druid: Green
- Ranger: Yellow
- Rogue: Purple
- Mage: Blue

Armor totals:
- Unknown 2
- Incantations 4
- Illusions 5
- Summoning 6
- Enchanting 7
- Conjuring 4

Weapon totals:
- Arcane 9
- Conjuring 4
- Runes 5

Full armor + mainhand + offhand totals:
- Unknown 2
- Incantations 4
- Illusions 5
- Summoning 6
- Enchanting 7
- Conjuring 8
- Arcane 9
- Runes 5


## v1.3 Doch Gul
Added Doch Gul with two alternative acquisition methods for the same armour pieces.

Class Confluxes:
- Ranger: Conflux of Fables
- Warrior: Conflux of Legends
- Druid: Conflux of Folklore
- Mage: Conflux of Mythos
- Rogue: Conflux of Sagas
- Pure Conflux / Conflux of Pureness is shared by every class.

Conflux method per piece:
- Gloves: 1 Pure + 2 class Confluxes
- Boots: 2 Pure + 3 class Confluxes
- Helm: 3 Pure + 4 class Confluxes
- Greaves: 4 Pure + 5 class Confluxes
- Breastplate: 5 Pure + 5 class Confluxes

Full set total: 15 Pure + 19 class Confluxes.

Daily Shards:
- Gloves 25
- Boots 40
- Helm 60
- Greaves 80
- Breastplate 100

Full set total: 305 Daily Shards.

Exact Doch Gul armor pieces and Doch Gul Set Bonus records are linked for all five classes.


## v1.3.1 Doch Gul shard-cap correction
Daily Shards are capped at 200.
The five armor pieces total 305 shards, so a full Doch Gul set cannot be completed
through the Daily Shards path alone. Players can use shards for part of the set,
then must obtain the remaining pieces through the Conflux method.


## v1.3.2 set bonus effect details

Dragonlord full-set effect:
- Dragonlord Aura: +500 Health, +500 Energy, +800 Chaos Resistance, +150 Divine Damage
- Shield of Fingal: protects from Fingal's Bane used by Mordris

Exalted Dragonlord full-set effect:
- Exalted Aura: +1000 Health, +1000 Energy, +1200 Chaos Resistance, +200 Divine Damage
- Branwen's Blessing: protects from Crom's influence around Gelebron and grants immunity to Fingal's Bane

Doch Gul:
- keeps Exalted Aura
- keeps Branwen's Blessing
- adds a class-specific Doch Gul Aura that directly boosts two skills

The class-specific two-skill boosts remain represented through the actual set-bonus item's parsed skill bonuses rather than inventing skill names.


## v1.3.3 set-bonus page cleanup
When viewing a set-bonus record such as Exalted Dragon Armour Set Bonus Warrior:
- raw parsed stats are hidden because those internal fields are not fully decoded
- the curated Exalted Aura / Branwen's Blessing box is the authoritative display
- the duplicate copy of that box in the lower set section is removed
- the lower section is now primarily navigation to the matching armour and weapons

The same duplicate-display cleanup is applied to Dragonlord and Doch Gul set-bonus pages.


## v1.3.4 dedicated set-bonus pages
Set-bonus records for Dragonlord, Exalted Dragonlord, and Doch Gul now bypass the
generic item renderer completely.

For an Exalted Dragon Armour Set Bonus record the page now contains only:
1. the set-bonus title and internal item ID
2. one authoritative curated Exalted Aura / Branwen's Blessing box
3. the matching EDL armour/mainhand/offhand navigation

Raw parsed stats, duplicated bonus boxes, generic source text, and related-item clutter
are not rendered on these pages.

Asset URLs are also cache-busted in index.html so an older cached app.js does not mask
the update when replacing a previous local folder.


## v1.3.5 Doch Gul inherited Exalted Aura
Doch Gul set-bonus pages now expand the inherited Exalted Dragonlord effects instead
of showing only labels.

The Doch Gul set bonus now visibly includes:
- Exalted Aura: +1000 Health, +1000 Energy, +1200 Chaos Resistance, +200 Divine Damage
- Branwen's Blessing description
- the added class-specific Doch Gul [Class] Aura beneath those inherited effects


## v1.3.6 Doch Gul class aura skill bonuses
Added the exact class-specific Doch Gul aura bonuses:

- Warrior: +1350 Rupture damage, +1800 Giant Swing damage
- Druid: +720 Nature's Touch healing, +1080 Lightning Strike damage
- Mage: +900 Fire Bolt damage, +1800 Ice Shards damage
- Rogue: +1080 Quick Strike damage, +3600 Sneaky Attack damage
- Ranger: +1350 Sharp Shot damage, +1710 Longshot damage

These now display directly beneath the inherited Exalted Aura and Branwen's Blessing.


## v1.4 Doch Gul of Fortitude
Added the newer Warrior-only Doch Gul of Fortitude armor set from the supplied screenshots.

Pieces:
- Doch Gul Gauntlets of Fortitude
- Doch Gul Boots of Fortitude
- Doch Gul Helm of Fortitude
- Doch Gul Greaves of Fortitude
- Doch Gul Breastplate of Fortitude

This set is not present in the previously supplied raw itemlist, so the five records use
local app-only IDs and manually transcribed stats from the screenshots.

Acquisition:
- same Warrior Conflux: Conflux of Legends
- same Pure + class Conflux requirements per slot
- same Daily Shard costs per slot
- same 200-shard cap

No separate Fortitude set-bonus record was supplied, so the app does not invent one.


## v1.4.1 Doch Gul of Fortitude set bonus
Confirmed the Warrior Doch Gul of Fortitude full-set effects.

Inherited:
- Exalted Aura: +1000 Health, +1000 Energy, +1200 Chaos Resistance, +200 Divine Damage
- Branwen's Blessing

Added:
- Doch Gul Fortitude Aura
  - +1200 to Taunt
  - +600 healing to Shield Wall

The Fortitude set panel now displays these effects even though no separate raw
Fortitude set-bonus item record was present in the supplied itemlist.


## v1.4.2 inline set bonuses across questline armor

Set bonuses are now displayed directly on the individual armor pieces instead of
being presented as a separate selectable item in the set navigation.

Applied to:
- Warden
- Frozen Meteoric
- Dragonlord
- Exalted Dragonlord
- Doch Gul
- Doch Gul of Fortitude
- Meteoric automatically if a mapped set-bonus record is added later

For Dragonlord, Exalted Dragonlord, Doch Gul, and Fortitude, the curated/manual
set-effect descriptions are shown inline on every armor piece.

Warden and Frozen use their mapped set-bonus records inline.

Internal set-bonus pseudo-items are now hidden from normal Items & Loot search/browse
results. They remain in the data internally so the app can use them to build the
inline bonus display.

Weapons remain separate from the armor set bonus display; the bonus appears on the
five armor pieces that activate the set.


## v1.5 publish-prep polish

Added Favorites:
- Star any normal item or mob from search results or its detail page.
- Favorites have their own top-level section.
- Saved entries persist in browser localStorage on that device.
- Favorites require no account, login, or server-side database.
- Clear Favorites includes a confirmation prompt.

Additional polish:
- Data provenance badges on item pages distinguish extracted data, curated questline mappings,
  and newer manually entered current-game items.
- Internal set-bonus pseudo-items remain hidden from normal browse/search.
- Result rows have cleaner hover/selection behavior with a dedicated favorite control.
- Mobile navigation is horizontally scrollable instead of wrapping awkwardly.
- Added small version/storage footer and improved empty states.


## v1.5.1 GitHub Pages build

The previous monolithic `data.js` has been replaced with:
- `data/base.js`
- 2 item chunk files

Each generated data file is kept well below GitHub's browser upload limit.
`index.html` loads the files in the correct order before `app.js`.

Also added:
- `.nojekyll`
- `GITHUB_PAGES.md`


## v1.6 visual redesign

Rebranded the project as **CH Encyclopedia** and moved away from the
generic dark-dashboard look.

New visual direction:
- moss / bronze / parchment palette
- codex-style header and decorative divider
- serif display typography for headings
- asymmetric accent treatment on detail panels
- warmer, more tactile set-bonus and quest cards
- subtler badges, tabs, search controls, and favorites
- improved visual hierarchy without changing the underlying content structure

This is a styling-only redesign; search, guides, favorites, and data behavior remain intact.


## v1.6.1 purple visual pass
- Switched the codex palette from moss/bronze to a purple/lilac theme.
- Removed the extra “Items • Loot • Questlines • Progression” subtitle.
- Removed the redundant descriptive sentence under the main title.
- Kept the codex-style typography and layout while making the interface feel cleaner.


## v1.6.2 class-colour cleanup
The overall interface remains purple, but class material colour labels now retain
their actual in-game colours:
- Warrior: red
- Druid: green
- Ranger: yellow
- Rogue: purple
- Mage: blue


## v1.6.3 cohesive purple theme
Forced remaining legacy blue/teal/green component styles into the current plum/lilac palette.

Updated:
- top navigation tabs
- stat boxes and stat text
- quest requirement cards
- source/set-effect cards
- filters and chips
- result hover/selection states
- favorites controls
- badges and metadata pills

Intentional class material labels still retain their actual red/green/yellow/purple/blue colors.


## v1.7 Discord Activity build

Discord Application ID:
`1544123374513430528`

Added:
- Discord Embedded App SDK bootstrap using `DiscordSDK`
- waits for `discordSdk.ready()` when running inside a Discord Activity
- no OAuth, user identity, guild-member, message, or other privileged scopes
- ordinary GitHub Pages/browser use continues to work without Discord
- Discord-only compact layout with improved viewport height handling
- independent scrolling for results and detail panes on desktop Activities
- extra bottom clearance for Discord's Activity controls
- responsive fallback for narrow/mobile Activity windows

The Activity bootstrap dynamically imports the official
`@discord/embedded-app-sdk` v2.5.0 package from jsDelivr only when the page detects
that it is running inside Discord.


## v1.7.1 legal pages
Added:
- `terms.html`
- `privacy.html`
- footer links to Terms and Privacy
- contact email: `celtichero2026@gmail.com`

Both pages use the same purple CH Encyclopedia theme and include an
explicit unofficial/fan-created disclaimer.


## v1.7.2 branding change
Visible app branding changed from **Celtic Heroes Encyclopedia** to **CH Encyclopedia**.

The legal pages still explicitly state that the app is an unofficial fan-created
reference tool for the game Celtic Heroes and is not affiliated with or endorsed by DECA Games.
