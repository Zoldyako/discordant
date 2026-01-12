import type { ChatInputCommandInteraction } from 'discord.js';

export interface GithubIssue {
    id: number;
    node_id: string;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    labels: Array<{
        id: number;
        name: string;
        color: string;
    }>;
    user: {
        login: string;
    } | null;
}

export type IssueType = 'epic' | 'story';

export interface Command {
    data: {
        name: string;
        description: string;
        toJSON?: () => unknown;
    };
    execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
}
