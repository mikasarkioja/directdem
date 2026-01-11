import axios from "axios";
import * as cheerio from "cheerio";

async function inspectMeetingItem() {
  const url = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meetingitem&id=20251553-3";
  console.log(`Inspecting meeting item: ${url}`);
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    console.log("Page Text (first 2000 chars):");
    console.log($("body").text().replace(/\s+/g, ' ').substring(0, 2000));

    console.log("\nMajor IDs/Classes:");
    $("*[id], *[class]").each((i, el) => {
      const id = $(el).attr("id");
      const cls = $(el).attr("class");
      if (id || cls) {
        console.log(`Tag: ${el.tagName}, ID: ${id || ''}, Class: ${cls || ''}`);
      }
    });

  } catch (err: any) {
    console.error("Inspection failed:", err.message);
  }
}

inspectMeetingItem();

