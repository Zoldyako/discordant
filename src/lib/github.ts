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

export async function listIssuesWithLabels(
    owner: string,
    repo: string,
    labels: string[]
): Promise<GithubIssue[]> {
    try {
        // A API do GitHub com labels separados por vírgula retorna issues com TODAS as labels
        // Para buscar issues com QUALQUER uma das labels, precisamos fazer chamadas separadas
        const allIssues: GithubIssue[] = [];
        const seenIds = new Set<number>();

        for (const label of labels) {
            const { data } = await octokit.rest.issues.listForRepo({
                owner,
                repo,
                state: 'open',
                labels: label,
                sort: 'created',
                direction: 'desc',
                per_page: 10,
            });

            for (const issue of data) {
                if (!seenIds.has(issue.id)) {
                    seenIds.add(issue.id);
                    allIssues.push(issue as GithubIssue);
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
