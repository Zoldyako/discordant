import { Octokit } from '@octokit/rest';
import { config } from '../config.js';
import type { GithubIssue } from '../types.js';

const octokit = new Octokit({ auth: config.github.token });

export async function createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels: string[] = []
): Promise<GithubIssue> {
    try {
        const { data } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
            labels,
        });
        return data as GithubIssue;
    } catch (error) {
        console.error('Erro ao criar issue no GitHub:', error);
        throw error;
    }
}

export async function addIssueToProject(
    issueNodeId: string,
    projectId: string
): Promise<void> {
    try {
        const mutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item {
            id
          }
        }
      }
    `;

        await octokit.graphql(mutation, {
            projectId,
            contentId: issueNodeId,
        });
    } catch (error) {
        console.error('Erro ao adicionar ao projeto:', error);
        throw error;
    }
}

export async function listIssuesWithTypes(
    owner: string,
    repo: string,
    types: string[]
): Promise<GithubIssue[]> {
    try {
        // Busca issues por type (não label)
        const allIssues: GithubIssue[] = [];
        const seenIds = new Set<number>();

        // Mapeia type do GitHub para IssueType interno
        const { epic: EPIC_TYPE, story: STORY_TYPE } = config.github.types;

        for (const type of types) {
            const query = `repo:${owner}/${repo} is:issue is:open type:"${type}"`;
            console.log(`[GitHub] Query de busca: ${query}`);

            const { data } = await octokit.rest.search.issuesAndPullRequests({
                q: query,
                sort: 'created',
                order: 'desc',
                per_page: 20,
            });

            console.log(`[GitHub] Type "${type}": ${data.total_count} issues`);

            // Determina o issueType baseado no type EXATO do GitHub
            let issueType: 'epic' | 'story' | undefined;
            if (type === EPIC_TYPE) {
                issueType = 'epic';
            } else if (type === STORY_TYPE) {
                issueType = 'story';
            }

            // Se não é um type conhecido, pula
            if (!issueType) {
                console.log(`[GitHub] Type "${type}" não reconhecido, pulando...`);
                continue;
            }

            for (const issue of data.items) {
                if (!seenIds.has(issue.id)) {
                    seenIds.add(issue.id);
                    // Adiciona o issueType à issue
                    allIssues.push({
                        ...issue,
                        issueType,
                    } as GithubIssue);
                }
            }
        }

        return allIssues;
    } catch (error) {
        console.error('Erro ao buscar issues:', error);
        return [];
    }
}

export async function addLabelToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    label: string
): Promise<void> {
    try {
        await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: issueNumber,
            labels: [label],
        });
    } catch (error) {
        console.error(`Erro ao adicionar label '${label}' à issue #${issueNumber}:`, error);
        throw error;
    }
}

export async function removeLabelFromIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    label: string
): Promise<void> {
    try {
        await octokit.rest.issues.removeLabel({
            owner,
            repo,
            issue_number: issueNumber,
            name: label,
        });
    } catch (error) {
        // Ignora erro se a label não existe na issue
        if ((error as { status?: number }).status !== 404) {
            console.error(`Erro ao remover label '${label}' da issue #${issueNumber}:`, error);
            throw error;
        }
    }
}
