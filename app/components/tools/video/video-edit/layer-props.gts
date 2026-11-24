import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { IconSvg } from 'xsenze-tools/components/icon';
import XzButton from 'xsenze-tools/components/xz/button';
import XzColourWell from 'xsenze-tools/components/xz/colour-well';
import XzDecimalField from 'xsenze-tools/components/xz/decimal-field';
import XzGrid from 'xsenze-tools/components/xz/grid';
import XzHeading from 'xsenze-tools/components/xz/heading';
import XzRow from 'xsenze-tools/components/xz/row';
import XzRows from 'xsenze-tools/components/xz/rows';
import XzSegmented from 'xsenze-tools/components/xz/segmented';
import XzSwitch from 'xsenze-tools/components/xz/switch';
import XzTextArea from 'xsenze-tools/components/xz/text-area';
import PropSlider from 'xsenze-tools/components/tools/video/video-edit/prop-slider';
import { hex, parseHex, type Rgb } from 'xsenze-tools/lib/xz/colour';
import { edgeColour } from 'xsenze-tools/lib/video/edit/chroma';
import {
  ANIMS,
  FONTS,
  SHAPES,
  layerSize,
} from 'xsenze-tools/lib/video/edit/layers';
import {
  minimumPiece,
  type Align,
  type Anim,
  type ChromaKey,
  type Clip,
  type FontId,
  type Layer,
  type ShapeKind,
  type TextStyle,
} from 'xsenze-tools/lib/video/edit/timeline';

export type LayerTab = 'edit' | 'style' | 'anim' | 'audio';

const icon = (name: string) => <template><IconSvg @name={{name}} /></template>;
const UpIcon = icon('bring-to-front');
const DownIcon = icon('send-to-back');
const BoldIcon = icon('bold');
const ItalicIcon = icon('italic');

const FONT_IDS = Object.keys(FONTS) as FontId[];
const FONT_LABELS = FONT_IDS.map((id) => FONTS[id].label);
const SHAPE_IDS = Object.keys(SHAPES) as ShapeKind[];
const SHAPE_LABELS = SHAPE_IDS.map((id) => SHAPES[id]);
const ALIGNS: Align[] = ['left', 'center', 'right'];
const ALIGN_LABELS = ['Left', 'Centre', 'Right'];
const ALIGN_ICONS = [
  'text-align-start',
  'text-align-center',
  'text-align-end',
].map(icon);
const ANIMS_IN = Object.keys(ANIMS) as Anim[];
const ANIMS_PLAIN: Anim[] = ANIMS_IN.filter((a) => a !== 'typewriter');
const ANIM_IN_LABELS = ANIMS_IN.map((a) => ANIMS[a]);
const ANIM_PLAIN_LABELS = ANIMS_PLAIN.map((a) => ANIMS[a]);

/** The nine places on the frame, as shares of its width and height for the middle. */
const PLACES = [
  ['Top left', 'arrow-up-left', 0, 0],
  ['Top', 'arrow-up', 0.5, 0],
  ['Top right', 'arrow-up-right', 1, 0],
  ['Left', 'arrow-left', 0, 0.5],
  ['Middle', 'circle-dot', 0.5, 0.5],
  ['Right', 'arrow-right', 1, 0.5],
  ['Bottom left', 'arrow-down-left', 0, 1],
  ['Bottom', 'arrow-down', 0.5, 1],
  ['Bottom right', 'arrow-down-right', 1, 1],
] as const;
const PLACE_LABELS = PLACES.map((p) => p[0]);
const PLACE_ICONS = PLACES.map((p) => icon(p[1]));
/** Room left between an item and the frame's edge, as a share. */
const margin = 0.05;

const percent = (value: number) => `${Math.round(value * 100)}%`;
const degrees = (value: number) => `${Math.round(value)}°`;
const seconds = (value: number) => `${value.toFixed(1)} s`;

