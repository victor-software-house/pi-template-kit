import { Liquid, type TagToken, type Template, type TopLevelToken } from 'liquidjs';

export function registerXmlTag(engine: Liquid): void {
  engine.registerTag('xml', {
    parse(this: XmlTagInstance, token: TagToken, remainTokens: TopLevelToken[]) {
      const args = token.args.trim();
      const match = args.match(/^["']([^"']+)["']$/);
      if (!match?.[1]) {
        throw new Error(`{% xml %} expects a single quoted tag name, got: ${args}`);
      }

      this.tag = match[1];
      this.tpl = [];

      const stream = this.liquid.parser
        .parseStream(remainTokens)
        .on('tag:endxml', () => stream.stop())
        .on('template', (tpl: TopLevelToken) => this.tpl.push(tpl))
        .on('end', () => {
          throw new Error('{% xml %} block was not closed with {% endxml %}');
        });
      stream.start();
    },

    *render(this: XmlTagInstance, ctx: unknown, emitter: { write(value: string): void }): Generator<unknown, void, unknown> {
      const tag = this.tag;
      if (!tag) return;
      const inner = (yield this.liquid.renderer.renderTemplates(this.tpl as unknown as Template[], ctx as never)) as string;
      if (!inner.trim()) return;
      emitter.write(`<${tag}>\n${inner.replace(/^\n+|\n+$/g, '')}\n</${tag}>\n`);
    },
  } as never);
}

interface XmlTagInstance {
  tag?: string;
  tpl: TopLevelToken[];
  liquid: Liquid;
}
