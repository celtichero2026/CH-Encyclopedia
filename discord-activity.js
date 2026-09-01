const DISCORD_CLIENT_ID = "1544123374513430528";

const params = new URLSearchParams(window.location.search);
const looksLikeDiscordActivity =
  params.has("frame_id") ||
  params.has("instance_id") ||
  params.has("platform") ||
  window.location.hostname.endsWith(".discordsays.com");

window.CHE_DISCORD = {
  clientId: DISCORD_CLIENT_ID,
  isActivity: looksLikeDiscordActivity,
  ready: false,
  sdk: null,
};

if (looksLikeDiscordActivity) {
  document.documentElement.classList.add("discord-activity");

  (async () => {
    try {
      const { DiscordSDK } = await import(
        "https://cdn.jsdelivr.net/npm/@discord/embedded-app-sdk@2.5.0/+esm"
      );

      const discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
      window.CHE_DISCORD.sdk = discordSdk;

      await discordSdk.ready();

      window.CHE_DISCORD.ready = true;
      document.documentElement.classList.add("discord-sdk-ready");
      document.documentElement.dataset.discordActivity = "ready";

      window.dispatchEvent(new CustomEvent("che:discord-ready", {
        detail: { discordSdk }
      }));
    } catch (error) {
      console.warn("Celtic Heroes Encyclopedia: Discord SDK initialization failed.", error);
      document.documentElement.classList.add("discord-sdk-error");
      document.documentElement.dataset.discordActivity = "fallback";
    }
  })();
}
