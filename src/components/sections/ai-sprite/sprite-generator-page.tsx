'use client';

import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  FileJson,
  Gamepad2,
  History,
  ImagePlus,
  Layers3,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { spriteFaqs } from './sprite-content';
import { SpritePricingSection } from './sprite-pricing-section';

type Platform = 'unity' | 'godot';
type ActionPack = 'platformer' | 'top-down' | 'action-rpg' | 'custom';

type GenerationStatus =
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';
type ExportFormat = 'zip' | 'sheet' | 'atlas' | 'metadata' | 'gif';

const platforms: Array<{ id: Platform; label: string; helper: string }> = [
  { id: 'unity', label: 'Unity', helper: 'Sprite Editor + JSON' },
  { id: 'godot', label: 'Godot', helper: 'SpriteFrames + atlas' },
];

const sampleSpriteSheet = '/images/ai-sprite/sample-sprite-sheet.webp';
const engineWorkflowShowcase =
  '/images/ai-sprite/engine-workflow-showcase.webp';

const actionPacks: Array<{ id: ActionPack; label: string; helper: string }> = [
  { id: 'platformer', label: 'Platformer', helper: 'idle, run, jump, attack' },
  { id: 'top-down', label: 'Top-down', helper: '4-direction walk + interact' },
  { id: 'action-rpg', label: 'Action RPG', helper: 'slash, cast, hit, death' },
  { id: 'custom', label: 'Anything else', helper: 'describe it in notes' },
];

const useCases = [
  {
    title: 'Game jams',
    body: 'A jam build does not wait for perfect art. Use AI Sprite Generator as a fast sprite sheet generator to get a readable game sprite into the build and keep testing.',
    accent: 'bg-[#f8df74]',
    icon: Timer,
  },
  {
    title: 'Solo dev vertical slices',
    body: 'When you are coding, balancing, and making art alone, the first 2D sprite sheet should not become a side quest. Generate a pass, test it, and keep moving.',
    accent: 'bg-[#a7e8bd]',
    icon: Gamepad2,
  },
  {
    title: 'Pre-production',
    body: 'Before the art pass is locked, AI Sprite Generator helps compare game sprite silhouettes and motion ideas while the character is still cheap to change.',
    accent: 'bg-[#cbb7ff]',
    icon: Layers3,
  },
  {
    title: 'Engine handoff checks',
    body: 'Export platform matters because the next step is usually Unity sprite sheet export or Godot sprite sheet export. Keep that choice in the request so the sheet and metadata stay together.',
    accent: 'bg-[#8be6ff]',
    icon: Play,
  },
];

const workflowSteps: Array<{ step: string; title: string; body: string }> = [
  {
    step: '1',
    title: 'Bring the rough character',
    body: 'Start with what you already have: a prompt, a sketch, or a reference image. AI Sprite Generator works as a 2D sprite generator when the request says who the character is and how it should move.',
  },
  {
    step: '2',
    title: 'Pick the motion you need',
    body: 'Choose the action pack your prototype needs, then choose one export platform. Unity and Godot stay grouped because they are one downstream sprite sheet decision.',
  },
  {
    step: '3',
    title: 'Check the sheet before cleanup',
    body: 'Generate the sprite pack, inspect the sprite sheet on the same page, then download the files you need. You should be able to tell quickly whether it is useful.',
  },
];

const featureChecks: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Consistent frames', icon: ShieldCheck },
  { label: 'Transparent-ready keying', icon: CheckCircle2 },
  { label: 'Redo-friendly loop', icon: RotateCcw },
  { label: 'Prototype export files', icon: Zap },
];

