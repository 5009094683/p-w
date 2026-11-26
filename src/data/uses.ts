/**
 * What Bhautik uses, carried over from the list he keeps on this site.
 * Notes are his where they say something specific; otherwise an entry just
 * says what the thing is. Amazon short links are his affiliate links.
 */

export interface UseItem {
  name: string;
  url?: string;
  note?: string;
  /** An Amazon affiliate link: marked as sponsored and covered by the disclosure on the page. */
  affiliate?: boolean;
}

export interface UseGroup {
  id: string;
  title: string;
  intro?: string;
  items: UseItem[];
}

const amazon = (code: string) => ({ url: `https://amzn.to/${code}`, affiliate: true });

export const uses: UseGroup[] = [
  {
    id: 'devices',
    title: 'Devices',
    items: [
      {
        name: 'MacBook Pro 14-inch',
        url: 'https://www.apple.com/macbook-pro/',
        note: 'M4 Pro with a 14-core CPU and 20-core GPU, 48 GB of memory and 3 TB of storage. Just love it.',
      },
      { name: 'Asus TUF F15 (15-inch, 2021)', ...amazon('40dTJV0'), note: 'The TUF is just amazing, with 16 GB of memory.' },
      { name: 'iPhone 16 Pro Max', url: 'https://www.apple.com/iphone/', note: 'The phone I use for work.' },
      { name: 'Xiaomi 15 Ultra', url: 'https://www.mi.com/global/product/xiaomi-15-ultra/' },
      { name: 'iPad Pro (M4)', url: 'https://www.apple.com/ipad-pro/' },
      {
        name: 'Dell UltraSharp 40 Curved Thunderbolt Hub Monitor (U4025QW)',
        url: 'https://www.dell.com/en-in/shop/dell-ultrasharp-40-curved-thunderbolt-hub-monitor-u4025qw/apd/210-bmcx/monitors-monitor-accessories',
        note: 'Size matters.',
      },
      { name: 'Samsung 27-inch monitor', ...amazon('3FzfVzy') },
      {
        name: 'Logitech G502 HERO',
        ...amazon('49dbtEL'),
        note: 'Adjustable weights, programmable buttons and continuous scrolling.',
      },
      { name: 'Logitech G402', ...amazon('3SiLCob'), note: 'Backup mouse.' },
      { name: 'Logitech G512 mechanical keyboard', ...amazon('47aqRzy') },
      { name: 'Cosmic Byte CB-GK-16 mechanical keyboard', ...amazon('40fPcl6'), note: 'Backup keyboard.' },
      { name: 'Tukzer large mouse pad', ...amazon('45T0QDw') },
      { name: 'Ergonomic chair', note: 'I sit all day, so I might as well have a good chair.' },
      { name: 'DJI Osmo 360', url: 'https://www.dji.com/osmo-360' },
      { name: 'Ledger Stax', url: 'https://shop.ledger.com/pages/ledger-stax' },
    ],
  },
  {
    id: 'storage-and-power',
    title: 'Storage and power',
    items: [
      {
        name: 'Trebleet Thunderbolt 5 SSD enclosure',
        url: 'https://www.trebleet.com/',
        note: 'Transfers at up to 80 Gbps.',
      },
      { name: 'Samsung 990 PRO, 4 TB', url: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/' },
      {
        name: 'WD SN580 NVMe SSD, 1 TB',
        url: 'https://shop.sandisk.com/en-ie/products/ssd/internal-ssd/wd-blue-sn580-nvme-ssd',
      },
      {
        name: 'SanDisk Extreme PRO microSDXC, 1 TB',
        url: 'https://shop.sandisk.com/en-in/products/memory-cards/microsd-cards/sandisk-extreme-pro-uhs-i-microsd',
      },
      {
        name: 'WD Elements portable hard drive, 1 TB',
        url: 'https://www.westerndigital.com/en-in/products/portable-drives/wd-elements-portable-usb-3-0-hdd',
      },
      {
        name: 'UGREEN Nexode 300W GaN charger',
        url: 'https://www.ugreen.com/products/ugreen-300w-desktop-usb-c-gan-charger',
      },
      {
        name: 'UGREEN Nexode power bank, 25,000 mAh, 200W',
        url: 'https://www.ugreen.com/collections/power-bank/products/ugreen-nexode-power-bank-25000mah-200w-with-smart-digital-display',
      },
      { name: 'UGREEN cables and accessories', url: 'https://www.ugreen.com/', note: 'Everything else that plugs in.' },
    ],
  },
  {
    id: 'audio',
    title: 'Audio',
    items: [
      { name: 'Shure MV7+', ...amazon('41yhVmp'), note: 'My first choice for a smooth sound.' },
      { name: 'RØDE PSA1 boom arm', url: 'https://rode.com/en/accessories/stands-bars/psa1', note: 'Stays quiet when it moves.' },
      { name: 'Sony WH-1000XM6', url: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm6-b' },
      { name: 'AirPods Pro 2', url: 'https://www.apple.com/airpods-pro/' },
      { name: 'OnePlus Buds 2', ...amazon('49cXFJS'), note: 'Premium quality and a solid build.' },
      { name: 'Redgear Cosmo 7.1', ...amazon('4gdr2yl'), note: 'An all-round, rough-and-tough headset.' },
      { name: 'Echo Dot', ...amazon('3tOO7EF'), note: 'An average speaker. Not one I would recommend.' },
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    items: [
      { name: 'tomtoc Travel Backpack 40L', url: 'https://www.tomtoc.com/products/40l-travel-backpack-carry-on' },
      { name: 'Decathlon Quechua hiking backpack 23L', url: 'https://www.decathlon.in/' },
      { name: 'Decathlon', url: 'https://www.decathlon.in/', note: 'Almost all of my backpacking gear.' },
    ],
  },
  {
    id: 'custom-builds',
    title: 'Custom builds',
    intro: 'Things I had made for my own desk. Ask me about any of them.',
    items: [
      { name: 'Standing desk' },
      { name: 'Metal power strip with 20 sockets' },
      { name: 'Metal cable management box' },
      { name: 'Assorted custom accessories' },
    ],
  },
  {
    id: 'coding',
    title: 'Coding and terminal',
    items: [
      { name: 'Visual Studio Code', url: 'https://code.visualstudio.com', note: 'Code editor.' },
      {
        name: 'Vitesse theme',
        url: 'https://marketplace.visualstudio.com/items?itemName=antfu.theme-vitesse',
        note: 'Editor theme by Anthony Fu.',
      },
      { name: 'Fira Code', url: 'https://github.com/tonsky/FiraCode', note: 'Monospaced font with ligatures.' },
      { name: 'Hyper', url: 'https://hyper.is', note: 'Terminal.' },
      { name: 'Nushell', url: 'https://www.nushell.sh/', note: 'A new type of shell.' },
      { name: 'Oh My Zsh', url: 'https://ohmyz.sh', note: 'Plugin framework for Zsh.' },
      { name: 'Termius', url: 'https://termius.com/', note: 'SSH, SFTP and port forwarding.' },
      { name: 'WSL', url: 'https://learn.microsoft.com/windows/wsl/install', note: 'Windows Subsystem for Linux.' },
    ],
  },
  {
    id: 'apps',
    title: 'Apps',
    items: [
      { name: 'FlavorGPT', url: 'https://flavor-ai.tech/', note: 'The AI workspace I am building.' },
      { name: '1Password', url: 'https://1password.com', note: 'Password manager.' },
      {
        name: 'KeePassXC',
        url: 'https://keepassxc.org',
        note: 'The open-source password manager I used before 1Password. I recommend it if you would rather not pay for one.',
      },
      { name: 'Zen Browser', url: 'https://zen-browser.app/', note: 'Best browser ever.' },
      { name: 'Notion', url: 'https://www.notion.com/', note: 'Notes for all of my projects.' },
      { name: 'Obsidian', url: 'https://obsidian.md', note: 'To-do lists and notes.' },
      { name: 'Figma', url: 'https://www.figma.com', note: 'Interface design.' },
      { name: 'Grammarly', url: 'https://www.grammarly.com/', note: 'Writing assistant.' },
      { name: 'Espanso', url: 'https://espanso.org/', note: 'Text expander. It makes a keyboard more than just a keyboard.' },
      { name: 'Matrix and mautrix bridges', url: 'https://matrix.org/', note: 'Open, decentralized communication.' },
      { name: 'Beeper', url: 'https://www.beeper.com/', note: 'All chats in one app.' },
      { name: 'Mattermost', url: 'https://mattermost.com/', note: 'Team collaboration.' },
      { name: 'Rambox', url: 'https://rambox.app/', note: 'Workspace organizer.' },
      { name: 'DevKinsta', url: 'https://kinsta.com/devkinsta/', note: 'Local WordPress in Docker containers.' },
      { name: 'ShareX', url: 'https://getsharex.com', note: 'Screenshots and annotation on Windows.' },
      { name: 'Directory Opus', url: 'https://www.gpsoft.com.au/', note: 'A file manager that ends the limits of Windows Explorer.' },
      { name: 'PowerToys', url: 'https://github.com/microsoft/PowerToys', note: 'Extra tools for Windows.' },
      { name: 'Voicemeeter', url: 'https://voicemeeter.com/', note: 'Audio mixer, used for multiple audio outputs on Windows.' },
      { name: 'balenaEtcher', url: 'https://etcher.balena.io/', note: 'Writes OS images to SD cards and USB drives.' },
      { name: 'WebTorrent', url: 'https://webtorrent.io/', note: 'Streaming torrent client.' },
      { name: 'WireGuard, self-hosted', url: 'https://www.wireguard.com/', note: 'VPN.' },
      { name: '1.1.1.1', url: 'https://one.one.one.one/', note: 'Fast, private DNS and VPN.' },
      { name: 'Spotify', url: 'https://www.spotify.com', note: 'I love music.' },
    ],
  },
  {
    id: 'services',
    title: 'Services',
    items: [
      { name: 'Cloudflare', url: 'https://www.cloudflare.com', note: 'DNS for all of my domains, and where this site runs.' },
      { name: 'YBX Labs', url: 'https://ybxlabs.com/', note: 'My own company, for servers and AI infrastructure.' },
      { name: 'Amazon Web Services', url: 'https://aws.amazon.com/' },
      { name: 'Microsoft Azure and AI Studio', url: 'https://azure.microsoft.com/' },
      { name: 'Oracle Cloud', url: 'https://www.oracle.com/cloud/' },
      { name: 'OpenAI API', url: 'https://openai.com/api/' },
      { name: 'Firebase', url: 'https://firebase.google.com', note: 'Database and authentication for side projects.' },
      { name: 'Infisical', url: 'https://infisical.com', note: 'Open-source secrets manager.' },
      { name: 'Namecheap', url: 'https://www.namecheap.com/', note: 'Domain registrar.' },
    ],
  },
  {
    id: 'media',
    title: 'Recording, design and editing',
    items: [
      { name: 'OBS Studio', url: 'https://obsproject.com/', note: 'Recording and live streaming.' },
      { name: 'RustDesk', url: 'https://rustdesk.com/', note: 'Open-source remote desktop.' },
      { name: 'Filmora', url: 'https://filmora.wondershare.com/', note: 'Quick video editing.' },
      { name: 'Canva', url: 'https://www.canva.com/', note: 'Quick designs.' },
      { name: 'Adobe Creative Cloud', url: 'https://www.adobe.com/', note: 'Illustrator, After Effects, Premiere Pro and Photoshop.' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      { name: 'GMGN', url: 'https://gmgn.ai/' },
      { name: 'Binance', url: 'https://www.binance.com' },
      { name: 'pump.fun', url: 'https://pump.fun/' },
    ],
  },
];