interface LayerPropsSignature {
  Args: {
    layer: Layer;
    clip: Clip | undefined;
    tab: LayerTab;
    /** Width over height of the frame. */
    frameAspect: number;
    /** Where it is in the drawing order, and how many there are. */
    stackIndex: number;
    stackCount: number;
    /** A change; `live` keeps one history step for a drag or typing. */
    onChange: (change: Partial<Layer>, live: boolean) => void;
    /** Typing or a drag has ended. */
    onEndLive: () => void;
    onStack: (by: number) => void;
  };
}

/** The selected text or overlay's settings, one tab at a time. */
export default class LayerProps extends Component<LayerPropsSignature> {
  get layer() {
    return this.args.layer;
  }

  get style() {
    return this.layer.style;
  }

  get isText() {
    return this.layer.kind === 'text';
  }

  get isShape() {
    return this.layer.kind === 'shape';
  }

  get isVideo() {
    return this.layer.kind === 'video';
  }

  get isMedia() {
    return this.layer.kind === 'picture' || this.layer.kind === 'video';
  }

  get isEmoji() {
    return this.layer.kind === 'emoji';
  }

  get hasCorners() {
    return this.isMedia || (this.isShape && this.layer.shape === 'rect');
  }

  get tabIsEdit() {
    return this.args.tab === 'edit';
  }

  get tabIsStyle() {
    return this.args.tab === 'style';
  }

  get tabIsAnim() {
    return this.args.tab === 'anim';
  }

  get clipLength() {
    return this.args.clip?.duration ?? 0;
  }

  get lengthMax() {
    return this.isVideo
      ? Math.max(minimumPiece, this.clipLength - this.layer.in)
      : 3600;
  }

  get inMax() {
    return Math.max(0, this.clipLength - minimumPiece);
  }

  get cannotRaise() {
    return this.args.stackIndex >= this.args.stackCount - 1;
  }

  get cannotLower() {
    return this.args.stackIndex <= 0;
  }

  // ----- changes -----

