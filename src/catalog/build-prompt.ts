/**
 * 从 Widget Catalog 自动生成 AI System Prompt 文本
 *
 * 输出纯文本，可直接嵌入 CF Worker 的 System Prompt。
 * 此函数放在前端方便跟 catalog 同步维护，Worker 接入独立处理。
 * 未被前端调用时 tree-shaking 会去除。
 */

import { z } from 'zod';
import { WIDGET_CATALOG, WIDGET_TYPES } from './widget-catalog';

/**
 * 生成 AI 可用的 Widget 描述文本。
 */
export function buildWidgetPrompt(): string {
  const lines: string[] = ['## Available Widgets', ''];

  for (const type of WIDGET_TYPES) {
    const entry = WIDGET_CATALOG[type];
    lines.push(`### ${type}`);
    lines.push(entry.description);
    lines.push(`Parameters: ${schemaToParamText(entry.schema)}`);
    lines.push(`Examples: ${entry.examples.join(' | ')}`);
    lines.push('');
  }

  lines.push('## Output Format');
  lines.push('Return widgetState as a JSON object: { "type": "<widget_type>", ...params }');
  lines.push('Only use widget types listed above. Unknown types will be rejected.');

  return lines.join('\n');
}

// ── 内部：Zod schema → 人类可读参数描述 ──

function schemaToParamText(schema: z.ZodObject<z.ZodRawShape>): string {
  const shape = schema.shape;
  const parts: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    // 跳过 type 字段（AI 通过 widget 名称知道 type）
    if (key === 'type') continue;

    const desc = describeField(field as z.ZodType);
    parts.push(`${key} ${desc}`);
  }

  return parts.join(', ') || '(none)';
}

function describeField(field: z.ZodType): string {
  const zodDef = (field as unknown as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
  const typeName = zodDef?.type as string | undefined;

  switch (typeName) {
    case 'string':
      return '(string, required)';

    case 'boolean':
      return '(boolean, required)';

    case 'enum': {
      const options = (field as z.ZodEnum<[string, ...string[]]>).options;
      return `(${options.join('|')}, required)`;
    }

    case 'literal':
      return `(literal: ${String((field as z.ZodLiteral<unknown>).value)})`;

    case 'array': {
      const el = (field as z.ZodArray<z.ZodType>).element;
      const inner = describeFieldSimple(el);
      return `(${inner}[], required)`;
    }

    case 'optional': {
      const inner = (field as z.ZodOptional<z.ZodType>).unwrap();
      const innerDesc = describeFieldSimple(inner);
      return `(${innerDesc}, optional)`;
    }

    case 'default': {
      const defValue = zodDef?.defaultValue;
      const innerType = zodDef?.innerType as string | undefined;
      return `(${innerType || 'unknown'}, optional, default: ${JSON.stringify(defValue)})`;
    }

    default:
      return '(unknown)';
  }
}

/** 简化版：只返回类型名，不带 required/optional */
function describeFieldSimple(field: z.ZodType): string {
  const zodDef = (field as unknown as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
  const typeName = zodDef?.type as string | undefined;

  switch (typeName) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'enum': {
      const options = (field as z.ZodEnum<[string, ...string[]]>).options;
      return options.join('|');
    }
    case 'literal':
      return String((field as z.ZodLiteral<unknown>).value);
    case 'array': {
      const el = (field as z.ZodArray<z.ZodType>).element;
      return `${describeFieldSimple(el)}[]`;
    }
    default:
      return 'unknown';
  }
}
