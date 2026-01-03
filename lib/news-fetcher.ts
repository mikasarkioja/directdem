/**
 * Mock News Fetcher for DirectDem Agora
 * Simulates fetching relevant news from HS.fi and Iltalehti.fi
 */

export interface NewsItem {
  id: string;
  title: string;
  source: "Helsingin Sanomat" | "Iltalehti";
  url: string;
  publishedAt: string;
}

export async function fetchRelevantNews(topic: string): Promise<NewsItem[]> {
  // In a real implementation, we could use an RSS parser or a News API
  // For now, we simulate relevant results based on common Finnish political topics
  
  console.log(`[NewsFetcher] Searching news for: ${topic}`);

  // Artificial delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const mockNews: Record<string, NewsItem[]> = {
    "default": [
      {
        id: "1",
        title: "Asiantuntijat erimielisiä uuden lakimuutoksen vaikutuksista",
        source: "Helsingin Sanomat",
        url: "https://www.hs.fi/politiikka/",
        publishedAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Kysely: Enemmistö suomalaisista kannattaa uudistusta",
        source: "Iltalehti",
        url: "https://www.iltalehti.fi/politiikka/",
        publishedAt: new Date().toISOString()
      },
      {
        id: "3",
        title: "Valtiovarainministeriö varoittaa kustannusten noususta",
        source: "Helsingin Sanomat",
        url: "https://www.hs.fi/talous/",
        publishedAt: new Date().toISOString()
      }
    ],
    "alkoholi": [
      {
        id: "a1",
        title: "Alkoholilain uudistus kuumentaa tunteita eduskunnassa",
        source: "Helsingin Sanomat",
        url: "https://www.hs.fi/politiikka/",
        publishedAt: new Date().toISOString()
      },
      {
        id: "a2",
        title: "THL varoittaa: Viinien tulo ruokakauppoihin lisää haittoja",
        source: "Iltalehti",
        url: "https://www.iltalehti.fi/uutiset/",
        publishedAt: new Date().toISOString()
      },
      {
        id: "a3",
        title: "Pienpanimot iloitsevat: 'Tämä pelastaa suomalaisen käsityöläisoluen'",
        source: "Iltalehti",
        url: "https://www.iltalehti.fi/talous/",
        publishedAt: new Date().toISOString()
      }
    ],
    "liikenne": [
      {
        id: "l1",
        title: "Espoon uusi pyörätieverkosto jakoi mielipiteet valtuustossa",
        source: "Helsingin Sanomat",
        url: "https://www.hs.fi/kaupunki/",
        publishedAt: new Date().toISOString()
      },
      {
        id: "l2",
        title: "Autoilijat raivoissaan: 'Keskusta tukkeutuu täysin'",
        source: "Iltalehti",
        url: "https://www.iltalehti.fi/autot/",
        publishedAt: new Date().toISOString()
      }
    ]
  };

  // Basic keyword matching
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes("alkoholi") || lowerTopic.includes("viini")) return mockNews.alkoholi;
  if (lowerTopic.includes("liikenne") || lowerTopic.includes("pyörä") || lowerTopic.includes("tie")) return mockNews.liikenne;
  
  return mockNews.default;
}

