export const spriteFaqs = [
  {
    q: 'Is AI Sprite Generator meant for final production art?',
    a: 'AI Sprite Generator is built first for prototypes, demos, game jams, vertical slices, and pre-production decisions. It can save real art direction time, but final production assets should still be reviewed and polished by a human artist.',
  },
  {
    q: 'Can I upload my own character image?',
    a: 'Yes. The hero accepts a reference image, so AI Sprite Generator can use an existing sketch, portrait, or rough character direction instead of relying only on a text prompt.',
  },
  {
    q: 'What do I get back?',
    a: 'The first version returns a generated sprite sheet plus export files from the hero workflow: transparent PNG output, frame PNGs, animation GIF, atlas JSON, pipeline metadata, and a ZIP pack.',
  },
  {
    q: 'Why group Unity and Godot together?',
    a: 'They are the same decision type: export platform. The composer keeps one platform selector so the AI Sprite Generator request stays compact while still preparing data for the engine workflow.',
  },
  {
    q: 'What happens if generation fails?',
    a: 'The app reports the task error and keeps your prompt in place. That way you can adjust the character, action pack, or reference image and retry without rebuilding the whole AI Sprite Generator request.',
  },
];