const featureCards: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Generation history',
    body: 'Keep task context close to the result so a weak pose does not force you to rebuild the request from memory. A practical AI Sprite Generator makes retrying feel cheap.',
    icon: History,
  },
  {
    title: 'Download path',
    body: 'The sprite pack includes transparent sheet output, frame PNGs, animation GIF, atlas JSON, prompt, metadata, and a ZIP file. The result is built around download, not just preview.',
    icon: Download,
  },
  {
    title: 'Reference upload',
    body: 'If you already have a sketch or existing character art, reference upload helps AI Sprite Generator follow that game sprite direction instead of starting from a blank prompt.',
    icon: ImagePlus,
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function SpriteSheetMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[2rem] border-2 border-[#241b15] bg-white p-4 shadow-[6px_6px_0_#d8cec0] sm:shadow-[10px_10px_0_#d8cec0]',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-[#f8df74] px-3 py-1 text-xs font-black uppercase text-[#241b15]">
          4 x 4 sheet
        </span>
        <span className="text-xs font-bold uppercase text-[#8a7e70]">
          64 px frames
        </span>
      </div>
      <div className="overflow-hidden rounded-3xl border-2 border-dashed border-[#d8cec0] bg-[#ff00ff]">
        <img
          src={sampleSpriteSheet}
          alt="Generated blue slime knight sprite sheet sample"
          width={1254}
          height={1254}
          className="aspect-square w-full object-contain"
        />
      </div>
    </div>
  );
}

function EngineExportMockup() {
  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border-2 border-[#241b15] bg-white p-3 shadow-[6px_6px_0_#d8cec0] sm:shadow-[12px_12px_0_#d8cec0]">
      <img
        src={engineWorkflowShowcase}
        alt="Generated sprite sheet prepared for Unity and Godot preview"
        width={1586}
        height={992}
        className="aspect-[16/10] w-full rounded-[1.5rem] object-cover"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="rounded-2xl border border-[#eadfd2] bg-[#f7f2ea] p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <FileJson className="size-4 text-[#8be6ff]" />
              <span className="font-bold text-[#241b15]">{platform.label}</span>
            </div>
            <p className="text-sm text-[#6f6257]">{platform.helper}</p>
          </div>
        ))}
      </div>
      <pre className="mt-3 overflow-hidden rounded-2xl bg-[#241b15] p-4 font-mono text-xs leading-relaxed text-[#a7e8bd]">
        {`{
  "frameSize": 64,
  "actions": ["idle", "walk", "run", "attack"],
  "platform": "unity"
}`}
      </pre>
    </div>
  );
}

