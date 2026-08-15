/**
 * aiProviders.ts
 * Driver for Gemini and Mistral tool calling API interactions.
 */
import { GoogleGenAI } from '@google/genai';

export interface ToolTraceEntry {
  step: number;
  toolName: string;
  args: Record<string, any>;
  resultSummary: string;
  timestamp: string;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT' | 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export interface NLPExecutionResult {
  providerUsed: 'gemini' | 'mistral' | 'local_fallback';
  rawResponseText: string;
  toolTrace: ToolTraceEntry[];
  chartConfig?: {
    vizType: 'pizza' | 'beeswarm' | 'scatter' | 'heatmap';
    playerA: string;
    playerB?: string;
    playerC?: string;
    playerD?: string;
    xMetric?: string;
    yMetric?: string;
    selectedStats?: string[];
  };
  comparisonData?: any;
  departmentReports?: {
    attacking?: string;
    defensive?: string;
    passing?: string;
    verification?: string;
  };
}

// Tool definitions for LLM function calling
export const PLAYER_COMPARISON_TOOLS: ToolDeclaration[] = [
  {
    name: 'search_players',
    description: 'Search Premier League players in the dataset by single player name or team name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Clean single player name (e.g. "Amad Diallo") or team name. DO NOT pass full prompt sentences.' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_player_metrics',
    description: 'Retrieve detailed per-90 stats and percentile rankings for a single player.',
    parameters: {
      type: 'OBJECT',
      properties: {
        playerName: { type: 'STRING', description: 'Clean single player name (e.g. "Amad Diallo")' }
      },
      required: ['playerName']
    }
  },
  {
    name: 'compare_players',
    description: 'Compare up to 4 players head-to-head across key stats, percentile ranks, and department metrics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        playerA: { type: 'STRING', description: 'First player name (e.g. "Bruno Fernandes")' },
        playerB: { type: 'STRING', description: 'Second player name (e.g. "Martin Ødegaard")' },
        playerC: { type: 'STRING', description: 'Third player name (optional)' },
        playerD: { type: 'STRING', description: 'Fourth player name (optional)' }
      },
      required: ['playerA', 'playerB']
    }
  },
  {
    name: 'set_active_chart',
    description: 'Select and configure the dynamic chart visualization. You MUST always use the pizza chart visualization showing at least 10 differentiative characteristics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vizType: {
          type: 'STRING',
          enum: ['pizza'],
          description: 'Type of visualization to display (always use pizza)'
        },
        playerA: { type: 'STRING', description: 'Primary player name' },
        playerB: { type: 'STRING', description: 'Second player name (optional)' },
        playerC: { type: 'STRING', description: 'Third player name (optional)' },
        playerD: { type: 'STRING', description: 'Fourth player name (optional)' },
        xMetric: { type: 'STRING', description: 'Metric key for X axis in scatter plot' },
        yMetric: { type: 'STRING', description: 'Metric key for Y axis in scatter plot' },
        selectedStats: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'List of at least 10 metric keys with highest differentiative variance'
        }
      },
      required: ['vizType', 'playerA']
    }
  }
];

export function getGeminiApiKey(): string | null {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || null;
}

export function getMistralApiKey(): string | null {
  return import.meta.env.VITE_MISTRAL_API_KEY || import.meta.env.MISTRAL_API_KEY || null;
}

/**
 * Executes a query with Gemini 2.5 Flash tool calling
 */
