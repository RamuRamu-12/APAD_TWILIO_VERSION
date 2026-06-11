CRAWLER_KEYWORDS = (
    "whatsapp",
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "telegrambot",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "googlebot",
    "bingbot",
    "googleimageproxy",
    "yahoo",
    "outlook",
    "mail.ru",
)


def is_crawler(user_agent: str | None) -> bool:
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(k in ua for k in CRAWLER_KEYWORDS)