function ResultPanel({
  status,
  imageUrl,
  progress,
  taskId,
  exportingFormat,
  onExport,
}: {
  status: GenerationStatus;
  imageUrl: string | null;
  progress: number;
  taskId: string | null;
  exportingFormat: ExportFormat | null;
  onExport: (format: ExportFormat) => void;
}) {
  const isWorking =
    status === 'submitting' || status === 'pending' || status === 'processing';
  const visibleImage = imageUrl ?? sampleSpriteSheet;
  const waitingMessage =
    status === 'submitting'
      ? 'Preparing generation request'
      : 'Queued for generation';

  return (
    <div className="flex h-full min-w-0 flex-col rounded-[1.75rem] border-2 border-[#241b15] bg-white p-4 shadow-[6px_6px_0_#d8cec0] sm:shadow-[10px_10px_0_#d8cec0]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a7e70]">
            Output
          </p>
          <h3 className="text-lg font-black text-[#241b15]">Sprite sheet</h3>
        </div>
        <span className="rounded-full bg-[#e7f8ed] px-3 py-1 text-xs font-bold uppercase text-[#1d6f50]">
          {status === 'idle' ? 'sample' : status}
        </span>
      </div>
      <div className="relative flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[#faf9f7] sm:min-h-[280px]">
        <img
          src={visibleImage}
          alt={imageUrl ? 'Generated sprite sheet' : 'Sample sprite sheet'}
          className="h-full max-h-[360px] w-full object-contain"
        />
        {isWorking ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fbf8f3]/85 text-[#241b15] backdrop-blur-sm">
            <Loader2 className="mb-3 size-8 animate-spin" />
            <p className="font-black">Generating sprite pack</p>
            <p className="mt-1 text-sm text-[#6f6257]">
              {progress ? `${progress}%` : waitingMessage}
            </p>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a7e70]">
        <span>{imageUrl ? 'PNG ready' : 'PNG preview'}</span>
        <span>{imageUrl ? 'GIF ready' : 'Atlas JSON prepared'}</span>
        <span>{taskId ? `Task ${taskId.slice(0, 10)}` : 'No task yet'}</span>
      </div>
      {status === 'completed' && imageUrl ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { format: 'zip', label: 'Export ZIP', icon: Download },
            { format: 'sheet', label: 'Transparent PNG', icon: ImagePlus },
            { format: 'atlas', label: 'Atlas JSON', icon: FileJson },
            { format: 'gif', label: 'Animation GIF', icon: Play },
          ].map(({ format, label, icon: Icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => onExport(format as ExportFormat)}
              disabled={exportingFormat !== null}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#241b15] bg-white px-3 py-2 text-sm font-black transition hover:bg-[#f7f2ea] disabled:cursor-wait disabled:opacity-60"
            >
              {exportingFormat === format ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function filenameFromResponse(response: Response, fallback: string) {
  const disposition = response.headers.get('content-disposition');
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

function fallbackFilename(format: ExportFormat) {
  if (format === 'sheet') {
    return 'sheet-transparent.png';
  }
  if (format === 'atlas') {
    return 'atlas.json';
  }
  if (format === 'metadata') {
    return 'pipeline-meta.json';
  }
  if (format === 'gif') {
    return 'animation.gif';
  }
  return 'sprite-pack.zip';
}

export function SpriteGeneratorPage() {
  const [prompt, setPrompt] = useState(
    'A tiny forest knight with a moss cape and glowing amber sword'
  );
  const [platform, setPlatform] = useState<Platform>('unity');
  const [actionPack, setActionPack] = useState<ActionPack>('platformer');
  const [notes, setNotes] = useState('');
  const [referenceImageDataUrl, setReferenceImageDataUrl] = useState<
    string | undefined
  >();
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Please keep the reference image under 4MB.');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setReferenceImageDataUrl(dataUrl);
    setReferenceName(file.name);
  }

  async function pollTask(nextTaskId: string) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await wait(attempt === 0 ? 8000 : 4000);

      const response = await fetch(`/api/sprite/status?taskId=${nextTaskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to query generation status');
      }

      setStatus(data.status === 'pending' ? 'pending' : data.status);
      setProgress(data.progress ?? 0);

      if (data.status === 'completed' && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setStatus('completed');
        toast.success('Sprite pack generated and ready to export.');
        return;
      }

      if (data.status === 'failed' || data.status === 'cancelled') {
        throw new Error(data.error ?? 'Generation failed');
      }
    }

    throw new Error(
      'Generation is still processing. Please query again later.'
    );
  }

  async function handleGenerate() {
    if (prompt.trim().length < 8) {
      toast.error('Add a little more character detail first.');
      return;
    }

    setStatus('submitting');
    setProgress(0);
    setImageUrl(null);

    try {
      const response = await fetch('/api/sprite/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          platform,
          actionPack,
          notes,
          referenceImageDataUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to start generation');
      }

      setTaskId(data.taskId);
      setStatus('pending');
      toast.info('Generation task submitted.');
      await pollTask(data.taskId);
    } catch (error) {
      setStatus('failed');
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!imageUrl) {
      toast.error('Generate a sprite sheet before exporting.');
      return;
    }

    setExportingFormat(format);

    try {
      const response = await fetch('/api/sprite/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          prompt,
          platform,
          actionPack,
          notes,
          taskId,
          format,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to export sprite pack');
      }

      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = filenameFromResponse(response, fallbackFilename(format));
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      toast.success('Export ready.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <div className="overflow-x-hidden bg-[#faf9f7] text-[#241b15]">
      <section
        id="generator"
        className="relative isolate overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#faf9f7,#fffaf0),linear-gradient(#e8ddd0_1px,transparent_1px),linear-gradient(90deg,#e8ddd0_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px] opacity-65" />
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto mb-3 inline-flex rounded-full border border-[#241b15] bg-[#dff4e8] px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em]">
              FOR INDIE 2D GAME DEVS
            </p>
            <h1 className="mx-auto max-w-[22rem] text-balance font-bricolage-grotesque text-3xl font-black leading-[1.04] tracking-normal text-[#241b15] sm:max-w-none sm:text-5xl lg:text-6xl">
              <span className="block">AI Sprite Generator</span>
              <span className="block">for playable sprite packs.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-[23rem] text-sm leading-7 text-[#6f6257] sm:max-w-3xl sm:text-lg">
              Make a 2D sprite sheet without breaking your build flow. Type a
              prompt or upload a reference image, choose the action pack, and
              let AI Sprite Generator return an inspectable sprite sheet and
              exportable sprite pack.
            </p>
          </div>

          <div className="relative mx-auto mt-7 grid w-full min-w-0 max-w-[calc(100vw-3rem)] gap-6 sm:max-w-6xl lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
            <div className="flex h-full min-w-0 rounded-[1.75rem] border-2 border-[#241b15] bg-white p-4 shadow-[6px_6px_0_#d8cec0] sm:p-5 sm:shadow-[10px_10px_0_#d8cec0]">
              <div className="flex h-full w-full min-w-0 flex-col">
                <div className="flex min-w-0 flex-1 flex-col rounded-[1.35rem] border-2 border-[#d8cec0] bg-white p-3 focus-within:border-[#241b15]">
                  <textarea
                    id="sprite-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-44 w-full min-w-0 flex-1 resize-none bg-transparent p-2 text-base leading-7 text-[#241b15] outline-none placeholder:text-[#b5aa9f] sm:min-h-52 sm:text-lg lg:min-h-60"
                    placeholder="A tiny forest knight with a moss cape and glowing amber sword..."
                  />
                  <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-[#eee3d7] px-1 pt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleFile(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#241b15] bg-white px-3 py-2 text-sm font-black transition hover:bg-[#f7f2ea] sm:w-auto"
                    >
                      <Upload className="size-4" />
                      {referenceName ? 'Image added' : 'Upload Image'}
                    </button>
                    <label className="inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-full border border-[#241b15] bg-[#dff4e8] px-3 py-2 text-sm font-black sm:w-auto">
                      <span>Export Platform</span>
                      <select
                        value={platform}
                        onChange={(event) =>
                          setPlatform(event.target.value as Platform)
                        }
                        className="min-w-0 cursor-pointer bg-transparent font-black outline-none"
                      >
                        {platforms.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="size-4" />
                    </label>
                    <label className="inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-full border border-[#241b15] bg-[#fff1a8] px-3 py-2 text-sm font-black sm:w-auto">
                      <span>Action Pack</span>
                      <select
                        value={actionPack}
                        onChange={(event) =>
                          setActionPack(event.target.value as ActionPack)
                        }
                        className="min-w-0 cursor-pointer bg-transparent font-black outline-none"
                      >
                        {actionPacks.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="size-4" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNotes((value) => !value)}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#241b15] bg-[#f7f2ea] px-3 py-2 text-sm font-black transition hover:bg-[#eee3d7] sm:w-auto"
                    >
                      <Sparkles className="size-4" />
                      Anything else
                    </button>
                  </div>
                </div>

                {showNotes ? (
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-3 min-h-20 w-full rounded-[1.35rem] border-2 border-[#d8cec0] bg-white p-4 text-sm outline-none focus:border-[#241b15]"
                    placeholder="Add constraints like frame count, side-view, tiny sword swing, or top-down camera..."
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={
                    status === 'submitting' ||
                    status === 'pending' ||
                    status === 'processing'
                  }
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#241b15] px-6 py-4 text-base font-black text-white shadow-[0_7px_0_#00000040] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === 'submitting' ||
                  status === 'pending' ||
                  status === 'processing' ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Wand2 className="size-5" />
                  )}
                  Generate Sprite Pack
                </button>

                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.1em] text-[#8a7e70]">
                  <span>3 free generations</span>
                  <span>Transparent PNG</span>
                  <span>Atlas/json export</span>
                </div>
              </div>
            </div>

            <ResultPanel
              status={status}
              imageUrl={imageUrl}
              progress={progress}
              taskId={taskId}
              exportingFormat={exportingFormat}
              onExport={handleExport}
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6257]">
              The annoying part
            </p>
            <h2 className="mt-3 font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
              Sprite sheet workflow
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#6f6257]">
              You already have the character idea. The slow part is getting it
              into idle, walk, run, and attack frames without losing the rest of
              the build day. AI Sprite Generator keeps that 2D sprite sheet pass
              small enough to try.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-[2rem] border-2 border-[#241b15] bg-white p-6 shadow-[8px_8px_0_#d8cec0]"
              >
                <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border-2 border-[#241b15] bg-[#f8df74] text-2xl font-black shadow-[4px_4px_0_#d8cec0]">
                  {step}
                </div>
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-[#6f6257]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="use-cases"
        className="bg-[#e7f8ed] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6257]">
              Where it helps
            </p>
            <h2 className="mt-3 font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
              Prototype use cases
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#38634d]">
              A gray box can test collision, but it cannot tell you if a
              character feels too heavy or unreadable during an attack. AI
              Sprite Generator is for the middle step where the art is not
              final, but the build needs a game sprite that moves.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[2rem] border-2 border-[#241b15] bg-white p-6 shadow-[7px_7px_0_rgba(36,27,21,0.12)]"
                >
                  <div
                    className={cn(
                      'mb-5 flex size-12 items-center justify-center rounded-2xl border-2 border-[#241b15]',
                      item.accent
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6f6257]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <SpriteSheetMockup />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6257]">
                The files matter
              </p>
              <h2 className="mt-3 font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
                Export-ready sprite sheets
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#6f6257]">
                A useful AI sprite sheet generator should get closer to the
                boring files a developer actually needs: transparent PNG output,
                frame files, GIF preview, atlas JSON, and a ZIP pack.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {featureChecks.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-[0_0_0_1px_#eadfd2]"
                  >
                    <Icon className="size-5 text-[#1d8d63]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f6257]">
                Engine handoff
              </p>
              <h3 className="mt-3 font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-5xl">
                Unity and Godot export
              </h3>
              <p className="mt-5 text-lg leading-8 text-[#6f6257]">
                The composer groups engine choice under Export Platform because
                the user is making one downstream decision. That keeps the first
                interaction compact and still tells the sprite sheet generator
                how the exported data should be prepared for Unity or Godot.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <EngineExportMockup />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map(({ title, body, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[2rem] border-2 border-[#241b15] bg-white p-6 shadow-[8px_8px_0_#d8cec0]"
              >
                <Icon className="mb-5 size-8 text-[#1d8d63]" />
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-[#6f6257]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SpritePricingSection ctaHref="#generator" />

      <section id="faq" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
            FAQ (Frequently Asked Questions)
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#6f6257]">
            These answers focus on what you can create, review, and download
            from the 2D sprite sheet generator.
          </p>
          <div className="mt-10 space-y-4">
            {spriteFaqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.5rem] border-2 border-[#241b15] bg-white p-5 shadow-[5px_5px_0_#d8cec0]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black">
                  {item.q}
                  <ArrowRight className="size-5 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 leading-7 text-[#6f6257]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border-2 border-[#241b15] bg-[#ef5d75] p-10 text-white shadow-[16px_16px_0_#cbb7ff] sm:p-16">
          <div className="max-w-3xl">
            <h2 className="font-bricolage-grotesque text-4xl font-black tracking-normal sm:text-6xl">
              Generate one sprite pack
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/85">
              Give AI Sprite Generator one character prompt or reference image,
              then judge the sprite pack where the work starts: on the page,
              beside the input, before a longer art pipeline.
            </p>
            <a
              href="#generator"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#241b15] px-6 py-4 font-black text-white shadow-[0_8px_0_#00000040] transition hover:-translate-y-0.5"
            >
              Generate Your First Sprite Pack
              <ArrowRight className="size-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
