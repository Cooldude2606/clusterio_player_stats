import * as lib from "@clusterio/lib";

import { PluginExampleEvent, PluginExampleRequest } from "./messages";

lib.definePermission({
	name: "player_stats.example.permission.event",
	title: "Example permission event",
	description: "My plugin's example permission that I forgot to remove",
});

lib.definePermission({
	name: "player_stats.example.permission.request",
	title: "Example permission request",
	description: "My plugin's example permission that I forgot to remove",
});

lib.definePermission({
	name: "player_stats.page.view",
	title: "Example page view permission",
	description: "My plugin's example page permission that I forgot to remove",
});

declare module "@clusterio/lib" {
	export interface ControllerConfigFields {
		"player_stats.myControllerField": string;
	}
	export interface InstanceConfigFields {
		"player_stats.myInstanceField": string;
	}
}

export const plugin: lib.PluginDeclaration = {
	name: "player_stats",
	title: "player_stats",
	description: "I didn't update my description",
	webEntrypoint: "./web",
	controllerEntrypoint: "dist/plugin/controller",
	instanceEntrypoint: "dist/plugin/instance",
	
	controllerConfigFields: {
		"player_stats.myControllerField": {
			title: "My Controller Field",
			description: "This should be removed",
			type: "string",
			initialValue: "Remove Me",
		},
	},
	instanceConfigFields: {
		"player_stats.myInstanceField": {
			title: "My Instance Field",
			description: "This should be removed",
			type: "string",
			initialValue: "Remove Me",
		},
	},

	messages: [
		PluginExampleEvent,
		PluginExampleRequest,
	],
};
