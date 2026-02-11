import { useEffect } from 'react';

const SCRIPT_ID = 'crm-webchat-script';

const CrmWebchatWidget = () => {
  useEffect(() => {
    const config = {
      endpoint: import.meta.env.VITE_CRM_WEBCHAT_ENDPOINT,
      getEndpoint: import.meta.env.VITE_CRM_WEBCHAT_GET_ENDPOINT,
      widgetUrl: import.meta.env.VITE_WIDGET_URL,
      domain: import.meta.env.VITE_CRM_WEBCHAT_DOMAIN || 'dogcatify.com',
      title: import.meta.env.VITE_CRM_WEBCHAT_TITLE || 'Dogcatify Chat',
      logoUrl: import.meta.env.VITE_CRM_WEBCHAT_LOGO_URL || '/logo-dogcatify.jpg',
      primaryColor: import.meta.env.VITE_CRM_WEBCHAT_PRIMARY_COLOR || '#0D9488',
      secondaryColor: import.meta.env.VITE_CRM_WEBCHAT_SECONDARY_COLOR || '#14B8A6',
      agentColor: import.meta.env.VITE_CRM_WEBCHAT_AGENT_COLOR || '#2563EB',
      backgroundColor: import.meta.env.VITE_CRM_WEBCHAT_BACKGROUND_COLOR || '#F3F4F6',
      statusText: import.meta.env.VITE_CRM_WEBCHAT_STATUS_TEXT || 'En línea',
      welcomeMessage:
        import.meta.env.VITE_CRM_WEBCHAT_WELCOME_MESSAGE ||
        '¡Hola! Soy Dotty, tu asistente virtual de DogCatify. ¿En qué puedo ayudarte hoy?',
      quickReplies: (
        import.meta.env.VITE_CRM_WEBCHAT_QUICK_REPLIES ||
        '¿Qué servicios ofrecen?|¿Cómo reservar?|Horarios de atención|Contacto'
      ).split('|'),
      integrationHeader: 'X-Integration-Key',
      integrationKey: import.meta.env.VITE_CRM_WEBCHAT_INTEGRATION_KEY,
      getIntegrationHeader: 'X-Integration-Key',
      getIntegrationKey: import.meta.env.VITE_CRM_WEBCHAT_GET_INTEGRATION_KEY,
      widgetApiKey: import.meta.env.VITE_WIDGET_APIKEY,
      apiKey: import.meta.env.VITE_CRM_WEBCHAT_API_KEY,
    };

    if (
      !config.endpoint ||
      !config.getEndpoint ||
      !config.integrationKey ||
      !config.getIntegrationKey
    ) {
      console.warn('CRM webchat config is incomplete. Widget will not load.', config);
      return;
    }

    window.CRM_WEBCHAT_CONFIG = config;

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const existingStatus = existing.getAttribute('data-status');
      if (existingStatus === 'loaded') {
        console.info('CRM webchat script already loaded');
        return;
      }
      if (existingStatus === 'loading') {
        console.info('CRM webchat script is already loading');
        return;
      }

      existing.remove();
    }

    const scriptSrc = import.meta.env.VITE_CRM_WEBCHAT_SCRIPT_URL;
    if (!scriptSrc) {
      console.warn('VITE_CRM_WEBCHAT_SCRIPT_URL is not set. Widget will not load.');
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = scriptSrc;
    script.async = true;
    script.setAttribute('data-status', 'loading');
    script.onload = () => {
      script.setAttribute('data-status', 'loaded');
      console.info('CRM webchat script loaded');
    };
    script.onerror = () => {
      script.setAttribute('data-status', 'error');
      console.error('Failed to load CRM webchat script', script.src);
    };
    document.body.appendChild(script);
  }, []);

  return <div id="crm-webchat" />;
};

export default CrmWebchatWidget;
