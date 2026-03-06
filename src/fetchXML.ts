import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
    channel: {
        title: string;
        link: string;
        description: string;
        item: RSSItem[];
    };
};

type RSSItem = {
    title: string;
    link: string;
    description: string;
    pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
    const response = await fetch(feedURL, {
        headers: {
            "User-Agent": "gator",
        },
    });

    const xml = await response.text();
    const parser = new XMLParser();
    const result = parser.parse(xml);
    const channel = result.rss?.channel;
    if (!channel){
        throw new Error(`invalid RSS feed: missing channel`);
    }

    const { title, link, description } = channel;
    if (!title || !link || !description) {
        throw new Error(`Invalid RSS feed: missing title, link, or description`);
    }

    let items;
    if (channel?.item){
        if (Array.isArray(channel?.item)){
            items = [...channel.item]
        } else {
            items = [];
            items.push(channel.item);
        }
    } else {
        items = []
    }

    const validItems: RSSItem[] = items.filter((items: any) => items.title && items.link
        && items.description && items.pubDate).map((items: any) => ({
            title: items.title,
            link: items.link,
            description: items.description,
            pubDate: items.pubDate,
        }));

    return {
        channel: {
            title,
            link,
            description,
            item: validItems,
        },
    };

}