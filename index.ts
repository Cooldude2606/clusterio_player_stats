import * as lib from "@clusterio/lib";

import * as Messages from "./messages";

lib.definePermission({
	name: "player_stats.main_page.view",
	title: "View player statistics",
	description: "View the cluster statistics of all players",
});

lib.definePermission({
	name: "player_stats.main_page.subscribe",
	title: "View player statistics",
	description: "View the cluster statistics of all players",
});

lib.definePermission({
	name: "player_stats.train_hit.view",
	title: "View last train hit",
	description: "View when someone was last hit by a train on the cluster",
});

lib.definePermission({
	name: "player_stats.train_hit.subscribe",
	title: "View last train hit",
	description: "View when someone was last hit by a train on the cluster",
});

export const plugin: lib.PluginDeclaration = {
	name: "player_stats",
	title: "Player Statistics",
	description: "Collect statistics from in game events for all players",
	webEntrypoint: "./web",
	controllerEntrypoint: "dist/plugin/controller",
	instanceEntrypoint: "dist/plugin/instance",

	routes: [
		"/player_stats",
		"/train_hits",
	],

	messages: [
		Messages.PlayerSessionExportEvent,
		Messages.PlayerSessionUpdateEvent,
		Messages.PlayerHitByTrainEvent,
		Messages.PlayerTrainHitUpdateEvent,
	],
};
