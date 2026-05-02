import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import sharp from 'sharp';
import type {
  SpriteActionPack,
  SpriteForgePlan,
  SpritePlatform,
} from './prompt';
import { type ZipEntry, createStoredZip } from './zip';

type RawImage = {
  data: Buffer;
  width: number;
  height: number;
};

type BBox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} | null;

export type SpriteForgeExportInput = {
  sourceImage: Buffer;
  plan: SpriteForgePlan;
  platform: SpritePlatform;
  actionPack: SpriteActionPack;
  originalPrompt: string;
  taskId?: string;
};

export type SpriteForgeExport = {
  rawSheet: Buffer;
  rawSheetClean: Buffer;
  transparentSheet: Buffer;
  animationGif: Buffer;
  frames: Array<{
    label: string;
    png: Buffer;
    raw: Buffer;
    info: FrameInfo;
  }>;
  strips: Array<{
    label: string;
    png: Buffer;
    gif: Buffer;
  }>;
  atlas: Record<string, unknown>;
  metadata: Record<string, unknown>;
  promptUsed: string;
  zip: Buffer;
};

type FrameInfo = {
  label: string;
  grid: [number, number];
  sourceBox: [number, number, number, number];
  cropBbox: [number, number, number, number] | null;
  edgeTouch: boolean;
  outputSize: [number, number];
  pastePosition: [number, number];
  componentMode: SpriteForgePlan['componentMode'];
  componentCount: number;
};

const channels = 4;
const magenta = { r: 255, g: 0, b: 255 };

function distanceFromMagenta(r: number, g: number, b: number) {
  return Math.sqrt(
    (r - magenta.r) ** 2 + (g - magenta.g) ** 2 + (b - magenta.b) ** 2
  );
}

async function decodeImage(buffer: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
  };
}

async function rawToPng(raw: RawImage) {
  return sharp(raw.data, {
    raw: { width: raw.width, height: raw.height, channels },
  })
    .png()
    .toBuffer();
}

function removeMagentaBackground(raw: RawImage, threshold = 100) {
  const output = Buffer.from(raw.data);
  for (let index = 0; index < output.byteLength; index += channels) {
    if (output[index + 3] === 0) {
      continue;
    }

    if (
      distanceFromMagenta(output[index], output[index + 1], output[index + 2]) <
      threshold
    ) {
      output[index] = 0;
      output[index + 1] = 0;
      output[index + 2] = 0;
      output[index + 3] = 0;
    }
  }

  return { ...raw, data: output };
}

function cleanEdgePixels(raw: RawImage, depth = 3) {
  const output = Buffer.from(raw.data);

  function clearIfNoise(x: number, y: number) {
    if (x < 0 || y < 0 || x >= raw.width || y >= raw.height) {
      return;
    }

    const index = (y * raw.width + x) * channels;
    const r = output[index];
    const g = output[index + 1];
    const b = output[index + 2];
    const alpha = output[index + 3];

    if (alpha === 0) {
      return;
    }

    const isDark = r < 40 && g < 40 && b < 40;
    const isMagenta = distanceFromMagenta(r, g, b) < 150;
    if (isDark || isMagenta) {
      output[index] = 0;
      output[index + 1] = 0;
      output[index + 2] = 0;
      output[index + 3] = 0;
    }
  }

  for (let step = 0; step < depth; step += 1) {
    for (let x = 0; x < raw.width; x += 1) {
      clearIfNoise(x, step);
      clearIfNoise(x, raw.height - 1 - step);
    }

    for (let y = 0; y < raw.height; y += 1) {
      clearIfNoise(step, y);
      clearIfNoise(raw.width - 1 - step, y);
    }
  }

  return { ...raw, data: output };
}

function extractRaw(raw: RawImage, box: BBox): RawImage {
  if (!box) {
    return {
      data: Buffer.alloc(channels),
      width: 1,
      height: 1,
    };
  }

  const width = Math.max(1, box.x1 - box.x0);
  const height = Math.max(1, box.y1 - box.y0);
  const data = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y += 1) {
    const sourceStart = ((box.y0 + y) * raw.width + box.x0) * channels;
    const targetStart = y * width * channels;
    raw.data.copy(
      data,
      targetStart,
      sourceStart,
      sourceStart + width * channels
    );
  }

  return { data, width, height };
}

function alphaBBox(raw: RawImage): BBox {
  let x0 = raw.width;
  let y0 = raw.height;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < raw.height; y += 1) {
    for (let x = 0; x < raw.width; x += 1) {
      const alpha = raw.data[(y * raw.width + x) * channels + 3];
      if (alpha > 0) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
    }
  }

  return x1 >= 0 ? { x0, y0, x1, y1 } : null;
}

