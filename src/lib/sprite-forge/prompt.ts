export type SpritePlatform = 'unity' | 'godot';
export type SpriteActionPack =
  | 'platformer'
  | 'top-down'
  | 'action-rpg'
  | 'custom';

export type SpriteForgePlan = {
  target: 'player' | 'asset';
  mode: 'player_sheet' | 'sheet';
  rows: number;
  cols: number;
  cellSize: number;
  frameLabels: string[];
  align: 'center' | 'bottom' | 'feet';
  sharedScale: boolean;
  componentMode: 'all' | 'largest';
  prompt: string;
};

const charStyle =
  'Top-down 2D pixel art for a 16-bit RPG overworld. 3/4 view from slightly above, you can see the top of the head, shoulders and full body. Chunky pixel-art with crisp dark outlines and saturated colors. Character fills ~60% of its cell with margin for the engine to render cleanly. Background is 100% solid flat magenta (#FF00FF), no gradients, no shadow under character. NO text, NO labels, NO UI, NO speech bubbles.';

const artStyle =
  'Original digital monster creature. Digimon/Pokemon inspired pixel art, strong outlines, dynamic, battle-ready. NOT cute, NOT round. SOLID COLORED BODY. Background is 100% solid flat magenta (#FF00FF), no gradients. NO text, NO labels, NO words, NO letters anywhere.';

const gridRules4x4 =
  "ABSOLUTE RULES: 1. EXACTLY 16 equal-size cells arranged in a 4x4 grid (4 rows of 4 columns, every cell the same width and height). 2. NO borders, NO lines, NO frames between cells. 3. NO text, NO labels, NO numbers, NO arrows. 4. CRITICAL CONSISTENCY: the character in every single cell has the IDENTICAL height and IDENTICAL width (same bounding box, same pixel scale). Do NOT zoom in or out between cells. Do NOT crop tighter in some cells. The character's head-to-foot height must be visibly identical in all 16 cells. 5. Character is CENTERED horizontally and vertically within its cell. Fills ~60% of the cell, leaving equal magenta margin on all four sides. 6. Cells connected ONLY by solid magenta (#FF00FF) background.";

const containmentRules =
  'The entire subject must fit fully inside each cell. No body part, effect, weapon, tail, wing tip, orb, spark, or smoke trail may cross a cell edge. Leave magenta margin on all four sides. Use the same silhouette scale in every frame.';

const playerSheetLabels = [
  'down-1',
  'down-2',
  'down-3',
  'down-4',
  'left-1',
  'left-2',
  'left-3',
  'left-4',
  'right-1',
  'right-2',
  'right-3',
  'right-4',
  'up-1',
  'up-2',
  'up-3',
  'up-4',
];

const platformerLabels = [
  'idle-1',
  'idle-2',
  'walk-1',
  'walk-2',
  'run-1',
  'run-2',
  'jump',
  'fall',
  'attack-windup',
  'attack-strike',
  'attack-follow-through',
  'attack-recovery',
  'hurt-impact',
  'hurt-recovery',
  'death-start',
  'death-end',
];

const actionRpgLabels = [
  'idle-1',
  'idle-2',
  'run-1',
  'run-2',
  'slash-windup',
  'slash-strike',
  'slash-follow-through',
  'slash-recovery',
  'cast-gather',
  'cast-release',
  'hit-reaction',
  'hit-recovery',
  'death-start',
  'death-collapse',
  'victory-1',
  'victory-2',
];

const customLabels = Array.from(
  { length: 16 },
  (_, index) => `frame-${String(index + 1).padStart(2, '0')}`
);

function customNotes(notes?: string) {
  return notes?.trim() ? ` Extra user notes: ${notes.trim()}.` : '';
}

function buildPlayerSheetPrompt(character: string, notes?: string) {
  return [
    'A 4x4 pixel art sprite sheet, full 4-direction walk cycle for a top-down RPG hero.',
    `CHARACTER: ${character}. Young adventurer protagonist.`,
    'SHEET LAYOUT (rows = facing direction, columns = walk frames): Row 1 (top): facing DOWN (toward camera, face fully visible). Row 2: facing LEFT (left profile or side view). Row 3: facing RIGHT (right profile or side view, mirror of row 2). Row 4 (bottom): facing UP (away from camera, back of head visible). COLUMN 1: neutral pose, both feet together. COLUMN 2: LEFT foot stepping forward. COLUMN 3: neutral pose again, both feet together. COLUMN 4: RIGHT foot stepping forward.',
    'IDENTICAL SIZE in every cell: same character height head-to-foot, same width shoulder-to-shoulder, same on-screen pixel scale. No zooming, no cropping differently, only pose and direction change.',
    'SAME character identity, SAME costume, SAME palette in all 16 cells.',
    'The head and torso orientation must clearly communicate which direction the character is facing in each row.',
    charStyle,
    gridRules4x4,
    containmentRules,
    customNotes(notes),
  ]
    .filter(Boolean)
    .join(' ');
}

function buildActionSheetPrompt({
  character,
  actionPack,
  notes,
}: {
  character: string;
  actionPack: Exclude<SpriteActionPack, 'top-down'>;
  notes?: string;
}) {
  const actionSequence =
    actionPack === 'action-rpg'
      ? 'idle loop, run loop, slash attack, cast release, hit reaction, death collapse, and victory pose'
      : actionPack === 'platformer'
        ? 'idle loop, walk loop, run loop, jump, fall, attack wind-up, attack strike, follow-through, hurt reaction, and death pose'
        : 'the exact custom action notes';

  return [
    `A 4x4 pixel art animation sheet of the same ${character}.`,
    'The same asset identity appears in every cell, with the same bounding box, the same pixel scale, and no part crossing a cell edge.',
    'Keep the animation readable for a 2D game sprite, not a splash illustration.',
    'Exactly 16 equal cells in a 4x4 grid.',
    'Read frames left-to-right across each row, then continue on the next row.',
    `Action sequence: ${actionSequence}.`,
    'Keep the subject identity stable while allowing pose, energy, and compact attached effects to change.',
    artStyle,
    gridRules4x4,
    containmentRules,
    actionPack === 'custom'
      ? 'Custom action notes are required to define the frame phases.'
      : '',
    customNotes(notes),
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildSpriteForgePlan({
  prompt,
  platform,
  actionPack,
  notes,
}: {
  prompt: string;
  platform: SpritePlatform;
  actionPack: SpriteActionPack;
  notes?: string;
}): SpriteForgePlan {
  const character = prompt.trim();

  if (actionPack === 'top-down') {
    return {
      target: 'player',
      mode: 'player_sheet',
      rows: 4,
      cols: 4,
      cellSize: 96,
      frameLabels: playerSheetLabels,
      align: 'feet',
      sharedScale: true,
      componentMode: 'all',
      prompt: [
        buildPlayerSheetPrompt(character, notes),
        `Export target: ${platform === 'unity' ? 'Unity' : 'Godot'}.`,
      ].join(' '),
    };
  }

  return {
    target: 'asset',
    mode: 'sheet',
    rows: 4,
    cols: 4,
    cellSize: 96,
    frameLabels:
      actionPack === 'action-rpg'
        ? actionRpgLabels
        : actionPack === 'platformer'
          ? platformerLabels
          : customLabels,
    align: 'center',
    sharedScale: true,
    componentMode: 'all',
    prompt: [
      buildActionSheetPrompt({ character, actionPack, notes }),
      `Export target: ${platform === 'unity' ? 'Unity' : 'Godot'}.`,
    ].join(' '),
  };
}
