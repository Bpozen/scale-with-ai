-- Seed categories
INSERT INTO categories (slug, name_de, name_en, description_de, sort_order) VALUES
('text-ki', 'Text & Content KI', 'Text & Content AI', 'KI-Tools für Textgenerierung, Copywriting und Content-Erstellung', 1),
('bild-ki', 'Bild & Design KI', 'Image & Design AI', 'KI-Tools für Bildgenerierung, Design und visuelle Inhalte', 2),
('audio-ki', 'Audio & Sprache KI', 'Audio & Voice AI', 'KI-Tools für Sprachsynthese, Transkription und Audio', 3),
('video-ki', 'Video KI', 'Video AI', 'KI-Tools für Videobearbeitung und Generierung', 4),
('automation', 'Automation', 'Automation', 'KI-gestützte Workflow-Automatisierung', 5),
('chatbot', 'Chatbots & Assistants', 'Chatbots & Assistants', 'KI-Chatbots und virtuelle Assistenten', 6),
('datenanalyse', 'Datenanalyse KI', 'Data Analysis AI', 'KI-Tools für Datenanalyse und Business Intelligence', 7),
('seo-ki', 'SEO & Marketing KI', 'SEO & Marketing AI', 'KI-Tools für Suchmaschinenoptimierung und Marketing', 8),
('code-ki', 'Code & Entwicklung KI', 'Code & Development AI', 'KI-Tools für Softwareentwicklung und Coding', 9),
('praesentation', 'Präsentation KI', 'Presentation AI', 'KI-Tools für Präsentationen und Dokumente', 10);

-- Seed features
INSERT INTO features (slug, name_de) VALUES
('deutsche-sprache', 'Deutsche Sprache'),
('ds-gvo-konform', 'DSGVO-konform'),
('eu-server', 'EU-Server'),
('kostenlos', 'Kostenlos verfügbar'),
('api-verfuegbar', 'API verfügbar'),
('browser-extension', 'Browser-Erweiterung'),
('team-funktionen', 'Team-Funktionen'),
('white-label', 'White-Label'),
('mobile-app', 'Mobile App'),
('offline-nutzung', 'Offline-Nutzung');

-- Seed one demo tool
INSERT INTO tools (
  slug, name, website_url, logo_url, description_de, description_en,
  pricing_model, price_from, has_free_tier, has_affiliate,
  gdpr_compliant, dsgvo_status, server_location, data_processing_agreement,
  is_published
) VALUES (
  'chatgpt', 'ChatGPT', 'https://chatgpt.com', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  'OpenAIs Konversations-KI für Textgenerierung, Code-Hilfe und Brainstorming. Beliebt für schnelle Antworten und kreative Texte.',
  'OpenAI conversational AI for text generation, coding help, and brainstorming.',
  'freemium', 0, true, false,
  false, 'unklar', 'USA', false,
  true
);

-- Link tool to categories
INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id FROM tools t, categories c WHERE t.slug = 'chatgpt' AND c.slug = 'text-ki';

INSERT INTO tool_categories (tool_id, category_id)
SELECT t.id, c.id FROM tools t, categories c WHERE t.slug = 'chatgpt' AND c.slug = 'code-ki';