function connectedComponentBBoxes(raw: RawImage) {
  const visited = new Uint8Array(raw.width * raw.height);
  const components: Array<{ bbox: NonNullable<BBox>; area: number }> = [];

  for (let y = 0; y < raw.height; y += 1) {
    for (let x = 0; x < raw.width; x += 1) {
      const startIndex = y * raw.width + x;
      if (visited[startIndex] || raw.data[startIndex * channels + 3] === 0) {
        continue;
      }

      let head = 0;
      const queue = [startIndex];
      visited[startIndex] = 1;
      let area = 0;
      let x0 = x;
      let y0 = y;
      let x1 = x + 1;
      let y1 = y + 1;

      while (head < queue.length) {
        const current = queue[head];
        head += 1;
        const cx = current % raw.width;
        const cy = Math.floor(current / raw.width);
        area += 1;
        x0 = Math.min(x0, cx);
        y0 = Math.min(y0, cy);
        x1 = Math.max(x1, cx + 1);
        y1 = Math.max(y1, cy + 1);

        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= raw.width || ny >= raw.height) {
            continue;
          }

          const nextIndex = ny * raw.width + nx;
          if (visited[nextIndex] || raw.data[nextIndex * channels + 3] === 0) {
            continue;
          }

          visited[nextIndex] = 1;
          queue.push(nextIndex);
        }
      }

      components.push({ bbox: { x0, y0, x1, y1 }, area });
    }
  }

  return components.sort((a, b) => b.area - a.area);
}

function padBBox(bbox: NonNullable<BBox>, padding: number, raw: RawImage) {
  return {
    x0: Math.max(0, bbox.x0 - padding),
    y0: Math.max(0, bbox.y0 - padding),
    x1: Math.min(raw.width, bbox.x1 + padding),
    y1: Math.min(raw.height, bbox.y1 + padding),
  };
}

function edgeTouch(bbox: BBox, raw: RawImage, margin = 0) {
  if (!bbox) {
    return false;
  }

  return (
    bbox.x0 <= margin ||
    bbox.y0 <= margin ||
    bbox.x1 >= raw.width - margin ||
    bbox.y1 >= raw.height - margin
  );
}

async function resizeRaw(raw: RawImage, width: number, height: number) {
  const resized = await sharp(raw.data, {
    raw: { width: raw.width, height: raw.height, channels },
  })
    .resize(width, height, { fit: 'fill', kernel: 'nearest' })
    .raw()
    .toBuffer();

  return resized;
}

function pasteRaw(
  canvas: RawImage,
  input: Buffer,
  inputWidth: number,
  inputHeight: number,
  left: number,
  top: number
) {
  for (let y = 0; y < inputHeight; y += 1) {
    for (let x = 0; x < inputWidth; x += 1) {
      const source = (y * inputWidth + x) * channels;
      const target = ((top + y) * canvas.width + left + x) * channels;
      const alpha = input[source + 3] / 255;

      if (alpha <= 0) {
        continue;
      }

      canvas.data[target] = input[source];
      canvas.data[target + 1] = input[source + 1];
      canvas.data[target + 2] = input[source + 2];
      canvas.data[target + 3] = input[source + 3];
    }
  }
}

