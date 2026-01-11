import axios from "axios";
import * as cheerio from "cheerio";

async function checkMeeting(id: string) {
  const url = `https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meeting&id=${id}`;
  console.log(`Checking meeting: ${url}`);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  let count = 0;
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("meetingitem")) {
      count++;
      console.log(`[${count}] ${$(el).text().trim()} -> HREF: ${href}`);
    }
  });
  console.log(`Total items found: ${count}`);
}

checkMeeting("20251504");

