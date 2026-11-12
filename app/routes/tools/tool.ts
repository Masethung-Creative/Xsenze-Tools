import Route from '@ember/routing/route';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import { findTool, categoryOf } from 'xsenze-tools/lib/tools';
import type { Tool, ToolCategory } from 'xsenze-tools/lib/tools';
import { loadToolComponent } from 'xsenze-tools/lib/tool-components';
import type { ToolComponent } from 'xsenze-tools/lib/tool-components';

export interface ToolModel {
  tool: Tool;
  category: ToolCategory | undefined;
  component: ToolComponent | undefined;
}

export default class ToolRoute extends Route {
  @service declare router: RouterService;

  async model(params: { tool_id: string }): Promise<ToolModel | undefined> {
    const tool = findTool(params.tool_id);
    if (!tool) {
      void this.router.replaceWith('not-found', `tools/${params.tool_id}`);
      return undefined;
    }
    return {
      tool,
      category: categoryOf(tool.id),
      component: await loadToolComponent(tool.id),
    };
  }
}