async function processFrames({
  cleaned,
  plan,
  fitScale = 0.85,
  trimBorder = 4,
  edgeCleanDepth = 3,
}: {
  cleaned: RawImage;
  plan: SpriteForgePlan;
  fitScale?: number;
  trimBorder?: number;
  edgeCleanDepth?: number;
}) {
  const sourceCellWidth = Math.floor(cleaned.width / plan.cols);
  const sourceCellHeight = Math.floor(cleaned.height / plan.rows);
  const crops: Array<{
    raw: RawImage;
    sourceBox: [number, number, number, number];
    cropBbox: BBox;
    componentCount: number;
    edgeTouch: boolean;
  }> = [];

  for (let row = 0; row < plan.rows; row += 1) {
    for (let col = 0; col < plan.cols; col += 1) {
      const sourceBox: [number, number, number, number] = [
        col * sourceCellWidth,
        row * sourceCellHeight,
        (col + 1) * sourceCellWidth,
        (row + 1) * sourceCellHeight,
      ];
      let cell = extractRaw(cleaned, {
        x0: sourceBox[0] + trimBorder,
        y0: sourceBox[1] + trimBorder,
        x1: sourceBox[2] - trimBorder,
        y1: sourceBox[3] - trimBorder,
      });
      cell = cleanEdgePixels(cell, edgeCleanDepth);

      const components = connectedComponentBBoxes(cell);
      const bbox =
        plan.componentMode === 'largest' && components[0]
          ? padBBox(components[0].bbox, 0, cell)
          : alphaBBox(cell);

      crops.push({
        raw: extractRaw(cell, bbox),
        sourceBox,
        cropBbox: bbox,
        componentCount: components.length,
        edgeTouch: edgeTouch(bbox, cell),
      });
    }
  }

  const maxWidth = Math.max(...crops.map((crop) => crop.raw.width), 1);
  const maxHeight = Math.max(...crops.map((crop) => crop.raw.height), 1);
  const commonScale = plan.sharedScale
    ? Math.min(plan.cellSize / maxWidth, plan.cellSize / maxHeight) * fitScale
    : null;
  const frames: Array<{
    label: string;
    raw: Buffer;
    png: Buffer;
    info: FrameInfo;
  }> = [];

  for (const [index, crop] of crops.entries()) {
    const scale =
      commonScale ??
      Math.min(
        plan.cellSize / Math.max(crop.raw.width, 1),
        plan.cellSize / Math.max(crop.raw.height, 1)
      ) * fitScale;
    const outputWidth = Math.max(1, Math.floor(crop.raw.width * scale));
    const outputHeight = Math.max(1, Math.floor(crop.raw.height * scale));
    const resized = await resizeRaw(crop.raw, outputWidth, outputHeight);
    const canvas: RawImage = {
      width: plan.cellSize,
      height: plan.cellSize,
      data: Buffer.alloc(plan.cellSize * plan.cellSize * channels),
    };
    const left = Math.floor((plan.cellSize - outputWidth) / 2);
    const top =
      plan.align === 'bottom' || plan.align === 'feet'
        ? plan.cellSize -
          outputHeight -
          Math.max(0, Math.floor(plan.cellSize * (1 - fitScale) * 0.5))
        : Math.floor((plan.cellSize - outputHeight) / 2);
    pasteRaw(canvas, resized, outputWidth, outputHeight, left, top);

    const label = plan.frameLabels[index] ?? `frame-${index + 1}`;
    frames.push({
      label,
      raw: canvas.data,
      png: await rawToPng(canvas),
      info: {
        label,
        grid: [Math.floor(index / plan.cols), index % plan.cols],
        sourceBox: crop.sourceBox,
        cropBbox: crop.cropBbox
          ? [
              crop.cropBbox.x0,
              crop.cropBbox.y0,
              crop.cropBbox.x1,
              crop.cropBbox.y1,
            ]
          : null,
        edgeTouch: crop.edgeTouch,
        outputSize: [outputWidth, outputHeight],
        pastePosition: [left, top],
        componentMode: plan.componentMode,
        componentCount: crop.componentCount,
      },
    });
  }

  return frames;
}

function composeSheetRaw(
  frames: Array<{ raw: Buffer }>,
  rows: number,
  cols: number,
  cellSize: number
): RawImage {
  const canvas: RawImage = {
    width: cols * cellSize,
    height: rows * cellSize,
    data: Buffer.alloc(rows * cols * cellSize * cellSize * channels),
  };

  frames.forEach((frame, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    pasteRaw(
      canvas,
      frame.raw,
      cellSize,
      cellSize,
      col * cellSize,
      row * cellSize
    );
  });

  return canvas;
}

function findTransparentIndex(palette: number[][]) {
  const index = palette.findIndex(
    (color) => color.length > 3 && color[3] === 0
  );
  if (index >= 0) {
    return index;
  }

  palette.unshift([0, 0, 0, 0]);
  return 0;
}

function makeGif(
  frames: Array<{ raw: Buffer }>,
  cellSize: number,
  duration = 160
) {
  const gif = GIFEncoder();

  for (const frame of frames) {
    const rgba = new Uint8Array(frame.raw);
    const palette = quantize(rgba, 256, {
      format: 'rgba4444',
      oneBitAlpha: 127,
      clearAlpha: true,
    });
    const transparentIndex = findTransparentIndex(palette);
    const index = applyPalette(rgba, palette, 'rgba4444');
    gif.writeFrame(index, cellSize, cellSize, {
      palette,
      transparent: true,
      transparentIndex,
      delay: duration,
      repeat: 0,
      dispose: 2,
    });
  }

  gif.finish();
  return Buffer.from(gif.bytes());
}