  #put(change: Partial<Layer>, live = false) {
    this.args.onChange(change, live);
  }

  // ----- green screen -----

  get keyRgb(): Rgb {
    return parseHex(this.layer.key.colour) ?? [0, 177, 64];
  }

  get canPickOnScreen() {
    return typeof window !== 'undefined' && 'EyeDropper' in window;
  }

  #setKey(change: Partial<ChromaKey>, live = false) {
    this.#put({ key: { ...this.layer.key, ...change } }, live);
  }

  /** The colour around the picture's edge, from its first thumbnail. */
  async #edge(): Promise<string | null> {
    const url = this.args.clip?.frames[0];
    if (!url) return null;
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      return null;
    }
    return edgeColour(image, image.naturalWidth, image.naturalHeight);
  }

  /** Turned on, it takes out the colour around the edge: usually the screen. */
  setKeyOn = async (on: boolean) => {
    const colour = on ? await this.#edge() : null;
    this.#setKey(colour ? { on, colour } : { on });
  };

  keyFromEdge = async () => {
    const colour = await this.#edge();
    if (colour) this.#setKey({ colour });
  };

  pickOnScreen = async () => {
    const Dropper = (
      window as unknown as {
        EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    if (!Dropper) return;
    try {
      const { sRGBHex } = await new Dropper().open();
      const rgb = parseHex(sRGBHex);
      if (rgb) this.#setKey({ colour: hex(rgb) });
    } catch {
      // the pick was called off
    }
  };

  setKeyColour = (colour: Rgb) => this.#setKey({ colour: hex(colour) });
  setKeyRange = (range: number, dragging: boolean) =>
    this.#setKey({ range }, dragging);
  setKeySoft = (soft: number, dragging: boolean) =>
    this.#setKey({ soft }, dragging);

  #setStyle(change: Partial<TextStyle>, live = false) {
    this.#put({ style: { ...this.style, ...change } }, live);
  }

  setText = (text: string) => this.#put({ text }, true);
  setStart = (start: number) => this.#put({ start: Math.max(0, start) });
  setLength = (length: number) =>
    this.#put({
      length: Math.min(this.lengthMax, Math.max(minimumPiece, length)),
    });
  setIn = (inPoint: number) => {
    const at = Math.min(this.inMax, Math.max(0, inPoint));
    this.#put({
      in: at,
      length: Math.min(this.layer.length, this.clipLength - at),
    });
  };

  raise = () => this.args.onStack(1);
  lower = () => this.args.onStack(-1);

  get fontIndex() {
    return FONT_IDS.indexOf(this.style.font);
  }

  pickFont = (i: number) => {
    const font = FONT_IDS[i];
    if (font) this.#setStyle({ font });
  };

  setSize = (size: number, dragging: boolean) =>
    this.#setStyle({ size }, dragging);

  get textRgb(): Rgb {
    return parseHex(this.style.colour) ?? [255, 255, 255];
  }

  setTextColour = (colour: Rgb) => this.#setStyle({ colour: hex(colour) });
  toggleBold = () => this.#setStyle({ bold: !this.style.bold });
  toggleItalic = () => this.#setStyle({ italic: !this.style.italic });

  get alignIndex() {
    return ALIGNS.indexOf(this.style.align);
  }

  pickAlign = (i: number) => {
    const align = ALIGNS[i];
    if (align) this.#setStyle({ align });
  };

  setOutline = (outline: boolean) => this.#setStyle({ outline });
  setBox = (box: boolean) => this.#setStyle({ box });
  setBoxOpacity = (boxOpacity: number, dragging: boolean) =>
    this.#setStyle({ boxOpacity }, dragging);

  get boxRgb(): Rgb {
    return parseHex(this.style.boxColour) ?? [0, 0, 0];
  }

  setBoxColour = (colour: Rgb) => this.#setStyle({ boxColour: hex(colour) });

  get shapeIndex() {
    return SHAPE_IDS.indexOf(this.layer.shape);
  }

  pickShape = (i: number) => {
    const shape = SHAPE_IDS[i];
    if (shape) this.#put({ shape });
  };

  get fillRgb(): Rgb {
    return parseHex(this.layer.colour) ?? [255, 138, 0];
  }

  setFill = (colour: Rgb) => this.#put({ colour: hex(colour) });

  setWidth = (w: number, dragging: boolean) => this.#put({ w }, dragging);
  setHeight = (h: number, dragging: boolean) => this.#put({ h }, dragging);
  setCorner = (corner: number, dragging: boolean) =>
    this.#put({ corner }, dragging);
  setOpacity = (opacity: number, dragging: boolean) =>
    this.#put({ opacity }, dragging);
  setAngle = (angle: number, dragging: boolean) =>
    this.#put({ angle }, dragging);

  /** The layer's size as shares of the frame, for placing it by an edge. */
  get #share() {
    const H = 1000;
    const W = H * this.args.frameAspect;
    const clip = this.args.clip;
    const aspect = clip?.width ? clip.width / clip.height : 1;
    const { w, h } = layerSize(this.layer, W, H, aspect);
    return { w: w / W, h: h / H };
  }

  /** The place it sits in now, when it sits in one of the nine. */
  get placeIndex() {
    const { w, h } = this.#share;
    return PLACES.findIndex(([, , px, py]) => {
      const x = this.#placeX(px, w);
      const y = this.#placeY(py, h);
      return (
        Math.abs(x - this.layer.x) < 0.002 && Math.abs(y - this.layer.y) < 0.002
      );
    });
  }

  #placeX(px: number, w: number) {
    if (px === 0.5) return 0.5;
    return px === 0 ? margin + w / 2 : 1 - margin - w / 2;
  }

  #placeY(py: number, h: number) {
    if (py === 0.5) return 0.5;
    return py === 0 ? margin + h / 2 : 1 - margin - h / 2;
  }

  pickPlace = (i: number) => {
    const place = PLACES[i];
    if (!place) return;
    const { w, h } = this.#share;
    this.#put({ x: this.#placeX(place[2], w), y: this.#placeY(place[3], h) });
  };

  get animInIndex() {
    return this.isText
      ? ANIMS_IN.indexOf(this.layer.animIn)
      : ANIMS_PLAIN.indexOf(this.layer.animIn);
  }

  get animOutIndex() {
    return ANIMS_PLAIN.indexOf(this.layer.animOut);
  }

  get animInLabels() {
    return this.isText ? ANIM_IN_LABELS : ANIM_PLAIN_LABELS;
  }

  pickAnimIn = (i: number) => {
    const anim = (this.isText ? ANIMS_IN : ANIMS_PLAIN)[i];
    if (!anim) return;
    // typing needs longer than a fade to read
    const slow = anim === 'typewriter' && this.layer.animSeconds < 1;
    this.#put({ animIn: anim, ...(slow ? { animSeconds: 1.5 } : {}) });
  };

  pickAnimOut = (i: number) => {
    const anim = ANIMS_PLAIN[i];
    if (anim) this.#put({ animOut: anim });
  };

  setAnimSeconds = (animSeconds: number, dragging: boolean) =>
    this.#put({ animSeconds }, dragging);

  setVolume = (volume: number, dragging: boolean) =>
    this.#put({ volume }, dragging);

  get soundOn() {
    return !this.layer.muted;
  }

  setSoundOn = (on: boolean) => this.#put({ muted: !on });

  <template>
    {{#if this.tabIsEdit}}
      <XzRows @framed={{true}}>
        {{#if this.isText}}
          <XzHeading @text="Text" />
          <div class="ve-text-input">
            <XzTextArea
              @value={{this.layer.text}}
              @height={{84}}
              @placeholder="Type the title"
              @onChange={{this.setText}}
              aria-label="Text"
              {{on "blur" @onEndLive}}
            />
          </div>
        {{/if}}
        <XzRow @title="Starts at" @form="flush" as |titleId|>
          <XzDecimalField
            class="ve-layer-start"
            @value={{this.layer.start}}
            @unit="s"
            @labelledBy={{titleId}}
            @onChange={{this.setStart}}
          />
        </XzRow>
        <XzRow @title="Lasts" @form="flush" as |titleId|>
          <XzDecimalField
            class="ve-layer-length"
            @value={{this.layer.length}}
            @min={{0.1}}
            @max={{this.lengthMax}}
            @unit="s"
            @labelledBy={{titleId}}
            @onChange={{this.setLength}}
          />
        </XzRow>
        {{#if this.isVideo}}
          <XzRow
            @title="From"
            @detail="Where in the video it starts"
            @form="flush"
            as |titleId|
          >
            <XzDecimalField
              class="ve-layer-in"
              @value={{this.layer.in}}
              @max={{this.inMax}}
              @unit="s"
              @labelledBy={{titleId}}
              @onChange={{this.setIn}}
            />
          </XzRow>
        {{/if}}
        <XzHeading @text="Order" />
        <XzGrid>
          <XzButton
            class="ve-layer-raise"
            @text="Forward"
            @label="Bring forward"
            @icon={{UpIcon}}
            @disabled={{this.cannotRaise}}
            @onClick={{this.raise}}
          />
          <XzButton
            class="ve-layer-lower"
            @text="Back"
            @label="Send back"
            @icon={{DownIcon}}
            @disabled={{this.cannotLower}}
            @onClick={{this.lower}}
          />
        </XzGrid>
      </XzRows>
      <p class="ve-hint">Drag it on the preview to move it; drag its corner to
        size it.</p>
    {{else if this.tabIsStyle}}
      <XzRows @framed={{true}}>
        {{#if this.isText}}
          <XzHeading @text="Font" />
          <XzSegmented
            class="ve-font"
            @items={{FONT_LABELS}}
            @selected={{this.fontIndex}}
            @columns={{3}}
            @onChange={{this.pickFont}}
          />
          <PropSlider
            class="ve-text-size"
            @label="Size"
            @value={{this.style.size}}
            @min={{0.02}}
            @max={{0.3}}
            @step={{0.001}}
            @nudge={{0.005}}
            @readout={{percent}}
            @onChange={{this.setSize}}
          />
          <XzColourWell
            class="ve-text-colour"
            @label="Colour"
            @colour={{this.textRgb}}
            @onChange={{this.setTextColour}}
          />
          <XzGrid>
            <XzButton
              class="ve-bold"
              @label="Bold"
              @icon={{BoldIcon}}
              @kind="segment"
              @selected={{this.style.bold}}
              @onClick={{this.toggleBold}}
            />
            <XzButton
              class="ve-italic"
              @label="Italic"
              @icon={{ItalicIcon}}
              @kind="segment"
              @selected={{this.style.italic}}
              @onClick={{this.toggleItalic}}
            />
          </XzGrid>
          <XzSegmented
            class="ve-align"
            @items={{ALIGN_LABELS}}
            @icons={{ALIGN_ICONS}}
            @selected={{this.alignIndex}}
            @onChange={{this.pickAlign}}
          />
          <XzRow
            @title="Outline"
            @detail="A dark edge, so it reads on any picture"
          >
            <XzSwitch
              class="ve-outline"
              @on={{this.style.outline}}
              @onChange={{this.setOutline}}
              aria-label="Outline"
            />
          </XzRow>
          <PropSlider
            class="ve-text-box"
            @label="Background"
            @value={{this.style.boxOpacity}}
            @step={{0.01}}
            @nudge={{0.05}}
            @readout={{percent}}
            @onChange={{this.setBoxOpacity}}
            @on={{this.style.box}}
            @onToggle={{this.setBox}}
            @toggleLabel="Background on"
          />
          {{#if this.style.box}}
            <XzColourWell
              class="ve-text-box-colour"
              @label="Background colour"
              @colour={{this.boxRgb}}
              @onChange={{this.setBoxColour}}
            />
          {{/if}}
        {{else if this.isShape}}
          <XzHeading @text="Shape" />
          <XzSegmented
            class="ve-shape-kind"
            @items={{SHAPE_LABELS}}
            @selected={{this.shapeIndex}}
            @onChange={{this.pickShape}}
          />
          <XzColourWell
            class="ve-fill"
            @label="Colour"
            @colour={{this.fillRgb}}
            @onChange={{this.setFill}}
          />
          <PropSlider
            class="ve-width"
            @label="Width"
            @value={{this.layer.w}}
            @min={{0.02}}
            @max={{1}}
            @step={{0.005}}
            @nudge={{0.01}}
            @readout={{percent}}
            @onChange={{this.setWidth}}
          />
          <PropSlider
            class="ve-height"
            @label="Height"
            @value={{this.layer.h}}
            @min={{0.02}}
            @max={{1}}
            @step={{0.005}}
            @nudge={{0.01}}
            @readout={{percent}}
            @onChange={{this.setHeight}}
          />
        {{else}}
          <PropSlider
            class="ve-width"
            @label="Size"
            @value={{this.layer.w}}
            @min={{0.03}}
            @max={{1}}
            @step={{0.005}}
            @nudge={{0.01}}
            @readout={{percent}}
            @onChange={{this.setWidth}}
          />
        {{/if}}
        {{#if this.hasCorners}}
          <PropSlider
            class="ve-corner"
            @label="Round corners"
            @value={{this.layer.corner}}
            @max={{0.5}}
            @step={{0.01}}
            @nudge={{0.02}}
            @readout={{percent}}
            @onChange={{this.setCorner}}
          />
        {{/if}}
        <PropSlider
          class="ve-opacity"
          @label="Opacity"
          @value={{this.layer.opacity}}
          @step={{0.01}}
          @nudge={{0.05}}
          @readout={{percent}}
          @onChange={{this.setOpacity}}
        />
        <PropSlider
          class="ve-angle"
          @label="Turn"
          @value={{this.layer.angle}}
          @min={{-180}}
          @max={{180}}
          @step={{1}}
          @nudge={{5}}
          @readout={{degrees}}
          @onChange={{this.setAngle}}
        />
        <XzHeading @text="Place" />
        <XzSegmented
          class="ve-place"
          @items={{PLACE_LABELS}}
          @icons={{PLACE_ICONS}}
          @selected={{this.placeIndex}}
          @columns={{3}}
          @onChange={{this.pickPlace}}
        />
        {{#if this.isMedia}}
          <XzHeading @text="Green screen" />
          <XzRow
            @title="Take out a colour"
            @detail="For a green or blue screen behind"
          >
            <XzSwitch
              class="ve-key-on"
              @on={{this.layer.key.on}}
              @onChange={{this.setKeyOn}}
              aria-label="Take out a colour"
            />
          </XzRow>
          {{#if this.layer.key.on}}
            <XzColourWell
              class="ve-key-colour"
              @label="Colour"
              @colour={{this.keyRgb}}
              @onChange={{this.setKeyColour}}
            />
            <XzGrid>
              <XzButton
                class="ve-key-edge"
                @text="From the edge"
                @onClick={{this.keyFromEdge}}
              />
              {{#if this.canPickOnScreen}}
                <XzButton
                  class="ve-key-pick"
                  @text="Pick on screen"
                  @onClick={{this.pickOnScreen}}
                />
              {{/if}}
            </XzGrid>
            <PropSlider
              class="ve-key-range"
              @label="How much"
              @value={{this.layer.key.range}}
              @step={{0.01}}
              @nudge={{0.05}}
              @readout={{percent}}
              @onChange={{this.setKeyRange}}
            />
            <PropSlider
              class="ve-key-soft"
              @label="Soft edge"
              @value={{this.layer.key.soft}}
              @step={{0.01}}
              @nudge={{0.05}}
              @readout={{percent}}
              @onChange={{this.setKeySoft}}
            />
          {{/if}}
        {{/if}}
      </XzRows>
    {{else if this.tabIsAnim}}
      <XzRows @framed={{true}}>
        <XzHeading @text="Comes in" />
        <XzSegmented
          class="ve-anim-in"
          @items={{this.animInLabels}}
          @selected={{this.animInIndex}}
          @columns={{3}}
          @onChange={{this.pickAnimIn}}
        />
        <XzHeading @text="Goes out" />
        <XzSegmented
          class="ve-anim-out"
          @items={{ANIM_PLAIN_LABELS}}
          @selected={{this.animOutIndex}}
          @columns={{3}}
          @onChange={{this.pickAnimOut}}
        />
        <PropSlider
          class="ve-anim-seconds"
          @label="Takes"
          @value={{this.layer.animSeconds}}
          @min={{0.1}}
          @max={{3}}
          @step={{0.1}}
          @nudge={{0.1}}
          @readout={{seconds}}
          @onChange={{this.setAnimSeconds}}
        />
      </XzRows>
      <p class="ve-hint">Each lasts at most half of the item's time.</p>
    {{else}}
      <XzRows @framed={{true}}>
        <PropSlider
          class="ve-layer-volume"
          @label="Volume"
          @value={{this.layer.volume}}
          @max={{2}}
          @step={{0.01}}
          @nudge={{0.05}}
          @readout={{percent}}
          @onChange={{this.setVolume}}
          @on={{this.soundOn}}
          @onToggle={{this.setSoundOn}}
          @toggleLabel="Sound on"
        />
      </XzRows>
      <p class="ve-hint">The small video's sound plays with the Video sound
        layer.</p>
    {{/if}}
  </template>
}
