/// <reference types="vite/client" />

export {};

declare global {
	interface Window {
		CRM_WEBCHAT_CONFIG?: {
			endpoint: string;
			getEndpoint: string;
			widgetUrl?: string;
			domain: string;
			title: string;
			logoUrl: string;
			primaryColor: string;
			secondaryColor: string;
			agentColor: string;
			backgroundColor: string;
			statusText: string;
			welcomeMessage: string;
			quickReplies: string[];
			integrationHeader: string;
			integrationKey: string;
			getIntegrationHeader: string;
			getIntegrationKey: string;
			widgetApiKey?: string;
			apiKey: string;
		};
	}
}