function buildAtlas({
  plan,
  platform,
  actionPack,
}: {
  plan: SpriteForgePlan;
  platform: SpritePlatform;
  actionPack: SpriteActionPack;
}) {
  const frames = plan.frameLabels.map((label, index) => {
    const row = Math.floor(index / plan.cols);
    const col = index % plan.cols;
    return {
      name: label,
      x: col * plan.cellSize,
      y: row * plan.cellSize,
      w: plan.cellSize,
      h: plan.cellSize,
      pivot: plan.align === 'feet' ? { x: 0.5, y: 0.92 } : { x: 0.5, y: 0.5 },
    };
  });

  const animations =
    plan.mode === 'player_sheet'
      ? {
          down: plan.frameLabels.slice(0, 4),
          left: plan.frameLabels.slice(4, 8),
          right: plan.frameLabels.slice(8, 12),
          up: plan.frameLabels.slice(12, 16),
        }
      : {
          [actionPack]: plan.frameLabels,
        };

  return {
    version: 1,
    platform,
    actionPack,
    image: 'sheet-transparent.png',
    frameSize: { w: plan.cellSize, h: plan.cellSize },
    rows: plan.rows,
    cols: plan.cols,
    frames,
    animations,
    unity:
      platform === 'unity'
        ? {
            pixelsPerUnit: plan.cellSize,
            spriteMode: 'multiple',
            importType: 'grid',
          }
        : undefined,
    godot:
      platform === 'godot'
        ? {
            resource: 'SpriteFrames',
            hframes: plan.cols,
            vframes: plan.rows,
          }
        : undefined,
  };
}

export async function buildSpriteForgeExport({
  sourceImage,
  plan,
  platform,
  actionPack,
  originalPrompt,
  taskId,
}: SpriteForgeExportInput): Promise<SpriteForgeExport> {
  const raw = await decodeImage(sourceImage);
  const rawSheet = await sharp(sourceImage).png().toBuffer();
  const cleaned = removeMagentaBackground(raw);
  const rawSheetClean = await rawToPng(cleaned);
  const frames = await processFrames({ cleaned, plan });
  const sheetRaw = composeSheetRaw(frames, plan.rows, plan.cols, plan.cellSize);
  const transparentSheet = await rawToPng(sheetRaw);
  const animationGif = makeGif(frames, plan.cellSize);
  const atlas = buildAtlas({ plan, platform, actionPack });
  const strips: SpriteForgeExport['strips'] = [];

  if (plan.mode === 'player_sheet') {
    for (const [rowIndex, direction] of [
      'down',
      'left',
      'right',
      'up',
    ].entries()) {
      const rowFrames = frames.slice(
        rowIndex * plan.cols,
        (rowIndex + 1) * plan.cols
      );
      const stripRaw = composeSheetRaw(rowFrames, 1, plan.cols, plan.cellSize);
      strips.push({
        label: direction,
        png: await rawToPng(stripRaw),
        gif: makeGif(rowFrames, plan.cellSize),
      });
    }
  }

  const metadata = {
    target: plan.target,
    mode: plan.mode,
    taskId,
    originalPrompt,
    platform,
    actionPack,
    rows: plan.rows,
    cols: plan.cols,
    cellSize: plan.cellSize,
    align: plan.align,
    sharedScale: plan.sharedScale,
    componentMode: plan.componentMode,
    frameLabels: plan.frameLabels,
    frames: frames.map((frame) => frame.info),
    edgeTouchFrames: frames
      .filter((frame) => frame.info.edgeTouch)
      .map((frame) => frame.info.grid),
  };
  const promptUsed = plan.prompt;
  const zipEntries: ZipEntry[] = [
    { path: 'raw-sheet.png', data: rawSheet },
    { path: 'raw-sheet-clean.png', data: rawSheetClean },
    { path: 'sheet-transparent.png', data: transparentSheet },
    { path: 'animation.gif', data: animationGif },
    { path: 'atlas.json', data: JSON.stringify(atlas, null, 2) },
    { path: 'pipeline-meta.json', data: JSON.stringify(metadata, null, 2) },
    { path: 'prompt-used.txt', data: promptUsed },
    ...frames.map((frame) => ({
      path: `${frame.label}.png`,
      data: frame.png,
    })),
    ...strips.flatMap((strip) => [
      { path: `${strip.label}-strip.png`, data: strip.png },
      { path: `${strip.label}.gif`, data: strip.gif },
    ]),
  ];

  return {
    rawSheet,
    rawSheetClean,
    transparentSheet,
    animationGif,
    frames,
    strips,
    atlas,
    metadata,
    promptUsed,
    zip: createStoredZip(zipEntries),
  };
}