export async function executeGeminiToolCalling(
  userQuery: string,
  toolExecutor: (name: string, args: Record<string, any>) => Promise<any>
): Promise<NLPExecutionResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API Key missing');
  }
  const client = new GoogleGenAI({ apiKey });
  const model = 'gemini-3.6-flash';
  const toolTrace: ToolTraceEntry[] = [];
  let chartConfig: NLPExecutionResult['chartConfig'] = undefined;
  let comparisonData: any = undefined;

  const geminiTools = [
    {
      functionDeclarations: PLAYER_COMPARISON_TOOLS.map(t => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: 'OBJECT',
          properties: Object.fromEntries(
            Object.entries(t.parameters.properties).map(([k, v]) => [
              k,
              {
                type: v.type.toUpperCase(),
                description: v.description,
                ...(v.enum ? { enum: v.enum } : {}),
                ...(v.items ? { items: { type: v.items.type.toUpperCase() } } : {})
              }
            ])
          ),
          required: t.parameters.required || []
        }
      }))
    }
  ];

  const contents: any[] = [
    {
      role: 'user',
      parts: [
        {
          text: `You are an elite Football Analytics AI assistant for Manchester United and Premier League statistics.
Your task is to analyze user queries for up to 4 players, invoke tools to gather exact metrics, select at least 10 differentiative characteristics for the chart, and present a deep tactical comparison.

CRITICAL TOOL CALL RULES:
1. When calling tools, pass ONLY clean specific player name strings.
2. In set_active_chart, you MUST ALWAYS set vizType to "pizza" and select at least 10 top differentiative stat keys.
3. ONCE YOU HAVE CALLED THE NECESSARY TOOLS, DO NOT CALL THEM AGAIN. Immediately output the final JSON.

OUTPUT FORMAT:
Your final response MUST be a valid JSON object exactly matching this schema (do not use markdown formatting outside the JSON, just return the raw JSON):
{
  "attacking": {
    "metricsTable": [ { "player": "string", "goals": "number", "xG": "number", "shots": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "defensive": {
    "metricsTable": [ { "player": "string", "tackles": "number", "interceptions": "number", "duelsWon": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "passing": {
    "metricsTable": [ { "player": "string", "keyPasses": "number", "passAccuracy": "number", "assists": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "masterVerdict": "string"
}

User Query: "${userQuery}"`
        }
      ]
    }
  ];

  let turns = 0;
  const maxTurns = 6;

  while (turns < maxTurns) {
    turns++;
    let res: any;
    try {
      res = await client.models.generateContent({
        model,
        contents,
        config: { tools: geminiTools }
      });
    } catch (err: any) {
      if (turns === 1) {
        // Fallback
        res = await client.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: { tools: geminiTools }
        });
      } else {
        throw new Error(`Gemini API Error: ${err?.message || String(err)}`);
      }
    }

    const candidate = res.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart && functionCallPart.functionCall) {
      const { name, args } = functionCallPart.functionCall;
      const toolResult = await toolExecutor(name, args || {});
      
      if (name === 'set_active_chart') {
        chartConfig = toolResult as any;
      }
      if (name === 'compare_players' || name === 'get_player_metrics') {
        comparisonData = toolResult;
      }

      toolTrace.push({
        step: turns,
        toolName: name,
        args: args || {},
        resultSummary: typeof toolResult === 'object' ? JSON.stringify(toolResult).slice(0, 140) + '...' : String(toolResult),
        timestamp: new Date().toLocaleTimeString()
      });

      contents.push({
        role: 'model',
        parts: candidate.content.parts
      });

      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name,
              response: { result: toolResult }
            }
          }
        ]
      });
    } else {
      let textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
      
      let finalMaster = textParts;
      let finalAtt = '';
      let finalDef = '';
      let finalPass = '';

      try {
        const jsonMatch = textParts.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const buildTable = (data: any, headers: string[], keys: string[]) => {
            if (!data || !data.metricsTable || !data.metricsTable.length) return '';
            let md = `| ${headers.join(' | ')} |\n`;
            md += `| ${headers.map(() => '---').join(' | ')} |\n`;
            data.metricsTable.forEach((row: any) => {
              md += `| ${keys.map(k => typeof row[k] === 'number' ? Number(row[k]).toFixed(1).replace('.0', '') : row[k] || '-').join(' | ')} |\n`;
            });
            return md;
          };

          const buildText = (data: any) => {
            if (!data || !data.keyTakeaways || !Array.isArray(data.keyTakeaways)) return '';
            return data.keyTakeaways.join('\n\n');
          };

          if (parsed.attacking) {
            finalAtt = `### Attacking Specialist Analysis\n\n${buildTable(parsed.attacking, ['Player', 'Goals', 'xG', 'Shots'], ['player', 'goals', 'xG', 'shots'])}\n\n#### Key Takeaways\n\n${buildText(parsed.attacking)}`;
          }
          if (parsed.defensive) {
            finalDef = `### Defensive Specialist Analysis\n\n${buildTable(parsed.defensive, ['Player', 'Tackles', 'Interceptions', 'Duels Won'], ['player', 'tackles', 'interceptions', 'duelsWon'])}\n\n#### Key Takeaways\n\n${buildText(parsed.defensive)}`;
          }
          if (parsed.passing) {
            finalPass = `### Passing Specialist Analysis\n\n${buildTable(parsed.passing, ['Player', 'Key Passes', 'Pass Accuracy', 'Assists'], ['player', 'keyPasses', 'passAccuracy', 'assists'])}\n\n#### Key Takeaways\n\n${buildText(parsed.passing)}`;
          }
          if (parsed.masterVerdict) {
            finalMaster = `### Executive Tactical Verdict\n\n${parsed.masterVerdict}`;
          }
        }
      } catch (e) {
        console.warn('Failed to parse structured JSON output from Gemini, falling back to raw text', e);
      }

      return {
        providerUsed: 'gemini',
        rawResponseText: finalMaster,
        toolTrace,
        chartConfig,
        comparisonData,
        departmentReports: {
          attacking: finalAtt,
          defensive: finalDef,
          passing: finalPass,
          verification: ''
        }
      };
    }
  }

  throw new Error('Exceeded max tool calling turns');
}

