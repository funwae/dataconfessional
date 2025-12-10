// LLM Client abstraction layer
// Supports multiple providers via environment variable

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface LLMClient {
  generateReportSections(
    template: string,
    dataSummaries: string,
    audience: string,
    tone?: 'serious' | 'gossip'
  ): Promise<string>;

  answerQuestion(
    question: string,
    context: string,
    dataSummaries: string,
    tone?: 'serious' | 'gossip'
  ): Promise<{ answer: string; supportingData: any; caveats: string[] }>;

  summarizeTable(tableSummary: string): Promise<string>;

  describeChart(chartConfig: any, sampleData: any): Promise<{ title: string; insight: string }>;

  generateQuickConfession(
    question: string,
    dataSummaries: string,
    audience: string,
    tone?: 'serious' | 'gossip'
  ): Promise<{ confession: string; talkingPoints: string[] }>;
}

class OpenAIClient implements LLMClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
  }

  async generateReportSections(
    template: string,
    dataSummaries: string,
    audience: string
  ): Promise<string> {
    const audienceGuidance: Record<string, string> = {
      'individual contributor': 'Write for someone who works directly with the data. Use technical terms when appropriate, include detailed numbers, and provide actionable next steps.',
      'manager or director': 'Write for decision-makers who need strategic insights. Focus on trends, implications, and recommendations. Use clear metrics and avoid jargon.',
      'executive or external client': 'Write for high-level stakeholders. Lead with key takeaways, use simple language, focus on business impact, and keep sections concise (3-5 sentences).',
    };

        const guidance = audienceGuidance[audience] || 'Write clearly and professionally for a business audience.';
        const toneGuidance = tone === 'gossip'
          ? ' Use a conversational, slightly playful tone. Phrases like "the data is doing X" or "mid-market is carrying the team" are appropriate. Stay accurate but friendly.'
          : ' Use formal, professional language.';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional data analyst creating business-ready reports.${toneGuidance}

Target Audience: ${audience}
${guidance}

FORMATTING REQUIREMENTS:
1. Use Markdown formatting:
   - ## for main section headings (H2)
   - ### for subsections (H3)
   - **bold** for key metrics and important numbers
   - *italic* for context or caveats
   - Bullet points (-) for lists
   - Numbered lists (1.) for priorities or steps

2. Structure each section:
   - Start with 1-2 sentences summarizing the section
   - Use bullet points for key findings
   - Include specific numbers and metrics
   - End with implications or next steps when relevant

3. Writing style:
   - Clear and concise (3-5 sentences per paragraph max)
   - Action-oriented language
   - Data-driven (cite specific numbers)
   - Professional tone appropriate for ${audience}

4. Executive Summary format:
   - 3-5 key takeaways as bullet points
   - Top 3-5 metrics with brief context
   - Recommended actions (if applicable)

5. Key Insights format:
   - Numbered list (1., 2., 3.)
   - Each insight: "What it is" → "Why it matters" → "What to do"
   - Include supporting data in parentheses

6. Recommendations format:
   - Prioritized list (most important first)
   - Each recommendation: Action + Expected Impact + Timeline
   - Use bold for action items

IMPORTANT:
- Only use data that is explicitly provided
- Do not speculate or make assumptions
- If data is missing, note it as a limitation
- Reference specific charts or tables when available
- Use consistent terminology throughout`,
          },
          {
            role: 'user',
            content: `Report Template Structure:
${template}

Available Data:
${dataSummaries}

Generate the complete report following the template structure and formatting requirements above.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  }

  async answerQuestion(
    question: string,
    context: string,
    dataSummaries: string
  ): Promise<{ answer: string; supportingData: any; caveats: string[] }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: tone === 'gossip'
              ? `You are a data analyst with a conversational, slightly playful tone. Answer questions based on the provided data in a casual but accurate way.
            Always structure your response as:

            DIRECT ANSWER:
            [Your direct answer here - be conversational, use phrases like "the data is showing X" or "mid-market is carrying the team"]

            SUPPORTING DATA:
            - [List supporting data points]

            CAVEATS:
            - [List any data gaps or uncertainties]

            Quote exact figures where possible. Keep it accurate but friendly.`
              : `You are a data analyst. Answer questions based on the provided data.
            Always structure your response as:

            DIRECT ANSWER:
            [Your direct answer here]

            SUPPORTING DATA:
            - [List supporting data points]

            CAVEATS:
            - [List any data gaps or uncertainties]

            Quote exact figures where possible.`,
          },
          {
            role: 'user',
            content: `Project Context:\n${context}\n\nAvailable Data:\n${dataSummaries}\n\nQuestion: ${question}${tone === 'gossip' ? '\n\nUse a conversational, slightly playful tone while staying accurate.' : ''}`,
          },
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;

    // Parse the structured response
    const answerMatch = content.match(/DIRECT ANSWER:\s*(.+?)(?=SUPPORTING DATA:|$)/s);
    const supportingMatch = content.match(/SUPPORTING DATA:\s*(.+?)(?=CAVEATS:|$)/s);
    const caveatsMatch = content.match(/CAVEATS:\s*(.+?)$/s);

    return {
      answer: answerMatch ? answerMatch[1].trim() : content,
      supportingData: supportingMatch ? supportingMatch[1].trim().split('\n').filter(Boolean) : [],
      caveats: caveatsMatch ? caveatsMatch[1].trim().split('\n').filter(Boolean) : [],
    };
  }

  async summarizeTable(tableSummary: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a data analyst. Provide a concise summary of the table data.',
          },
          {
            role: 'user',
            content: `Summarize this table:\n${tableSummary}`,
          },
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.choices[0].message.content;
  }

  async describeChart(chartConfig: any, sampleData: any): Promise<{ title: string; insight: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional data analyst creating business-ready visualizations.

For chart titles:
- Be specific and descriptive (include metric name, dimension, and time period if applicable)
- Use action-oriented language when appropriate
- Keep titles concise (under 60 characters)
- Format: "Metric Name by Dimension (Time Period)" or "Trend: Metric Over Time"

For insights:
- Write one clear, actionable sentence (15-25 words)
- Explain what the chart reveals, not just what it shows
- Include key numbers or trends when relevant
- Focus on business implications

Example titles:
- "Revenue Growth Trend (Q1-Q4 2024)" not "Revenue Over Time"
- "Sales by Region - Top Performers" not "Sales by Region"
- "Customer Acquisition Funnel - Conversion Analysis" not "Funnel Chart"

Example insights:
- "Revenue increased 23% year-over-year, driven primarily by Q3 growth in the enterprise segment."
- "The West region accounts for 42% of total sales, indicating strong market penetration."
- "Conversion rates drop significantly at the proposal stage, suggesting pricing sensitivity."`,
          },
          {
            role: 'user',
            content: `Chart Configuration:
${JSON.stringify(chartConfig, null, 2)}

Sample Data (first 5 rows):
${JSON.stringify(sampleData?.slice(0, 5) || [], null, 2)}

Provide ONLY:
TITLE: [Your title here]
INSIGHT: [Your insight here]`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;
    // Parse structured response
    const titleMatch = content.match(/TITLE:\s*(.+?)(?=INSIGHT:|$)/i);
    const insightMatch = content.match(/INSIGHT:\s*(.+?)$/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : content.split('\n')[0] || 'Chart',
      insight: insightMatch ? insightMatch[1].trim() : content.split('\n').slice(1).join(' ').trim() || 'No insight available',
    };
  }

  async generateQuickConfession(
    question: string,
    project: any,
    audience: string
  ): Promise<{ confession: string; talkingPoints: string[] }> {
    // Build data summaries
    const dataSummaries: string[] = [];
    if (project.dataSources) {
      for (const dataSource of project.dataSources) {
        if (dataSource.tables && dataSource.tables.length > 0) {
          for (const table of dataSource.tables) {
            const summary = `Table: ${table.name} (${table.rowCount} rows, ${table.columnCount} columns)
Columns: ${table.columnProfiles?.map((cp: any) => `${cp.name} (${cp.dataType})`).join(', ') || 'N/A'}`;
            dataSummaries.push(summary);
          }
        }
        if (dataSource.documentChunks && dataSource.documentChunks.length > 0) {
          dataSummaries.push(`Text source: ${dataSource.name} (${dataSource.documentChunks.length} chunks)`);
        }
      }
    }

    const audienceMap: Record<string, string> = {
      SELF: 'individual contributor',
      MANAGER_DIRECTOR: 'manager or director',
      EXECUTIVE_EXTERNAL: 'executive or external client',
    };
    const audienceText = audienceMap[audience] || 'general audience';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a data analyst creating a quick "confession" - a clear, honest summary of what the data reveals.

Format your response EXACTLY as:
CONFESSION:
[One paragraph (3-5 sentences) that directly answers the question and reveals what the data is telling us. Be honest, specific, and include key numbers.]

TALKING POINTS:
- [Bullet point 1 - what to say in the meeting]
- [Bullet point 2 - what to say in the meeting]
- [Bullet point 3 - what to say in the meeting]
- [Bullet point 4 - what to say in the meeting]

The confession should be conversational but professional. The talking points should be ready to use in a meeting.`,
          },
          {
            role: 'user',
            content: `Question: ${question}

Available Data:
${dataSummaries.join('\n\n')}

Audience: ${audienceText}

Generate a confession and talking points.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;

    // Parse structured response
    const confessionMatch = content.match(/CONFESSION:\s*(.+?)(?=TALKING POINTS:|$)/s);
    const talkingPointsMatch = content.match(/TALKING POINTS:\s*(.+?)$/s);

    const confession = confessionMatch ? confessionMatch[1].trim() : content.split('TALKING POINTS:')[0].trim();
    const talkingPointsText = talkingPointsMatch ? talkingPointsMatch[1].trim() : '';
    const talkingPoints = talkingPointsText
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      confession: confession || 'Unable to generate confession.',
      talkingPoints: talkingPoints.length > 0 ? talkingPoints : ['Review the data and charts for key insights.'],
    };
  }
}

class AnthropicClient implements LLMClient {
  private apiKey: string | null = null;
  private apiKeyPromise: Promise<string> | null = null;

  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    if (this.apiKeyPromise) {
      return this.apiKeyPromise;
    }

    this.apiKeyPromise = (async () => {
      // Try to get from secure storage (desktop) or env var (web)
      const { getApiKey } = await import('./api-key-storage');
      const key = await getApiKey();

      if (!key) {
        // Fallback to environment variable for web mode
        const envKey = process.env.ANTHROPIC_API_KEY;
        if (!envKey) {
          throw new Error('ANTHROPIC_API_KEY is not set. Please configure your API key in settings.');
        }
        this.apiKey = envKey;
        return envKey;
      }

      this.apiKey = key;
      return key;
    })();

    return this.apiKeyPromise;
  }

  async generateReportSections(
    template: string,
    dataSummaries: string,
    audience: string
  ): Promise<string> {
    const apiKey = await this.getApiKey();

    const audienceGuidance: Record<string, string> = {
      'individual contributor': 'Write for someone who works directly with the data. Use technical terms when appropriate, include detailed numbers, and provide actionable next steps.',
      'manager or director': 'Write for decision-makers who need strategic insights. Focus on trends, implications, and recommendations. Use clear metrics and avoid jargon.',
      'executive or external client': 'Write for high-level stakeholders. Lead with key takeaways, use simple language, focus on business impact, and keep sections concise (3-5 sentences).',
    };

    const guidance = audienceGuidance[audience] || 'Write clearly and professionally for a business audience.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: `You are a professional data analyst creating business-ready reports.${toneGuidance}

Target Audience: ${audience}
${guidance}

FORMATTING REQUIREMENTS:
1. Use Markdown formatting:
   - ## for main section headings (H2)
   - ### for subsections (H3)
   - **bold** for key metrics and important numbers
   - *italic* for context or caveats
   - Bullet points (-) for lists
   - Numbered lists (1.) for priorities or steps

2. Structure each section:
   - Start with 1-2 sentences summarizing the section
   - Use bullet points for key findings
   - Include specific numbers and metrics
   - End with implications or next steps when relevant

3. Writing style:
   - Clear and concise (3-5 sentences per paragraph max)
   - Action-oriented language
   - Data-driven (cite specific numbers)
   - Professional tone appropriate for ${audience}

4. Executive Summary format:
   - 3-5 key takeaways as bullet points
   - Top 3-5 metrics with brief context
   - Recommended actions (if applicable)

5. Key Insights format:
   - Numbered list (1., 2., 3.)
   - Each insight: "What it is" → "Why it matters" → "What to do"
   - Include supporting data in parentheses

6. Recommendations format:
   - Prioritized list (most important first)
   - Each recommendation: Action + Expected Impact + Timeline
   - Use bold for action items

IMPORTANT:
- Only use data that is explicitly provided
- Do not speculate or make assumptions
- If data is missing, note it as a limitation
- Reference specific charts or tables when available
- Use consistent terminology throughout`,
        messages: [
          {
            role: 'user',
            content: `Report Template Structure:
${template}

Available Data:
${dataSummaries}

Generate the complete report following the template structure and formatting requirements above.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.content[0].text;
  }

  async answerQuestion(
    question: string,
    context: string,
    dataSummaries: string
  ): Promise<{ answer: string; supportingData: any; caveats: string[] }> {
    const apiKey = await this.getApiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: tone === 'gossip'
          ? `You are a data analyst with a conversational, slightly playful tone. Answer questions based on the provided data in a casual but accurate way.
        Always structure your response as:

        DIRECT ANSWER:
        [Your direct answer here - be conversational, use phrases like "the data is showing X" or "mid-market is carrying the team"]

        SUPPORTING DATA:
        - [List supporting data points]

        CAVEATS:
        - [List any data gaps or uncertainties]

        Quote exact figures where possible. Keep it accurate but friendly.`
          : `You are a data analyst. Answer questions based on the provided data.
        Always structure your response as:

        DIRECT ANSWER:
        [Your direct answer here]

        SUPPORTING DATA:
        - [List supporting data points]

        CAVEATS:
        - [List any data gaps or uncertainties]

        Quote exact figures where possible.`,
        messages: [
          {
            role: 'user',
            content: `Project Context:\n${context}\n\nAvailable Data:\n${dataSummaries}\n\nQuestion: ${question}${tone === 'gossip' ? '\n\nUse a conversational, slightly playful tone while staying accurate.' : ''}`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.content[0].text;

    // Parse the structured response
    const answerMatch = content.match(/DIRECT ANSWER:\s*(.+?)(?=SUPPORTING DATA:|$)/s);
    const supportingMatch = content.match(/SUPPORTING DATA:\s*(.+?)(?=CAVEATS:|$)/s);
    const caveatsMatch = content.match(/CAVEATS:\s*(.+?)$/s);

    return {
      answer: answerMatch ? answerMatch[1].trim() : content,
      supportingData: supportingMatch ? supportingMatch[1].trim().split('\n').filter(Boolean) : [],
      caveats: caveatsMatch ? caveatsMatch[1].trim().split('\n').filter(Boolean) : [],
    };
  }

  async summarizeTable(tableSummary: string): Promise<string> {
    const apiKey = await this.getApiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are a data analyst. Provide a concise summary of the table data.',
        messages: [
          {
            role: 'user',
            content: `Summarize this table:\n${tableSummary}`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.content[0].text;
  }

  async describeChart(chartConfig: any, sampleData: any): Promise<{ title: string; insight: string }> {
    const apiKey = await this.getApiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        system: `You are a professional data analyst creating business-ready visualizations.

For chart titles:
- Be specific and descriptive (include metric name, dimension, and time period if applicable)
- Use action-oriented language when appropriate
- Keep titles concise (under 60 characters)
- Format: "Metric Name by Dimension (Time Period)" or "Trend: Metric Over Time"

For insights:
- Write one clear, actionable sentence (15-25 words)
- Explain what the chart reveals, not just what it shows
- Include key numbers or trends when relevant
- Focus on business implications

Example titles:
- "Revenue Growth Trend (Q1-Q4 2024)" not "Revenue Over Time"
- "Sales by Region - Top Performers" not "Sales by Region"
- "Customer Acquisition Funnel - Conversion Analysis" not "Funnel Chart"

Example insights:
- "Revenue increased 23% year-over-year, driven primarily by Q3 growth in the enterprise segment."
- "The West region accounts for 42% of total sales, indicating strong market penetration."
- "Conversion rates drop significantly at the proposal stage, suggesting pricing sensitivity."`,
        messages: [
          {
            role: 'user',
            content: `Chart Configuration:
${JSON.stringify(chartConfig, null, 2)}

Sample Data (first 5 rows):
${JSON.stringify(sampleData?.slice(0, 5) || [], null, 2)}

Provide ONLY:
TITLE: [Your title here]
INSIGHT: [Your insight here]`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.content[0].text;
    // Parse structured response
    const titleMatch = content.match(/TITLE:\s*(.+?)(?=INSIGHT:|$)/i);
    const insightMatch = content.match(/INSIGHT:\s*(.+?)$/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : content.split('\n')[0] || 'Chart',
      insight: insightMatch ? insightMatch[1].trim() : content.split('\n').slice(1).join(' ').trim() || 'No insight available',
    };
  }

  async generateQuickConfession(
    question: string,
    project: any,
    audience: string
  ): Promise<{ confession: string; talkingPoints: string[] }> {
    const apiKey = await this.getApiKey();

    // Build data summaries
    const dataSummaries: string[] = [];
    if (project.dataSources) {
      for (const dataSource of project.dataSources) {
        if (dataSource.tables && dataSource.tables.length > 0) {
          for (const table of dataSource.tables) {
            const summary = `Table: ${table.name} (${table.rowCount} rows, ${table.columnCount} columns)
Columns: ${table.columnProfiles?.map((cp: any) => `${cp.name} (${cp.dataType})`).join(', ') || 'N/A'}`;
            dataSummaries.push(summary);
          }
        }
        if (dataSource.documentChunks && dataSource.documentChunks.length > 0) {
          dataSummaries.push(`Text source: ${dataSource.name} (${dataSource.documentChunks.length} chunks)`);
        }
      }
    }

    const audienceMap: Record<string, string> = {
      SELF: 'individual contributor',
      MANAGER_DIRECTOR: 'manager or director',
      EXECUTIVE_EXTERNAL: 'executive or external client',
    };
    const audienceText = audienceMap[audience] || 'general audience';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `You are a data analyst creating a quick "confession" - a clear, honest summary of what the data reveals.

Format your response EXACTLY as:
CONFESSION:
[One paragraph (3-5 sentences) that directly answers the question and reveals what the data is telling us. Be honest, specific, and include key numbers.]

TALKING POINTS:
- [Bullet point 1 - what to say in the meeting]
- [Bullet point 2 - what to say in the meeting]
- [Bullet point 3 - what to say in the meeting]
- [Bullet point 4 - what to say in the meeting]

The confession should be conversational but professional. The talking points should be ready to use in a meeting.`,
        messages: [
          {
            role: 'user',
            content: `Question: ${question}

Available Data:
${dataSummaries.join('\n\n')}

Audience: ${audienceText}

Generate a confession and talking points.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.content[0].text;

    // Parse structured response
    const confessionMatch = content.match(/CONFESSION:\s*(.+?)(?=TALKING POINTS:|$)/s);
    const talkingPointsMatch = content.match(/TALKING POINTS:\s*(.+?)$/s);

    const confession = confessionMatch ? confessionMatch[1].trim() : content.split('TALKING POINTS:')[0].trim();
    const talkingPointsText = talkingPointsMatch ? talkingPointsMatch[1].trim() : '';
    const talkingPoints = talkingPointsText
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      confession: confession || 'Unable to generate confession.',
      talkingPoints: talkingPoints.length > 0 ? talkingPoints : ['Review the data and charts for key insights.'],
    };
  }
}

class OllamaClient implements LLMClient {
  async generateReportSections(
    template: string,
    dataSummaries: string,
    audience: string,
    tone: 'serious' | 'gossip'
  ): Promise<string> {
    const { generateReport } = await import('./engine-client');
    const { buildReportPrompt } = await import('./engine-prompts');

    const prompt = buildReportPrompt('general', audience, dataSummaries);

    const response = await generateReport({
      templateType: 'general',
      audience: audience as 'self' | 'team' | 'exec',
      dataSummary: dataSummaries,
    });

    return response.markdown;
  }

  async answerQuestion(
    question: string,
    context: string,
    dataSummaries: string,
    tone: 'serious' | 'gossip'
  ): Promise<{ answer: string; supportingData: any; caveats: string[] }> {
    const { chat } = await import('./engine-client');
    const { buildSystemPrompt, buildUserPrompt } = await import('./engine-prompts');

    // Extract project metadata from context (simplified)
    const projectMeta = {
      name: 'Project',
      audience: 'self' as const,
    };

    const role = tone === 'gossip' ? 'gossip' : 'analysis';

    let fullAnswer = '';
    await chat(
      {
        role,
        question,
        contextSummary: dataSummaries,
        projectMeta,
      },
      (chunk) => {
        fullAnswer += chunk;
      }
    );

    // Parse the structured response
    const answerMatch = fullAnswer.match(/CONFESSION:\s*(.+?)(?=EVIDENCE:|$)/s);
    const evidenceMatch = fullAnswer.match(/EVIDENCE:\s*(.+?)(?=CAVEATS:|$)/s);
    const caveatsMatch = fullAnswer.match(/CAVEATS:\s*(.+?)$/s);

    const answer = answerMatch ? answerMatch[1].trim() : fullAnswer.split('EVIDENCE:')[0].trim();
    const supportingData = evidenceMatch
      ? evidenceMatch[1].split('\n').map((line: string) => line.replace(/^- /, '').trim()).filter(Boolean)
      : [];
    const caveats = caveatsMatch
      ? caveatsMatch[1].split('\n').map((line: string) => line.replace(/^- /, '').trim()).filter(Boolean)
      : [];

    return {
      answer: answer || 'No answer generated.',
      supportingData: { raw: supportingData },
      caveats: caveats,
    };
  }

  async summarizeTable(tableSummary: string): Promise<string> {
    const { chat } = await import('./engine-client');
    const { buildTablePrompt } = await import('./engine-prompts');

    const prompt = buildTablePrompt(tableSummary);

    let fullAnswer = '';
    await chat(
      {
        role: 'analysis',
        question: 'Summarize this table',
        contextSummary: prompt,
        projectMeta: { name: 'Table Summary', audience: 'self' },
      },
      (chunk) => {
        fullAnswer += chunk;
      }
    );

    return fullAnswer;
  }

  async describeChart(chartConfig: any, sampleData: any): Promise<{ title: string; insight: string }> {
    const { chat } = await import('./engine-client');
    const { buildChartPrompt } = await import('./engine-prompts');

    const chartSummary = JSON.stringify({ config: chartConfig, sampleData });
    const prompt = buildChartPrompt(chartSummary);

    let fullAnswer = '';
    await chat(
      {
        role: 'analysis',
        question: 'Describe this chart',
        contextSummary: prompt,
        projectMeta: { name: 'Chart Description', audience: 'self' },
      },
      (chunk) => {
        fullAnswer += chunk;
      }
    );

    // Parse TITLE and CONFESSION
    const titleMatch = fullAnswer.match(/TITLE:\s*(.+?)(?=CONFESSION:|$)/s);
    const confessionMatch = fullAnswer.match(/CONFESSION:\s*(.+?)$/s);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'Chart',
      insight: confessionMatch ? confessionMatch[1].trim() : 'No insight available.',
    };
  }

  async generateQuickConfession(
    question: string,
    dataSummaries: string,
    audience: string,
    tone: 'serious' | 'gossip' = 'serious'
  ): Promise<{ confession: string; talkingPoints: string[] }> {
    const { chat } = await import('./engine-client');

    const role = tone === 'gossip' ? 'gossip' : 'analysis';

    let fullAnswer = '';
    await chat(
      {
        role,
        question,
        contextSummary: dataSummaries,
        projectMeta: {
          name: 'Quick Confession',
          audience: audience as 'self' | 'team' | 'exec',
        },
      },
      (chunk) => {
        fullAnswer += chunk;
      }
    );

    // Parse CONFESSION and talking points from EVIDENCE
    const confessionMatch = fullAnswer.match(/CONFESSION:\s*(.+?)(?=EVIDENCE:|$)/s);
    const evidenceMatch = fullAnswer.match(/EVIDENCE:\s*(.+?)(?=CAVEATS:|$)/s);

    const confession = confessionMatch ? confessionMatch[1].trim() : fullAnswer.split('EVIDENCE:')[0].trim();
    const talkingPoints = evidenceMatch
      ? evidenceMatch[1].split('\n').map((line: string) => line.replace(/^- /, '').trim()).filter(Boolean)
      : [];

    return {
      confession: confession || 'Unable to generate confession.',
      talkingPoints: talkingPoints.length > 0 ? talkingPoints : ['Review the data and charts for key insights.'],
    };
  }
}

// Factory function to get the appropriate LLM client
export function getLLMClient(): LLMClient {
  // Always use Ollama for local engine
  return new OllamaClient();
}


