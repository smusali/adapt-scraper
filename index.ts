import axios from "axios";
import cheerio from "cheerio"


async function scrape() {
    const { data } = await axios.get("https://google.com")
    const $ = cheerio.load(data)
    console.log($('body').html())
}

scrape()