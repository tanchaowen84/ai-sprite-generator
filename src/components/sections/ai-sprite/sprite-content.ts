export const spriteFaqs = [
  {
    q: 'Is this meant for final production art?',
    a: 'The MVP is built first for prototypes, demos, vertical slices, and pre-production. It can save real art direction time, but final production assets still need human review.',
  },
  {
    q: 'Can I upload my own character image?',
    a: 'Yes. The hero accepts a reference image and sends it as an image-to-image reference when generation starts.',
  },
  {
    q: 'What do I get back?',
    a: 'The first version returns the generated sheet, a transparent PNG, frame PNGs, animation GIF, atlas JSON, pipeline metadata, and a ZIP pack from the hero workflow.',
  },
  {
    q: 'Why group Unity and Godot together?',
    a: 'They are the same decision type: export platform. The composer keeps one platform selector instead of scattering separate engine buttons across the hero.',
  },
  {
    q: 'What happens if generation fails?',
    a: 'The app reports the task error and keeps your prompt in place so you can adjust and retry without rebuilding the whole request.',
  },
];
