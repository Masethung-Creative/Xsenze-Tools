/**
 * Look words: animation types and their styles. `words` is the plain
 * description prompts use; never a studio's or artist's name, so the look
 * stays the user's own and reads the same in every model. The user's
 * keywords skill replaces these lists later.
 */

export interface Style {
  id: string;
  label: string;
  words: string;
}

export interface AnimationType {
  id: string;
  label: string;
  styles: readonly Style[];
}

/** Offered when the user has a style picture or character sheets. */
export const MATCH_MINE: Style = {
  id: 'match-mine',
  label: 'Match my pictures',
  words: 'in exactly the same style as the attached reference pictures',
};

export const ANIMATION_TYPES: readonly AnimationType[] = [
  {
    id: '3d',
    label: '3D animation',
    styles: [
      {
        id: 'feature-cartoon',
        label: 'Feature-film cartoon',
        words:
          'stylised 3D animated feature film look, appealing rounded shapes, expressive faces, soft global illumination',
      },
      {
        id: 'soft-toy',
        label: 'Soft toy',
        words:
          '3D plush toy look, soft felt and fleece textures, stitched seams, cosy light',
      },
      {
        id: 'clay-look',
        label: 'Clay-look',
        words:
          '3D clay look, matte plasticine surfaces with fingerprint texture, soft studio light',
      },
      {
        id: 'low-poly',
        label: 'Low-poly',
        words: 'low-poly 3D, flat-shaded facets, simple geometric forms',
      },
      {
        id: 'blocky',
        label: 'Blocky',
        words: 'blocky voxel 3D, characters and sets built from cubes',
      },
      {
        id: 'toy-figure',
        label: 'Toy figure',
        words: '3D vinyl toy figure look, glossy plastic, chunky proportions',
      },
      {
        id: 'realistic-3d',
        label: 'Realistic 3D',
        words:
          'realistic 3D render, physically based materials, cinematic lighting',
      },
    ],
  },
  {
    id: '2d',
    label: '2D animation',
    styles: [
      {
        id: 'storybook-watercolour',
        label: 'Storybook watercolour',
        words:
          "children's picture book illustration, soft watercolour washes, gentle pencil lines, paper texture",
      },
      {
        id: 'flat-vector',
        label: 'Flat vector',
        words: 'flat vector illustration, clean shapes, bold flat colours',
      },
      {
        id: 'crayon',
        label: "Crayon (child's drawing)",
        words:
          'crayon drawing as if by a child, waxy strokes, paper grain, bright colours',
      },
      {
        id: 'comic-outline',
        label: 'Comic outline',
        words: '2D cartoon, bold clean outlines, flat colour, simple shading',
      },
      {
        id: 'gouache',
        label: 'Gouache painting',
        words: 'gouache painting, opaque matte colour, visible brush strokes',
      },
      {
        id: 'ink-wash',
        label: 'Ink and wash',
        words: 'ink line and wash, loose brush lines, muted colour',
      },
      {
        id: 'retro-cartoon',
        label: '1930s cartoon',
        words:
          '1930s rubber-hose cartoon, black and white, bouncy limbs, film grain',
      },
      {
        id: 'pixel-art',
        label: 'Pixel art',
        words: 'pixel art, limited palette, crisp square pixels',
      },
      {
        id: 'whiteboard',
        label: 'Whiteboard',
        words:
          'whiteboard marker drawing, black lines on white, a few colour accents',
      },
      {
        id: 'chalkboard',
        label: 'Chalkboard',
        words: 'chalk drawing on a dark green chalkboard, dusty chalk texture',
      },
    ],
  },
  {
    id: 'anime',
    label: 'Anime',
    styles: [
      {
        id: 'modern-anime',
        label: 'Modern anime',
        words: 'modern anime, clean cel shading, detailed backgrounds',
      },
      {
        id: 'chibi',
        label: 'Chibi',
        words: 'chibi anime, big heads, small bodies, cute expressions',
      },
      {
        id: 'countryside-anime',
        label: 'Soft countryside anime',
        words:
          'soft hand-painted anime, lush countryside backgrounds, warm light',
      },
      {
        id: 'action-anime',
        label: 'Action anime',
        words: 'dynamic action anime, bold speed lines, dramatic angles',
      },
      {
        id: '90s-anime',
        label: '90s anime',
        words: '1990s cel anime, film grain, muted palette',
      },
    ],
  },
  {
    id: 'stop-motion',
    label: 'Stop-motion (clay, felt, puppets)',
    styles: [
      {
        id: 'clay',
        label: 'Clay',
        words:
          'claymation stop-motion, handmade plasticine puppets, miniature sets',
      },
      {
        id: 'felt',
        label: 'Felt and wool',
        words: 'stop-motion felt and wool puppets, needle-felted texture',
      },
      {
        id: 'wooden-toys',
        label: 'Wooden toys',
        words: 'stop-motion wooden toys, painted wood grain, miniature sets',
      },
      {
        id: 'puppets',
        label: 'Puppets',
        words: 'stop-motion puppets, fabric costumes, handmade miniature sets',
      },
    ],
  },
  {
    id: 'cut-out',
    label: 'Paper cut-out and collage',
    styles: [
      {
        id: 'paper-cut-out',
        label: 'Paper cut-out',
        words: 'paper cut-out animation, layered coloured paper, soft shadows',
      },
      {
        id: 'layered-paper',
        label: 'Layered paper',
        words: 'layered paper shadow box, deep stacked paper layers, backlit',
      },
      {
        id: 'collage',
        label: 'Collage',
        words: 'mixed-media collage, cut paper and printed textures',
      },
      {
        id: 'origami',
        label: 'Origami',
        words: 'origami folded paper characters and sets, crisp folds',
      },
    ],
  },
  {
    id: 'motion-graphics',
    label: 'Motion graphics (flat shapes and icons)',
    styles: [
      {
        id: 'flat-icons',
        label: 'Flat icons',
        words: 'motion graphics, flat icons and shapes, clean grid',
      },
      {
        id: 'isometric',
        label: 'Isometric',
        words: 'isometric illustration, clean three-quarter top view',
      },
      {
        id: 'infographic',
        label: 'Infographic',
        words: 'infographic style, simple charts and icons, clear layout',
      },
    ],
  },
  {
    id: 'realistic',
    label: 'Realistic (live-action look)',
    styles: [
      {
        id: 'cinematic',
        label: 'Cinematic',
        words:
          'cinematic live-action look, natural light, shallow depth of field',
      },
      {
        id: 'documentary',
        label: 'Documentary',
        words: 'documentary live-action look, handheld camera, natural light',
      },
      {
        id: 'old-film',
        label: 'Old film',
        words: 'vintage film look, warm grain, soft halation',
      },
    ],
  },
  {
    id: 'mixed',
    label: 'Mixed',
    styles: [
      {
        id: 'mixed-3d-painted',
        label: '3D characters in painted places',
        words: '3D animated characters in hand-painted 2D backgrounds',
      },
      {
        id: 'mixed-3d-real',
        label: '3D characters in real places',
        words: '3D animated characters in live-action places',
      },
      {
        id: 'mixed-2d-real',
        label: '2D characters in real places',
        words: '2D cartoon characters in live-action places',
      },
      {
        id: 'mixed-paper-3d',
        label: 'Paper characters in 3D sets',
        words: 'paper cut-out characters in 3D miniature sets',
      },
    ],
  },
];

export const animationType = (id: string) =>
  ANIMATION_TYPES.find((t) => t.id === id) ?? ANIMATION_TYPES[0]!;