/**
 * Executes a query with Mistral Large tool calling
 */
export async function executeMistralToolCalling(
  userQuery: string,
  toolExecutor: (name: string, args: Record<string, any>) => Promise<any>
): Promise<NLPExecutionResult> {
  const apiKey = getMistralApiKey();
  if (!apiKey) {
    throw new Error('Mistral API Key missing');
  }

  const endpoint = 'https://api.mistral.ai/v1/chat/completions';
  const toolTrace: ToolTraceEntry[] = [];
  let chartConfig: NLPExecutionResult['chartConfig'] = undefined;
  let comparisonData: any = undefined;

  const mistralTools = PLAYER_COMPARISON_TOOLS.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(t.parameters.properties).map(([k, v]) => [
            k,
            {
              type: v.type.toLowerCase(),
              description: v.description,
              ...(v.enum ? { enum: v.enum } : {}),
              ...(v.items ? { items: { type: v.items.type.toLowerCase() } } : {})
            }
          ])
        ),
        required: t.parameters.required || []
      }
    }
  }));

  const messages: any[] = [
    {
      role: 'system',
      content: `You are an elite Football Analytics AI assistant for Manchester United and Premier League statistics.
Your task is to analyze user queries for up to 4 players, invoke tools to gather exact metrics, select at least 10 differentiative characteristics for the chart, and present a deep tactical comparison.

CRITICAL TOOL CALL RULES:
1. When calling tools, pass ONLY clean specific player name strings.
2. In set_active_chart, you MUST ALWAYS set vizType to "pizza" and select at least 10 top differentiative stat keys.
3. ONCE YOU HAVE CALLED THE NECESSARY TOOLS, DO NOT CALL THEM AGAIN. Immediately output the final JSON.

OUTPUT FORMAT:
Your final response MUST be a valid JSON object exactly matching this schema (do not use markdown formatting outside the JSON, just return the raw JSON):
{
  "attacking": {
    "metricsTable": [ { "player": "string", "goals": "number", "xG": "number", "shots": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "defensive": {
    "metricsTable": [ { "player": "string", "tackles": "number", "interceptions": "number", "duelsWon": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "passing": {
    "metricsTable": [ { "player": "string", "keyPasses": "number", "passAccuracy": "number", "assists": "number" } ],
    "keyTakeaways": [ "string" ]
  },
  "masterVerdict": "string"
}`
    },
    {
      role: 'user',
      content: userQuery
    }
  ];

  let turns = 0;
  const maxTurns = 6;

  while (turns < maxTurns) {
    turns++;
    const payload: any = {
      model: 'ministral-14b-2512',
      messages
    };
    if (!chartConfig || !comparisonData) {
      payload.tools = mistralTools;
    }

    let res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Fallback to ministral-8b-2512 if primary hits rate limit
    if (!res.ok && turns === 1) {
      const fallbackPayload: any = {
        model: 'ministral-8b-2512',
        messages
      };
      if (!chartConfig || !comparisonData) {
        fallbackPayload.tools = mistralTools;
      }

      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fallbackPayload)
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mistral API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choiceMessage = data.choices?.[0]?.message;

    if (!choiceMessage) {
      throw new Error('No choice message returned from Mistral API');
    }

    if (choiceMessage.tool_calls && choiceMessage.tool_calls.length > 0) {
      messages.push(choiceMessage);

      for (const toolCall of choiceMessage.tool_calls) {
        const name = toolCall.function.name;
        let args: Record<string, any> = {};
        try {
          args = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        } catch {
          args = {};
        }

        const toolResult = await toolExecutor(name, args);

        if (name === 'set_active_chart') {
          chartConfig = toolResult as any;
        }
        if (name === 'compare_players' || name === 'get_player_metrics') {
          comparisonData = toolResult;
        }

        toolTrace.push({
          step: turns,
          toolName: name,
          args,
          resultSummary: typeof toolResult === 'object' ? JSON.stringify(toolResult).slice(0, 140) + '...' : String(toolResult),
          timestamp: new Date().toLocaleTimeString()
        });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name,
          content: JSON.stringify({ result: toolResult })
        });
      }
    } else if (!choiceMessage.tool_calls || choiceMessage.tool_calls.length === 0) {
      const textParts = choiceMessage.content || '';
      
      let finalMaster = textParts;
      let finalAtt = '';
      let finalDef = '';
      let finalPass = '';

      try {
        const jsonMatch = textParts.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const buildTable = (data: any, headers: string[], keys: string[]) => {
            if (!data || !data.metricsTable || !data.metricsTable.length) return '';
            let md = `| ${headers.join(' | ')} |\n`;
            md += `| ${headers.map(() => '---').join(' | ')} |\n`;
            data.metricsTable.forEach((row: any) => {
              md += `| ${keys.map(k => typeof row[k] === 'number' ? Number(row[k]).toFixed(1).replace('.0', '') : row[k] || '-').join(' | ')} |\n`;
            });
            return md;
          };

          const buildText = (data: any) => {
            if (!data || !data.keyTakeaways || !Array.isArray(data.keyTakeaways)) return '';
            return data.keyTakeaways.join('\n\n');
          };

          if (parsed.attacking) {
            finalAtt = `### Attacking Specialist Analysis\n\n${buildTable(parsed.attacking, ['Player', 'Goals', 'xG', 'Shots'], ['player', 'goals', 'xG', 'shots'])}\n\n#### Key Takeaways\n\n${buildText(parsed.attacking)}`;
          }
          if (parsed.defensive) {
            finalDef = `### Defensive Specialist Analysis\n\n${buildTable(parsed.defensive, ['Player', 'Tackles', 'Interceptions', 'Duels Won'], ['player', 'tackles', 'interceptions', 'duelsWon'])}\n\n#### Key Takeaways\n\n${buildText(parsed.defensive)}`;
          }
          if (parsed.passing) {
            finalPass = `### Passing Specialist Analysis\n\n${buildTable(parsed.passing, ['Player', 'Key Passes', 'Pass Accuracy', 'Assists'], ['player', 'keyPasses', 'passAccuracy', 'assists'])}\n\n#### Key Takeaways\n\n${buildText(parsed.passing)}`;
          }
          if (parsed.masterVerdict) {
            finalMaster = `### Executive Tactical Verdict\n\n${parsed.masterVerdict}`;
          }
        }
      } catch (e) {
        console.warn('Failed to parse structured JSON output from Mistral, falling back to raw text', e);
      }

      return {
        providerUsed: 'mistral',
        rawResponseText: finalMaster,
        toolTrace,
        chartConfig,
        comparisonData,
        departmentReports: {
          attacking: finalAtt,
          defensive: finalDef,
          passing: finalPass,
          verification: ''
        }
      };
    }
  }

  throw new Error('Exceeded max tool calling turns');
}
