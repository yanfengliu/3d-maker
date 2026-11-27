import { parseRecipe, type Recipe } from './recipe';

const paint: Record<string, string> = {
  black: '#252a2c', white: '#f4f4ed', cream: '#e8e4cf', ivory: '#f4edd9', graphite: '#3c4348',
  gray: '#909797', grey: '#909797', silver: '#bbc3c9', charcoal: '#343b40', navy: '#2d4467',
  blue: '#4977c4', cyan: '#54cbdd', teal: '#379a93', mint: '#99d3b5', green: '#5e9f69',
  sage: '#91a68c', olive: '#839152', 'forest green': '#396a4e', yellow: '#efb634', gold: '#d8a74c',
  orange: '#dc8745', red: '#cc5448', rust: '#ba7052', pink: '#dd92ae', purple: '#946faf',
  violet: '#9a82cd', brown: '#906c55', tan: '#ccb18a', sand: '#d7c9a8',
};

const examples = 'Try “make it teal with cream accents”, “scale 1.2”, or “details off”.';

export function commandColor(value: string): string | undefined {
  return /^#[a-f\d]{6}$/.test(value) ? value : Object.hasOwn(paint, value) ? paint[value] : undefined;
}

export function commandName(command: string) {
  const rename = /^(?:rename|name|call)(?:\s+(?:it|this|the asset))?(?:\s+to)?\s+(.+)$/i.exec(command);
  return rename?.[1]?.replace(/^(?:(["'])(.*)\1|\u201c(.*)\u201d|\u2018(.*)\u2019)$/, '$2$3$4');
}

function editClause(recipe: Recipe, clause: string): void {
  const command = clause.trim().replace(/^please\s+/i, '').replace(/[.!]$/, '');
  const name = commandName(command);
  if (name !== undefined) {
    recipe.name = name;
    return;
  }
  const value = command.toLowerCase().replace(/^(?:make|set|paint|repaint|color|turn|change)\s+/, '').replace(/^(?:it|the)\s+/, '');
  const quality = /^(?:quality(?:\s+to)?\s+)?(hd|high definition|high-definition|standard)(?:\s+quality)?$/.exec(value);
  if (quality) {
    recipe.quality = quality[1] === 'standard' ? 'standard' : 'hd';
    return;
  }
  const size = /^(scale|size|proportion|width)(?:\s+(?:to|at|of))?\s*[:=]?\s*(\d*\.?\d+)(%|x)?$/.exec(value);
  if (size?.[2]) {
    const field = size[1] === 'scale' || size[1] === 'size' ? 'scale' : 'proportion';
    recipe[field] = Number(size[2]) / (size[3] === '%' ? 100 : 1);
    return;
  }
  const resize = /^(?:(\d+(?:\.\d+)?)%\s+)?(bigger|larger|smaller|wider|narrower)$/.exec(value);
  if (resize) {
    const field = resize[2] === 'wider' || resize[2] === 'narrower' ? 'proportion' : 'scale';
    const sign = resize[2] === 'smaller' || resize[2] === 'narrower' ? -1 : 1;
    recipe[field] = Number((recipe[field] * (1 + sign * Number(resize[1] ?? 10) / 100)).toFixed(3));
    return;
  }
  if (/^(?:details?\s+(?:on|off)|(?:add|enable|show|remove|disable|hide|no)\s+details?)$/.test(value)) {
    recipe.detail = /\bon$|^(?:add|enable|show)\b/.test(value);
    return;
  }
  const prefix = /^(body|primary|main|trim|accents?)(?: colou?r)?(?:\s+(?:to\s+)?|\s*[:=]\s*)(.+)$/.exec(value);
  const suffix = /^(.+)\s+(accents?|trim|body|primary)$/.exec(value);
  const colorName = prefix?.[2] ?? suffix?.[1] ?? value;
  const color = commandColor(colorName);
  if (color) {
    const target = prefix?.[1] ?? suffix?.[2] ?? 'body';
    recipe[/^(?:accents?|trim)$/.test(target) ? 'accent' : 'primary'] = color;
    return;
  }
  throw new Error(`Local commands could not apply “${clause}”. ${examples}`);
}

/** A command must be understood in full before its recipe can be used. */
export function commandClauses(text: string): string[] {
  const clauses: string[] = [];
  // Keep separators within quoted asset names, including “Search and Rescue”.
  const separators = /"[^"]*"|'[^']*'|\u201c[^\u201d]*\u201d|\u2018[^\u2019]*\u2019|[,;]|\s+(?:and then|and|then|with)\s+/gi;
  let start = 0;
  for (const match of text.matchAll(separators)) {
    if (/^["'\u201c\u2018]/.test(match[0])) continue;
    const clause = text.slice(start, match.index).trim();
    if (clause) clauses.push(clause);
    start = match.index + match[0].length;
  }
  const last = text.slice(start).trim();
  if (!last) throw new Error(examples);
  return [...clauses, last];
}

export function applyLocalCommand(recipe: Recipe, text: string): Recipe {
  const next = { ...recipe };
  for (const clause of commandClauses(text)) editClause(next, clause);
  return parseRecipe(next);
}
