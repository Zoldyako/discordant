import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commandList } from './commands/index.js';

const rest = new REST().setToken(config.discord.token);
const commands = commandList.map(cmd => cmd.data.toJSON());

try {
    console.log(`Iniciando atualização de ${commands.length} comandos slash.`);

    const data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands },
    ) as Array<unknown>;

    console.log(`Sucesso! ${data.length} comandos registrados.`);
} catch (error) {
    console.error(error);
}
