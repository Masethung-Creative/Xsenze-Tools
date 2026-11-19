import type { TOC } from '@ember/component/template-only';
import XzButton from 'xsenze-tools/components/xz/button';
import XzGrid from 'xsenze-tools/components/xz/grid';
import { IconSvg } from 'xsenze-tools/components/icon';
import type Playback from 'xsenze-tools/components/tools/media/playback';

const PlayIcon = <template><IconSvg @name="play" /></template>;
const PauseIcon = <template><IconSvg @name="pause" /></template>;
const StopIcon = <template><IconSvg @name="square" /></template>;
const LoopIcon = <template><IconSvg @name="repeat" /></template>;

const off = (on: boolean | undefined) => !on;

/** The transport footer: any `before` cells, Loop, Play or Pause, Stop, then any extra cells. */
const Transport: TOC<{
  Args: { playback: Playback; ready?: boolean };
  Blocks: { default: []; before: [] };
}> = <template>
  <XzGrid class="media-transport">
    {{yield to="before"}}
    <XzButton
      class="media-loop"
      @text="Loop"
      @icon={{LoopIcon}}
      @selected={{@playback.looping}}
      @disabled={{off @ready}}
      @onClick={{@playback.toggleLoop}}
      aria-pressed={{if @playback.looping "true" "false"}}
    />
    <XzButton
      class="media-play"
      @kind="primary"
      @text={{if @playback.playing "Pause" "Play"}}
      @icon={{if @playback.playing PauseIcon PlayIcon}}
      @disabled={{off @ready}}
      @onClick={{@playback.toggle}}
    />
    <XzButton
      class="media-stop"
      @text="Stop"
      @icon={{StopIcon}}
      @disabled={{off @playback.active}}
      @onClick={{@playback.stop}}
    />
    {{yield}}
  </XzGrid>
</template>;

export default Transport;
