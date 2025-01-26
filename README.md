# 🌟 ChBot

*A Discord bot to create interactive, character-driven experiences in threads!*

[![Stars](https://img.shields.io/github/stars/EXELVI/CHBot?style=for-the-badge)](https://github.com/EXELVI/CHBot/stargazers)  
[![Issues](https://img.shields.io/github/issues/EXELVI/CHBot?style=for-the-badge)](https://github.com/EXELVI/CHBot/issues)  
[![Last Commit](https://img.shields.io/github/last-commit/EXELVI/CHBot?style=for-the-badge)](https://github.com/EXELVI/CHBot/commits)

---

ChBot is a **Discord bot** designed to make thread-based interactions more fun and engaging by integrating AI-driven responses with customizable characters and scenarios. 🎭 Whether you're roleplaying with friends or creating immersive storytelling experiences, **ChBot** provides the tools you need to bring your threads to life!

## ✨ Features

- 🔗 **Thread Management**: Easily create, edit, and manage threads within Discord channels.
- 🤖 **AI-Powered Conversations**: Seamlessly integrate OpenAI's API for smart, responsive interactions.
- 👥 **User Management**: Add or remove users from threads with a simple command.
- 🎭 **Character Integration**: Add predefined characters or create your own for personalized, dynamic interactions.
- 📝 **Scenario Customization**: Define and edit thread scenarios to set the tone and context for conversations.
- 🗑️ **Message Cleanup**: Bulk delete messages to keep threads clean and organized.

## 🎮 Commands

Here’s a quick look at the commands ChBot provides:  
| Command               | Description                                             |
|-----------------------|---------------------------------------------------------|
| `/createthread`       | Create a new thread to interact with the AI.            |
| `/editthreadscenario` | Set or edit the scenario for a thread.                  |
| `/adduser`            | Add a user to an existing thread.                       |
| `/removeuser`         | Remove a user from a thread.                            |
| `/searchcharacter`    | Search and add characters to threads. Or edit/delete it if you are the owner. |
| `/createcharacter`    | Create your own character for threads.                 |
| `/persona`            | Edit your personal profile or persona.                 |
| `/deletefromhere`     | Delete messages from a specific point in the thread.    |
| `/deletethread`       | Delete a thread entirely.                               |
| `/threadinfo`         | Get detailed information about the current thread.      |

---

## 🚀 Installation

Follow these steps to host ChBot on your own:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/EXELVI/CHBot.git
   cd CHBot
   ```

2. **Install Dependencies**:
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and configure the following:
   ```env
   DISCORD_TOKEN=your-bot-token
   OPENAI_API_KEY=your-openai-key
   mongoURI=your-mongodb-uri
   cloudinary_cloud_name=your-cloudinary-cloud-name
   cloudinary_api_key=your-cloudinary-api-key
   cloudinary_api_secret=your-cloudinary-api-secret
   ```

4. **Start the Bot**:
   Run the bot with:
   ```bash
   pnpm start
   ```

   or if you're using npm:
   ```bash
    npm start
    ```

---

## 🛠️ Technologies

- **Node.js**: Backend runtime environment.
- **Discord.js**: For seamless integration with Discord.
- **OpenAI API**: Powers the bot's AI responses.
- **dotenv**: For environment variable management.
- **MongoDB**: Database for storing thread and user information.
- **Cloudinary**: For image hosting. (Since Discord media links now expire)

---

## 🙌 Contributing

Contributions are always welcome! Open an issue or submit a pull request to help improve ChBot. Thanks!   

---
Made with ❤️ by [EXELVI](https://github.com/EXELVI)
