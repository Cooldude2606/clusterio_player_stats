import React, { useContext, useEffect, useState } from "react";
// import { } from "antd";

import {
	BaseWebPlugin, PageLayout, Control, ControlContext, notifyErrorHandler,
} from "@clusterio/web_ui";

import * as lib from "@clusterio/lib";
import { PluginExampleEvent, PluginExampleRequest } from "../messages";

function MyTemplatePage() {
	let control = useContext(ControlContext);

	return <PageLayout nav={[{ name: "player_stats" }]}>
		<h2>player_stats</h2>
	</PageLayout>;
}

export class WebPlugin extends BaseWebPlugin {
	async init() {
		this.pages = [
			{
				path: "/player_stats",
				sidebarName: "player_stats",
				permission: "player_stats.page.view",
				content: <MyTemplatePage/>,
			},
		];

		this.control.handle(PluginExampleEvent, this.handlePluginExampleEvent.bind(this));
		this.control.handle(PluginExampleRequest, this.handlePluginExampleRequest.bind(this));
	}

	async handlePluginExampleEvent(event: PluginExampleEvent) {
		this.logger.info(JSON.stringify(event));
	}

	async handlePluginExampleRequest(request: PluginExampleRequest) {
		this.logger.info(JSON.stringify(request));
		return {
			myResponseString: request.myString,
			myResponseNumbers: request.myNumberArray,
		};
	}
}
