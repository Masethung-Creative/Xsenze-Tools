import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import AssetsTab from 'xsenze-tools/components/tools/ai-studio/story-studio/assets-tab';
import BibleTab from 'xsenze-tools/components/tools/ai-studio/story-studio/bible-tab';
import ExportTab from 'xsenze-tools/components/tools/ai-studio/story-studio/export-tab';
import PlanTab from 'xsenze-tools/components/tools/ai-studio/story-studio/plan-tab';
import StoryTab from 'xsenze-tools/components/tools/ai-studio/story-studio/story-tab';
import { TAB } from 'xsenze-tools/components/tools/ai-studio/story-studio/tab-bar';
import type { ProjectStore } from 'xsenze-tools/lib/ai-studio/story/project-store';
import type { Project } from 'xsenze-tools/lib/ai-studio/story/types';

export interface ProjectViewSignature {
  Args: {
    project: Project;
    store: ProjectStore;
    onNew: () => void;
    onCopy: (project: Project) => void;
    onProjects: () => void;
    onOpenFile: () => void;
    onSaveFile: (project: Project) => void;
  };
}

/** An open project, one tab at a time: Plan, Story, Bible, Assets, Export. */
export default class ProjectView extends Component<ProjectViewSignature> {
  @tracked tab: number = TAB.plan;

  pickTab = (index: number) => (this.tab = index);

  get onPlan() {
    return this.tab === TAB.plan;
  }

  get onStory() {
    return this.tab === TAB.story;
  }

  get onBible() {
    return this.tab === TAB.bible;
  }

  get onAssets() {
    return this.tab === TAB.assets;
  }

  get onExport() {
    return this.tab === TAB.export;
  }

  <template>
    {{#if this.onStory}}
      <StoryTab
        @project={{@project}}
        @store={{@store}}
        @tab={{this.tab}}
        @onTab={{this.pickTab}}
      />
    {{else if this.onBible}}
      <BibleTab
        @project={{@project}}
        @store={{@store}}
        @tab={{this.tab}}
        @onTab={{this.pickTab}}
      />
    {{else if this.onAssets}}
      <AssetsTab
        @project={{@project}}
        @store={{@store}}
        @tab={{this.tab}}
        @onTab={{this.pickTab}}
      />
    {{else if this.onExport}}
      <ExportTab
        @project={{@project}}
        @tab={{this.tab}}
        @onTab={{this.pickTab}}
      />
    {{else}}
      <PlanTab
        @project={{@project}}
        @store={{@store}}
        @tab={{this.tab}}
        @onTab={{this.pickTab}}
        @onNew={{@onNew}}
        @onCopy={{@onCopy}}
        @onProjects={{@onProjects}}
        @onOpenFile={{@onOpenFile}}
        @onSaveFile={{@onSaveFile}}
      />
    {{/if}}
  </template>
}
