import { Events } from 'discord.js';
import { client, commands } from './lib/discord.js';
import { config } from './config.js';
import { pollPrivateRepoIssues } from './handlers/issue.js';
import { commandList } from './commands/index.js';

// Event: Bot pronto
client.once(Events.ClientReady, () => {
    console.log(`→ Bot conectado como ${client.user?.tag}`);

    // Carrega comandos
    for (const cmd of commandList) {
        commands.set(cmd.data.name, cmd);
    }

    // Executar imediatamente
    pollPrivateRepoIssues();

    // Polling a cada 2 minutos
    setInterval(pollPrivateRepoIssues, 120000);
});


// Evento de interação
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Erro ao executar comando!', ephemeral: true });
    }
});


// Tratamento de erros
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Inicialização
await client.login(config.discord.token);
