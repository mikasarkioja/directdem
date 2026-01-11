import axios from "axios";
import * as cheerio from "cheerio";

async function inspectMeeting() {
  const url = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meeting&id=20251553";
  console.log(`Inspecting meeting: ${url}`);
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    console.log("All links in meeting page:");
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href) {
        console.log(`Link: ${href} - Text: ${text}`);
      }
    });

  } catch (err: any) {
    console.error("Inspection failed:", err.message);
  }
}

inspectMeeting();

