import axios from "axios";


async function scrape() {
    const { data } = await axios.get("https://google.com")
    console.log(data)
}

scrape()