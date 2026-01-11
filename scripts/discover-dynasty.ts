import axios from "axios";
import * as cheerio from "cheerio";

async function discoverDynasty() {
  const landingUrl = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meetings&id=1"; // Trial ID
  console.log(`Checking landing: ${landingUrl}`);
  
  try {
    const { data } = await axios.get(landingUrl);
    const $ = cheerio.load(data);
    
    console.log("Found select options for 'id':");
    $("select[name='id'] option").each((i, el) => {
      console.log(`ID: ${$(el).attr("value")} - Name: ${$(el).text()}`);
    });

    console.log("\nFound links:");
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text();
      if (href && (href.includes("meeting") || href.includes("agenda"))) {
        console.log(`Link: ${href} - Text: ${text}`);
      }
    });

  } catch (err: any) {
    console.error("Discovery failed:", err.message);
  }
}

discoverDynasty();

