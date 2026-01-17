import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { 
  fetchEspooDynastyLinks, 
  fetchMeetingItems, 
  fetchDynastyContent, 
  DynastyDocType 
} from '../lib/scrapers/espoo-dynasty';

// Mockataan axios
vi.mock('axios');

describe('Espoo-vahti Scraper integraatiotesti', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchEspooDynastyLinks hakee ja parsii linkit oikein', async () => {
    // 1. Luodaan 'feikki' HTML-vastaus
    const mockHtml = `
      <html>
        <body>
          <a href="DREQUEST.PHP?page=meeting_minutes&id=123">Valtuuston kokous 17.01.2026</a>
          <a href="DREQUEST.PHP?page=muu_sivu">Muu sivu</a>
        </body>
      </html>
    `;

    (axios.get as any).mockResolvedValue({ data: mockHtml });

    // 2. Ajetaan funktio
    const links = await fetchEspooDynastyLinks();

    // 3. Varmistetaan tulokset
    expect(links.length).toBe(1);
    expect(links[0].title).toContain('Valtuuston kokous');
    expect(links[0].dateHint).toBe('17.01.2026');
    expect(links[0].type).toBe(DynastyDocType.MEETING_MINUTES);
    expect(links[0].url).toContain('meeting_minutes');
  });

  it('fetchMeetingItems löytää asiat ja PDF-linkit', async () => {
    const mockMeetingHtml = `
      <table>
        <tr>
          <td>
            <a href="DREQUEST.PHP?page=meetingitem&id=456">Asia 1: Koulun rakentaminen</a>
          </td>
          <td>
            <a href="DREQUEST.PHP?page=pdf&id=789">Lataa PDF</a>
          </td>
        </tr>
      </table>
    `;

    (axios.get as any).mockResolvedValue({ data: mockMeetingHtml });

    const items = await fetchMeetingItems('https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meeting_minutes&id=123');

    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Asia 1: Koulun rakentaminen');
    expect(items[0].pdfUrl).toContain('page=pdf');
  });

  it('fetchDynastyContent parsii selostuksen ja päätösehdotuksen', async () => {
    const mockContentHtml = `
      <div class="data-part-block-htm">
        <h2>Selostus</h2>
        <p>Tämä on testiselostus koulun rakentamisesta Tapiolaan.</p>
        <h2>Päätösehdotus</h2>
        <p>Ehdotetaan, että koulu rakennetaan.</p>
      </div>
    `;

    (axios.get as any).mockResolvedValue({ data: mockContentHtml });

    const content = await fetchDynastyContent({
      title: 'Testi-asia',
      url: 'http://example.com',
      type: DynastyDocType.MEETING_ITEM,
      dateHint: ''
    });

    expect(content).not.toBeNull();
    expect(content?.description).toContain('testiselostus');
    expect(content?.proposal).toContain('koulu rakennetaan');
  });

  it('virheenkäsittely: palauttaa tyhjän listan jos haku epäonnistuu', async () => {
    // Mockataan 500-virhe
    (axios.get as any).mockRejectedValue(new Error('Internal Server Error'));

    const links = await fetchEspooDynastyLinks();
    expect(links).toEqual([]);
  });
});

// Esimerkki siitä, miten päivämäärämuunnos voitaisiin testata jos se olisi erillinen apufunktio
describe('Päivämäärän parsiminen', () => {
  it('muuttaa suomalaisen päivämäärän ISO-muotoon', () => {
    const finnishDate = '17.01.2026';
    const [day, month, year] = finnishDate.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0); // Tammikuu on 0
    expect(date.getDate()).toBe(17);
  });
});


