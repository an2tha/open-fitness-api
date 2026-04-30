import { config } from 'dotenv';
import path from 'node:path';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject as sdkGenerateObject, streamObject as sdkStreamObject } from 'ai';
import { z } from 'zod';
import search from '@inquirer/search';
import { getLogger } from '../utils/logger';

config({
  path: path.resolve(import.meta.dirname, '../../../.env'),
  // @ts-expect-error - quiet is not in DotenvConfigOptions but supported by some versions/wrappers
  quiet: true,
});

let selectedModel: string | null = null;

const getProvider = () => {
  let baseURL = process.env.AI_GATEWAY_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.AI_API_KEY;

  if (!baseURL.includes('api.openai.com') && !baseURL.includes('gateway.ai.vercel.com') && !baseURL.includes('/v1')) {
    baseURL = baseURL.endsWith('/') ? `${baseURL}v1` : `${baseURL}/v1`;
  }

  return createOpenAI({
    baseURL,
    apiKey,
  });
};

const DEFAULT_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet-20240620',
  'claude-3-haiku-20240307',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
];

export const getAvailableModels = async (): Promise<string[]> => {
  const baseUrl = process.env.AI_GATEWAY_URL || process.env.AI_BASE_URL;

  if (baseUrl) {
    try {
      const ollamaUrl = baseUrl.replace(/\/v1\/?$/, '');
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        const data = (await response.json()) as { models: { name: string; model?: string }[] };
        if (data.models && data.models.length > 0) {
          return data.models.map((m) => m.model || m.name);
        }
      }
    } catch (_e) {
      // ignore
    }

    try {
      const response = await fetch(`${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}models`, {
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY || ''}`,
        },
      });
      if (response.ok) {
        const data = (await response.json()) as { data: { id: string }[] };
        if (data.data && data.data.length > 0) {
          return data.data.map((m) => m.id);
        }
      }
    } catch (_e) {
      // ignore
    }
  }

  return DEFAULT_MODELS;
};

export const promptModelSelection = async (): Promise<string> => {
  if (selectedModel) {
    return selectedModel;
  }

  const models = await getAvailableModels();

  selectedModel = await search({
    message: 'Search and select an AI model:',
    source: async (input) => {
      if (!input) {
        return models.map((m) => ({ name: m, value: m }));
      }
      return models.filter((m) => m.toLowerCase().includes(input.toLowerCase())).map((m) => ({ name: m, value: m }));
    },
  });

  return selectedModel;
};

export const generateNormalizedObject = async <T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: {
    model?: string;
    temperature?: number;
    verbose?: boolean;
  },
): Promise<T> => {
  const modelId = options?.model || (await promptModelSelection());
  const provider = getProvider();
  const logger = getLogger();

  if (options?.verbose) {
    const { partialObjectStream, object } = await sdkStreamObject({
      model: provider(modelId),
      prompt,
      schema,
      temperature: options?.temperature ?? 0.1,
    });

    let lastLoggedLength = 0;

    for await (const partialObject of partialObjectStream) {
      const currentText = JSON.stringify(partialObject);
      if (currentText.length > lastLoggedLength + 100) {
        const windowSize = 150;
        const tail = currentText.length > windowSize ? '...' + currentText.slice(-windowSize) : currentText;

        logger.debug(`AI Streaming: ${tail}`);
        lastLoggedLength = currentText.length;
      }
    }

    return await object;
  }

  const { object } = await sdkGenerateObject({
    model: provider(modelId),
    prompt,
    schema,
    temperature: options?.temperature ?? 0.1,
  });

  return object;
};

export const setModel = (model: string) => {
  selectedModel = model;
};

export const getCurrentModel = () => selectedModel;

export const resetModel = () => {
  selectedModel = null;
};
