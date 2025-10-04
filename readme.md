# Pixelcade

![PixelcadeLogo](https://hc-cdn.hel1.your-objectstorage.com/s/v3/01f2434af778c819c07fdc0bcd04fac3776cc630_logolight.png)

Pixelcade is a site where you can create an account, play games, level up, customize your avatar, and rank up on the leaderboards. This was created for the [HackClub](https://hackclub.com) YSWS (You Ship We Ship) [Siege](https://siege.hackclub.com).

## Features

- Signup and login (Using Slack OAuth | or | one time email codes.)
- Ability to view peoples profiles.
- Ability to change usernames.
- Ability to create games using a Sprite editor and high level programming language, as well as play them
- Play counters and ability to like games.
- Documentation for how to create a game

## Planned Features

- Ability to buy avatar items.
- Full JS games.
- Ability to set custom backgrounds for the game.

## Installation

1. **Clone the repo**

```bash
git clone https://github.com/sebcun/arcade.git
cd arcade
```

2.  **Install the requirements**

```py
pip install -r requirements.txt
```

3. **Setup .env**
   Create a file named `.env` with the following contents:

```env
SECRET_KEY=YourWebsiteSecretKey
WEBSITE=https://YourWebsite.com
```

## Usage

**Run the app**

```py
py app.py
```

**Access the website**
By default, the website will be accessable on [https://localhost:5000](https://localhost:5000).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss.

## License

This project uses the [GNU GENERAL PUBLIC LICENSE](https://github.com/sebcun/arcade/blob/main/LICENSE)
