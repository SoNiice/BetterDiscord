/**
 * @name MassMover
 * @updateUrl https://raw.githubusercontent.com/SoNiice/BetterDiscord/main/MassMover.plugin.js
 */

module.exports = (() => {
    const config = {
        info: {
            name: "MassMover",
            authors: [
                {
                    name: "SoNiice",
                    discord_id: "200913258658529280",
                    github_username: "SoNiice",
                    twitter_username: "iTSONiiCEXD"
                }
            ],
            version: "1.0.2",
            description: "Allows you to mass move users from voice channels"
        },
        changelog: [
            {
                title: 'Version 1.0.2',
                type: 'fixed',
                items: ['Fixed a bug where other channels than VOICE / STAGE_VOICE channels were shown in the context menu.']
            },
            {
                title: 'Version 1.0.1',
                type: 'fixed',
                items: ['Added check for MOVE_MEMBERS permissions before showing the submenu.']
            },
            {
                title: 'First release!',
                type: 'fixed',
                items: ['pog']
            }
        ]
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }

        getName() {
            return config.info.name;
        }

        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }

        getDescription() {
            return config.info.description;
        }

        getVersion() {
            return config.info.version;
        }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {WebpackModules, DiscordModules, DiscordAPI, Patcher, DCM} = Api;
            const {React, DiscordConstants, ChannelStore} = DiscordModules;

            const getVoiceStates = (channelId) => WebpackModules.getByProps("getVoiceStatesForChannel").getVoiceStatesForChannel(channelId);

            const getGuildChannels = (...guildIds) => {
                const channels = ChannelStore.getGuildChannels ? Object.values(ChannelStore.getGuildChannels()) : ChannelStore.getMutableGuildChannels ? Object.values(ChannelStore.getMutableGuildChannels()) : [];
                return channels.filter(c => guildIds.includes(c.guild_id) && (c.type === DiscordConstants.ChannelTypes.GUILD_VOICE || c.type === DiscordConstants.ChannelTypes.GUILD_STAGE_VOICE));
            }

            return class MassMover extends Plugin {
                constructor() {
                    super();
                }

                onStart() {
                    this.patchVoiceChannelContextMenu();
                }

                onStop() {
                    Patcher.unpatchAll(null);
                }

                massMove(guildId, channelFrom, channelTo) {
                    for (const [userId, user] of Object.entries(getVoiceStates(channelFrom))) {
                        DiscordModules.GuildActions.setChannel(guildId, userId, channelTo);
                    }
                }

                patchVoiceChannelContextMenu() {
                    const [VoiceChannelContextMenu] = WebpackModules.getModules(m => m.default && m.default.displayName === "ChannelListVoiceChannelContextMenu");

                    Patcher.after(VoiceChannelContextMenu, "default", (_, [props], retVal) => {
                        const channels = [];

                        getGuildChannels(props.guild.id).sort((a, b) => (a.position > b.position) ? 1 : ((b.position > a.position) ? -1 : 0)).forEach(c => {
                            channels.push({
                                label: c.name,
                                action: () => this.massMove(props.guild.id, props.channel.id, c.id)
                            })
                        });

                        retVal.props.children.unshift(
                            DCM.buildMenuChildren([{
                                type: "group",
                                items: [
                                    {
                                        type: "submenu",
                                        label: "MassMover",
                                        items: channels
                                    }
                                ]
                            }])
                        );
                    });
                }
            }
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
