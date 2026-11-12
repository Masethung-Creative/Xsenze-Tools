import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import Icon from 'xsenze-tools/components/icon';
import { giveFile } from 'xsenze-tools/lib/handoff';
import { allTools, toolMatches, toolsForFile } from 'xsenze-tools/lib/tools';
import type { Tool } from 'xsenze-tools/lib/tools';
import './omnibox.css';

/**
 * Home-page entry point: type to search tools, drop or
 * choose a file to be routed to a tool that can open it, paste from the
 * clipboard, or jump to a random tool.
 */
export default class Omnibox extends Component {
  @service declare router: RouterService;

  @tracked query = '';
  @tracked dragging = false;
  @tracked message = '';
  @tracked fileChoices: Tool[] = [];
  private pendingFile: File | undefined;

  get matches(): Tool[] {
    const q = this.query.trim();
    return q ? allTools.filter((t) => toolMatches(t, q)).slice(0, 6) : [];
  }

  get showResults() {
    return this.query.trim().length > 0;
  }

  open = (tool: Tool) => {
    if (this.pendingFile) giveFile(this.pendingFile);
    void this.router.transitionTo('tools.tool', tool.id);
  };

  updateQuery = (e: Event) => {
    this.query = (e.target as HTMLInputElement).value;
    this.message = '';
    this.fileChoices = [];
  };

  onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && this.matches[0]) this.open(this.matches[0]);
    if (e.key === 'Escape') this.query = '';
  };

  handleFile(file: File) {
    this.query = '';
    const tools = toolsForFile(file);
    this.pendingFile = file;
    if (tools.length === 1 && tools[0]) {
      this.open(tools[0]);
    } else if (tools.length > 1) {
      this.fileChoices = tools;
      this.message = `Open “${file.name}” with:`;
    } else {
      this.fileChoices = [];
      this.message = `No tool can open “${file.name}” yet. More are on the way.`;
    }
  }

  chooseFile = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  };

  dragOver = (e: DragEvent) => {
    e.preventDefault();
    this.dragging = true;
  };

  dragLeave = () => (this.dragging = false);

  drop = (e: DragEvent) => {
    e.preventDefault();
    this.dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  };

  paste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t !== 'text/plain');
        if (type) {
          const blob = await item.getType(type);
          this.handleFile(
            new File([blob], `clipboard.${type.split('/')[1]}`, { type }),
          );
          return;
        }
      }
      this.query = (await navigator.clipboard.readText()).trim();
    } catch {
      this.message =
        'Clipboard access was blocked. Press Ctrl+V in the box instead.';
    }
  };

  pasteEvent = (e: ClipboardEvent) => {
    const file = e.clipboardData?.files[0];
    if (file) {
      e.preventDefault();
      this.handleFile(file);
    }
  };

  lucky = () => {
    const tool = allTools[Math.floor(Math.random() * allTools.length)];
    if (tool) this.open(tool);
    else this.message = 'No tools yet. The first audio tool is coming soon!';
  };

  <template>
    <div
      class="omnibox {{if this.dragging 'omnibox--drag'}}"
      {{on "dragover" this.dragOver}}
      {{on "dragleave" this.dragLeave}}
      {{on "drop" this.drop}}
    >
      <label class="omnibox__field">
        <span class="sr-only">Search tools, or drop a file</span>
        <input
          type="text"
          placeholder={{if
            this.dragging
            "Drop it!"
            "Drop a file, search for a tool, paste in text"
          }}
          value={{this.query}}
          autocomplete="off"
          {{on "input" this.updateQuery}}
          {{on "keydown" this.onKey}}
          {{on "paste" this.pasteEvent}}
        />
      </label>

      {{#if this.showResults}}
        <ul class="omnibox__results" aria-label="Matching tools">
          {{#each this.matches as |tool|}}
            <li>
              <button type="button" {{on "click" (fn this.open tool)}}>
                <Icon @name={{tool.icon}} />
                <strong>{{tool.name}}</strong>
                <span>{{tool.description}}</span>
              </button>
            </li>
          {{else}}
            <li class="omnibox__none">No tools match “{{this.query}}” yet.</li>
          {{/each}}
        </ul>
      {{/if}}

      <div class="omnibox__actions">
        <label class="omnibox__action">
          <Icon @name="upload" />
          Choose a file
          <input type="file" class="sr-only" {{on "change" this.chooseFile}} />
        </label>
        <button type="button" class="omnibox__action" {{on "click" this.paste}}>
          <Icon @name="clipboard-paste" />
          Paste from clipboard
        </button>
        <button type="button" class="omnibox__action" {{on "click" this.lucky}}>
          <Icon @name="dices" />
          I'm feeling lucky
        </button>
      </div>
    </div>

    {{#if this.message}}
      <div class="omnibox__message" role="status">
        <p>{{this.message}}</p>
        {{#each this.fileChoices as |tool|}}
          <button type="button" class="chip" {{on "click" (fn this.open tool)}}>
            <Icon @name={{tool.icon}} />
            {{tool.name}}
          </button>
        {{/each}}
      </div>
    {{/if}}
  </template>
}
