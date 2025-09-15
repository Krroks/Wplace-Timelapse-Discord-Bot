# Wplace-Timelapse-Discord-Bot

This is a Discord bot developed in Node.js that periodically downloads a set of images from specific URLs, combines them into a grid, crops the result, and posts it to a designated Discord channel.

It is an ideal tool for monitoring frequently updated images, such as collaborative canvases or visual status dashboards.

## ✨ Key Features

*   **Image Downloading**: Downloads up to 4 images from the URLs you specify.
*   **Grid Combination**: Merges the 4 images into a single 2x2 grid image.
*   **Custom Cropping**: Crops the final image according to the coordinates and dimensions you define.
*   **Automatic Posting**: Sends the processed image to a Discord channel at regular intervals (every 15 minutes in the current script).
*   **Manual Command**: Allows you to trigger the process manually using the `!test-images` command.
*   **Flexible Configuration**: All settings are managed through a `.env` file, making it easy to customize without modifying the code.
*   **File Management**: Automatically creates and cleans up the temporary files needed for processing.

## 🛠️ Prerequisites

*   [Node.js](https://nodejs.org/) (version 16.x or higher recommended).
*   A Discord bot and its token. You can create one on the [Discord Developer Portal](https://discord.com/developers/applications).
*   The ID of the Discord channel where you want the images to be posted.

## ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repository.git
    cd your-repository
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the environment variables:**
    Create a file named `.env` in the root of the project and add the following variables. You can use the `.env.example` file as a template.

    ```bash
    # .env.example
    
    # Your Discord bot token
    DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
    
    # The ID of the channel where images will be posted
    DISCORD_CHANNEL_ID="YOUR_CHANNEL_ID_HERE"
    # URLs of the 4 images to process (in JSON array format)
    IMAGE_URLS='["URL_IMAGE_1", "URL_IMAGE_2", "URL_IMAGE_3", "URL_IMAGE_4"]'
    
    # Dimensions for the final crop
    IMAGE_WIDTH_SIZE=1000
    IMAGE_HEIGHT_SIZE=500
    
    # Starting coordinates for the crop (top-left corner)
    IMAGE_LEFT_START=500
    IMAGE_TOP_START=250
    ```

## 🚀 Usage

To start the bot, run the following command in your terminal:

```bash
node index.js
```

The bot will connect to Discord, print a confirmation message, and perform the first post. From then on, it will automatically repeat the process every 15 minutes.

### Available Commands

*   `!test-images`: Send this message in any channel where the bot is present to manually trigger the image creation and posting process.

## 📦 Dependencies Used

*   [discord.js](https://discord.js.org/): The main library for interacting with the Discord API.
*   [sharp](https://sharp.pixelplumbing.com/): A high-performance library for image processing and manipulation.
*   [axios](https://axios-http.com/): An HTTP client for downloading images from URLs.
*   [dotenv](https://github.com/motdotla/dotenv): For loading environment variables from the `.env` file.