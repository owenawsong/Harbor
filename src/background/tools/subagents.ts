/**
 * Sub-agents tool definition
 * Handled specially in agent.ts - not executed through normal tool handler
 */

import type { ToolHandler } from '../agent/types'

export const subAgentTools: ToolHandler[] = [
  {
    definition: {
      name: 'create_parallel_sub_agents',
      description:
        'Create and run multiple independent sub-agents in parallel to handle subtasks. Useful for splitting complex tasks into smaller, independent problems. Each sub-agent runs in its own context and reports back results. Maximum 10 sub-agents.',
      input_schema: {
        type: 'object' as const,
        properties: {
          briefing: {
            type: 'string',
            description:
              'Shared context/briefing for all sub-agents (e.g., "You are researching a topic")',
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Unique identifier for this task',
                },
                description: {
                  type: 'string',
                  description: 'Specific task description for the sub-agent',
                },
              },
              required: ['taskId', 'description'],
            },
            minItems: 1,
            maxItems: 10,
            description: 'Array of subtasks for parallel execution (max 10)',
          },
        },
        required: ['tasks'],
      },
    },
    execute: async () => {
      // This is handled specially in agent.ts, not through normal tool execution
      return {
        success: false,
        error: 'Sub-agent tool must be handled in agent loop',
      }
    },
  },
]

/**
 * Sub-agent result structure
 */
export interface SubAgentResult {
  taskId: string
  status: 'success' | 'error'
  result?: string
  error?: string
}
