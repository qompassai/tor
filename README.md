<!---------------- /qompassai/tor/README.md -------------->
<!---------------------Qompass AI Tor -------------------->
<!-- Copyright (C) 2025 Qompass AI, All rights reserved -->
<!-- ----------------------------------------------------->

<h2> The Onion Router (aka "Tor") </h2>

<h3> Qompass AI on Tor </h3>

![Repository Views](https://komarev.com/ghpvc/?username=qompassai-tor)
![GitHub all releases](https://img.shields.io/github/downloads/qompassai/tor/total?style=flat-square)

<p align="center">
  <a href="https://www.torproject.org/">
  <img src="https://img.shields.io/badge/Tor-7E4798?style=for-the-badge&logo=torproject&logoColor=white" alt="Tor">
</a>
<br>
<a href="https://2019.www.torproject.org/docs/documentation.html.en">
  <img src="https://img.shields.io/badge/Tor_Documentation-blue?style=flat-square" alt="Tor Documentation">
</a>
<a href="https://github.com/topics/tor">
  <img src="https://img.shields.io/badge/Tor_Tutorials-green?style=flat-square" alt="Tor Tutorials">
</a>
<br>
  <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3"></a>
  <a href="./LICENSE-QCDA"><img src="https://img.shields.io/badge/license-Q--CDA-lightgrey.svg" alt="License: Q-CDA"></a>
</p>


<details>
  <summary style="font-size: 1.4em; font-weight: bold; padding: 15px; background: #667eea; color: white; border-radius: 10px; cursor: pointer; margin: 10px 0;">
    <strong>▶️ Qompass AI Quick Start</strong>
  </summary>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px; font-family: monospace;">

```sh  
curl -fsSL https://raw.githubusercontent.com/qompassai/tor/main/scripts/quickstart.sh | sh
```
  </div>
  <blockquote style="font-size: 1.2em; line-height: 1.8; padding: 25px; background: #f8f9fa; border-left: 6px solid #667eea; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <details>
      <summary style="font-size: 1em; font-weight: bold; padding: 10px; background: #e9ecef; color: #333; border-radius: 5px; cursor: pointer; margin: 10px 0;">
        <strong>📄 We advise you read the script BEFORE running it 😉</strong>
      </summary>
      <pre style="background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd; overflow-x: auto;">
#!/bin/sh
# /qompassai/tor/scripts/quickstart.sh
# Qompass AI · Tor Quick Start
# Copyright (C) 2025 Qompass AI, All rights reserved
#########################################################
set -eu
PREFIX="$HOME/.local"
BIN_DIR="$PREFIX/bin"
LIB_DIR="$PREFIX/lib"
SHARE_DIR="$PREFIX/share"
SRC_DIR="$PREFIX/src/tor"
OPT_DIR="$PREFIX/opt"
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
mkdir -p "$BIN_DIR" "$LIB_DIR" "$SHARE_DIR" "$SRC_DIR" "$OPT_DIR"
TOR_VERSION="0.4.8.11"
TORSOCKS_VERSION="2.4.0"
TOR_BROWSER_DEFAULT="13.0.14"
PY_CMD="${PYTHON:-python3}"
clear
printf '╭────────────────────────────────────────────╮\n'
printf '│     Qompass AI · Tor Quick‑Start Menu      │\n'
printf '╰────────────────────────────────────────────╯\n'
printf '      © 2025 Qompass AI. All rights reserved  \n\n'
echo "Which component would you like to install?"
echo " 1) tor (daemon, CLI relay/client)"
echo " 2) tor-browser (official privacy browser)"
echo " 3) nyx (Tor status/monitor UI)"
echo " 4) arti (Rust Tor client, next generation)"
echo " 5) torsocks (library for torifying)"
echo " a) All"
echo " q) Quit"
printf "Choose [a]: "
read -r choice
[ -z "$choice" ] && choice="a"
[ "$choice" = "q" ] && exit 0
COMPONENTS="tor tor-browser nyx arti torsocks"
select_component() {
        case "$1" in
        1) echo "tor" ;;
        2) echo "tor-browser" ;;
        3) echo "nyx" ;;
        4) echo "arti" ;;
        5) echo "torsocks" ;;
        a | A) echo "$COMPONENTS" ;;
        *)
                echo ""
                echo "Invalid option." >&2
                exit 1
                ;;
        esac
}
TO_INSTALL=$(select_component "$choice")
echo "You selected: $TO_INSTALL"
echo
install_tor() {
        echo "→ Installing tor ($TOR_VERSION)..."
        cd "$SRC_DIR"
        if [ ! -d "tor-$TOR_VERSION" ]; then
                curl -fsSL "https://dist.torproject.org/tor-$TOR_VERSION.tar.gz" | tar xz
        fi
        cd "tor-$TOR_VERSION"
        if [ ! -f "$BIN_DIR/tor" ]; then
                ./configure --prefix="$PREFIX" --with-libevent-dir="$PREFIX"
                make -j"$(nproc)"
                make install
        fi
        mkdir -p "$XDG_CONFIG_HOME/tor"
        cat >"$XDG_CONFIG_HOME/tor/torrc" <<EOF
DataDirectory=$HOME/.local/share/tor
ControlPort 9051
CookieAuthentication 1
EOF
        echo "✔ tor installed. Launch with: tor -f $XDG_CONFIG_HOME/tor/torrc"
        echo
}
install_tor_browser() {
        echo "→ Installing tor-browser (user-local)..."
        latest=$(curl -s https://www.torproject.org/dist/torbrowser/ | grep -Eo 'href="[0-9]+\.[0-9]+(\.[0-9]+)?/' | sort -V | tail -1 | cut -d'"' -f2 | tr -d '/')
        [ -z "$latest" ] && latest="$TOR_BROWSER_DEFAULT"
        TBDIR="$OPT_DIR/tor-browser"
        mkdir -p "$TBDIR"
        url="https://www.torproject.org/dist/torbrowser/${latest}/tor-browser-linux64-${latest}_en-US.tar.xz"
        curl -fsSL "$url" -o "$TBDIR/tor-browser.tar.xz"
        cd "$TBDIR"
        tar xf "./tor-browser.tar.xz"
        ln -sf "$(find "$TBDIR" -type f -name 'start-tor-browser')" "$BIN_DIR/tor-browser"
        rm -f "./tor-browser.tar.xz"
        cat >"$HOME/.local/share/applications/tor-browser.desktop" <<EOF
[Desktop Entry]
Name=Tor Browser
Exec=$BIN_DIR/tor-browser
Icon=$TBDIR/tor-browser_en-US/browser/chrome/icons/default/default128.png
Type=Application
Categories=Network;WebBrowser;Privacy;
EOF
        echo "✔ tor-browser installed and linked as: tor-browser"
        echo
}
install_nyx() {
        echo "→ Installing nyx (tor monitor, user-local pip)..."
        $PY_CMD -m pip install --user nyx
        mkdir -p "$XDG_CONFIG_HOME/nyx"
        cat >"$XDG_CONFIG_HOME/nyx/nyxrc" <<EOF
data_directory = $HOME/.local/share/nyx
color_override = blue
EOF
        echo "✔ nyx installed. Run with: nyx --config $XDG_CONFIG_HOME/nyx/nyxrc"
        echo
}
install_arti() {
        echo "→ Installing arti (Rust Tor Client)..."
        if ! command -v cargo >/dev/null; then
                echo "Rust/cargo not installed. Please install Rust (via https://rustup.rs/)."
                exit 1
        fi
        cargo install --locked --root "$PREFIX" arti
        mkdir -p "$XDG_CONFIG_HOME/arti"
        cat >"$XDG_CONFIG_HOME/arti/config.toml" <<EOF
[storage]
cache_dir = "$HOME/.cache/arti"
EOF
        echo "✔ arti installed. Use via: arti"
        echo
}
install_torsocks() {
        echo "→ Installing torsocks ($TORSOCKS_VERSION)..."
        cd "$SRC_DIR"
        if [ ! -d "torsocks-$TORSOCKS_VERSION" ]; then
                curl -fsSL "https://github.com/dgoulet/torsocks/releases/download/v$TORSOCKS_VERSION/torsocks-$TORSOCKS_VERSION.tar.gz" | tar xz
        fi
        cd "torsocks-$TORSOCKS_VERSION"
        if [ ! -f "$BIN_DIR/torsocks" ]; then
                ./configure --prefix="$PREFIX"
                make -j"$(nproc)"
                make install
        fi
        echo "✔ torsocks installed. Use via: torsocks <command>"
        echo
}
for item in $TO_INSTALL; do
        case "$item" in
        tor) install_tor ;;
        tor-browser) install_tor_browser ;;
        nyx) install_nyx ;;
        arti) install_arti ;;
        torsocks) install_torsocks ;;
        esac
done
case ":$PATH:" in *":$BIN_DIR:"*) ;; *)
        export PATH="$BIN_DIR:$PATH"
        echo "→ Added $BIN_DIR to your PATH for this session."
        ;;
esac
echo
echo "✓ All selected Tor tools are installed user-locally:"
echo "  Binaries:    $BIN_DIR"
echo "  Configs:     $XDG_CONFIG_HOME/{tor,nyx,arti}"
echo "  Browser:     $OPT_DIR/tor-browser"
echo "  Desktop:     $HOME/.local/share/applications/tor-browser.desktop"
echo "  To uninstall: rm -rf $PREFIX/{bin,lib,share,opt} $SRC_DIR $HOME/.cache/arti $XDG_CONFIG_HOME/{tor,nyx,arti}"
echo "─ Ready for Tor Networking! ─"
exit 0
</pre>
    </details>
    <p>Or, <a href="https://github.com/qompassai/tor/blob/main/scripts/quickstart.sh" target="_blank">View the quickstart script</a>.</p>
  </blockquote>
</details>

</blockquote>
</details>

<details>
<summary style="font-size: 1.4em; font-weight: bold; padding: 15px; background: #667eea; color: white; border-radius: 10px; cursor: pointer; margin: 10px 0;"><strong>🧭 About Qompass AI</strong></summary>
<blockquote style="font-size: 1.2em; line-height: 1.8; padding: 25px; background: #f8f9fa; border-left: 6px solid #667eea; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

<div align="center">
  <p>Matthew A. Porter<br>
  Former Intelligence Officer<br>
  Educator & Learner<br>
  DeepTech Founder & CEO</p>
</div>

<h3>Publications</h3>
  <p>
    <a href="https://orcid.org/0000-0002-0302-4812">
      <img src="https://img.shields.io/badge/ORCID-0000--0002--0302--4812-green?style=flat-square&logo=orcid" alt="ORCID">
    </a>
    <a href="https://www.researchgate.net/profile/Matt-Porter-7">
      <img src="https://img.shields.io/badge/ResearchGate-Open--Research-blue?style=flat-square&logo=researchgate" alt="ResearchGate">
    </a>
    <a href="https://zenodo.org/communities/qompassai">
      <img src="https://img.shields.io/badge/Zenodo-Publications-blue?style=flat-square&logo=zenodo" alt="Zenodo">
    </a>
  </p>

<h3>Developer Programs</h3>

[![NVIDIA Developer](https://img.shields.io/badge/NVIDIA-Developer_Program-76B900?style=for-the-badge\&logo=nvidia\&logoColor=white)](https://developer.nvidia.com/)
[![Meta Developer](https://img.shields.io/badge/Meta-Developer_Program-0668E1?style=for-the-badge\&logo=meta\&logoColor=white)](https://developers.facebook.com/)
[![HackerOne](https://img.shields.io/badge/-HackerOne-%23494649?style=for-the-badge\&logo=hackerone\&logoColor=white)](https://hackerone.com/phaedrusflow)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-qompass-yellow?style=flat-square\&logo=huggingface)](https://huggingface.co/qompass)
[![Epic Games Developer](https://img.shields.io/badge/Epic_Games-Developer_Program-313131?style=for-the-badge\&logo=epic-games\&logoColor=white)](https://dev.epicgames.com/)
<h3>Professional Profiles</h3>
  <p>
    <a href="https://www.linkedin.com/in/matt-a-porter-103535224/">
      <img src="https://img.shields.io/badge/LinkedIn-Matt--Porter-blue?style=flat-square&logo=linkedin" alt="Personal LinkedIn">
    </a>
    <a href="https://www.linkedin.com/company/95058568/">
      <img src="https://img.shields.io/badge/LinkedIn-Qompass--AI-blue?style=flat-square&logo=linkedin" alt="Startup LinkedIn">
    </a>
  </p>

<h3>Social Media</h3>
  <p>
    <a href="https://twitter.com/PhaedrusFlow">
      <img src="https://img.shields.io/badge/Twitter-@PhaedrusFlow-blue?style=flat-square&logo=twitter" alt="X/Twitter">
    </a>
    <a href="https://www.instagram.com/phaedrusflow">
      <img src="https://img.shields.io/badge/Instagram-phaedrusflow-purple?style=flat-square&logo=instagram" alt="Instagram">
    </a>
    <a href="https://www.youtube.com/@qompassai">
      <img src="https://img.shields.io/badge/YouTube-QompassAI-red?style=flat-square&logo=youtube" alt="Qompass AI YouTube">
    </a>
  </p>

</blockquote>
</details>

<details>
<summary style="font-size: 1.4em; font-weight: bold; padding: 15px; background: #ff6b6b; color: white; border-radius: 10px; cursor: pointer; margin: 10px 0;"><strong>🔥 How Do I Support</strong></summary>
<blockquote style="font-size: 1.2em; line-height: 1.8; padding: 25px; background: #fff5f5; border-left: 6px solid #ff6b6b; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

<div align="center">

<table>
<tr>
<th align="center">🏛️ Qompass AI Pre-Seed Funding 2023-2025</th>
<th align="center">🏆 Amount</th>
<th align="center">📅 Date</th>
</tr>
<tr>
<td><a href="https://github.com/qompassai/r4r" title="RJOS/Zimmer Biomet Research Grant Repository">RJOS/Zimmer Biomet Research Grant</a></td>
<td align="center">$30,000</td>
<td align="center">March 2024</td>
</tr>
<tr>
<td><a href="https://github.com/qompassai/PathFinders" title="GitHub Repository">Pathfinders Intern Program</a><br>
<small><a href="https://www.linkedin.com/posts/evergreenbio_bioscience-internships-workforcedevelopment-activity-7253166461416812544-uWUM/" target="_blank">View on LinkedIn</a></small></td>
<td align="center">$2,000</td>
<td align="center">October 2024</td>
</tr>
</table>

<br>
<h4>🤝 How To Support Our Mission</h4>

[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsor-EA4AAA?style=for-the-badge\&logo=github-sponsors\&logoColor=white)](https://github.com/sponsors/phaedrusflow)
[![Patreon](https://img.shields.io/badge/Patreon-Support-F96854?style=for-the-badge\&logo=patreon\&logoColor=white)](https://patreon.com/qompassai)
[![Liberapay](https://img.shields.io/badge/Liberapay-Donate-F6C915?style=for-the-badge\&logo=liberapay\&logoColor=black)](https://liberapay.com/qompassai)
[![Open Collective](https://img.shields.io/badge/Open%20Collective-Support-7FADF2?style=for-the-badge\&logo=opencollective\&logoColor=white)](https://opencollective.com/qompassai)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFDD00?style=for-the-badge\&logo=buy-me-a-coffee\&logoColor=black)](https://www.buymeacoffee.com/phaedrusflow)

<details markdown="1">
<summary><strong>🔐 Cryptocurrency Donations</strong></summary>

**Monero (XMR):**

<div align="center">
    <img src="https://raw.githubusercontent.com/qompassai/svg/main/assets/monero-qr.svg" alt="Monero QR Code" width="180">
</div>

<div style="margin: 10px 0;">
    <code>42HGspSFJQ4MjM5ZusAiKZj9JZWhfNgVraKb1eGCsHoC6QJqpo2ERCBZDhhKfByVjECernQ6KeZwFcnq8hVwTTnD8v4PzyH</code>
  </div>

<button onclick="navigator.clipboard.writeText('42HGspSFJQ4MjM5ZusAiKZj9JZWhfNgVraKb1eGCsHoC6QJqpo2ERCBZDhhKfByVjECernQ6KeZwFcnq8hVwTTnD8v4PzyH')" style="padding: 6px 12px; background: #FF6600; color: white; border: none; border-radius: 4px; cursor: pointer;">
    📋 Copy Address
  </button>
<p><i>Funding helps us continue our research at the intersection of AI, healthcare, and education</i></p>

</blockquote>
</details>
</details>

<details id="FAQ">
  <summary><strong>Frequently Asked Questions</strong></summary>

### Q: How do you mitigate against bias?

**TLDR - we do math to make AI ethically useful**

### A: We delineate between mathematical bias (MB) - a fundamental parameter in neural network equations - and algorithmic/social bias (ASB). While MB is optimized during model training through backpropagation, ASB requires careful consideration of data sources, model architecture, and deployment strategies. We implement attention mechanisms for improved input processing and use legal open-source data and secure web-search APIs to help mitigate ASB.

[AAMC AI Guidelines | One way to align AI against ASB](https://www.aamc.org/about-us/mission-areas/medical-education/principles-ai-use)

### AI Math at a glance

## Forward Propagation Algorithm

$$
y = w_1x_1 + w_2x_2 + ... + w_nx_n + b
$$

Where:

- $y$ represents the model output
- $(x_1, x_2, ..., x_n)$ are input features
- $(w_1, w_2, ..., w_n)$ are feature weights
- $b$ is the bias term

### Neural Network Activation

For neural networks, the bias term is incorporated before activation:

$$
z = \sum_{i=1}^{n} w_ix_i + b
$$
$$
a = \sigma(z)
$$

Where:

- $z$ is the weighted sum plus bias
- $a$ is the activation output
- $\sigma$ is the activation function

### Attention Mechanism- aka what makes the Transformer (The "T" in ChatGPT) powerful

- [Attention High level overview video](https://www.youtube.com/watch?v=fjJOgb-E41w)

- [Attention Is All You Need Arxiv Paper](https://arxiv.org/abs/1706.03762)

The Attention mechanism equation is:

$$
\text{Attention}(Q, K, V) = \text{softmax}\\left( \\frac{QK^T}{\\sqrt{d_k}} \\right) V
$$

Where:

- $Q$ represents the Query matrix
- $K$ represents the Key matrix
- $V$ represents the Value matrix
- $d_k$ is the dimension of the key vectors
- $\text{softmax}(\cdot)$ normalizes scores to sum to 1

### Q: Do I have to buy a Linux computer to use this? I don't have time for that!

### A: No. You can run Linux and/or the tools we share alongside your existing operating system:

- Windows users can use Windows Subsystem for Linux [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- Mac users can use [Homebrew](https://brew.sh/)
- The code-base instructions were developed with both beginners and advanced users in mind.

### Q: Do you have to get a masters in AI?

### A: Not if you don't want to. To get competent enough to get past ChatGPT dependence at least, you just need a computer and a beginning's mindset. Huggingface is a good place to start.

- [Huggingface](https://docs.google.com/presentation/d/1IkzESdOwdmwvPxIELYJi8--K3EZ98_cL6c5ZcLKSyVg/edit#slide=id.p)

### Q: What makes a "small" AI model?

### A: AI models ~=10 billion(10B) parameters and below. For comparison, OpenAI's GPT4o contains approximately 200B parameters.

</details>

<details id="Dual-License Notice">
  <summary><strong>What a Dual-License Means</strong></summary>

### Protection for Vulnerable Populations

The dual licensing aims to address the cybersecurity gap that disproportionately affects underserved populations. As highlighted by recent attacks<sup><a href="#ref1">[1]</a></sup>, low-income residents, seniors, and foreign language speakers face higher-than-average risks of being victims of cyberattacks. By offering both open-source and commercial licensing options, we encourage the development of cybersecurity solutions that can reach these vulnerable groups while also enabling sustainable development and support.

### Preventing Malicious Use

The AGPL-3.0 license ensures that any modifications to the software remain open source, preventing bad actors from creating closed-source variants that could be used for exploitation. This is especially crucial given the rising threats to vulnerable communities, including children in educational settings. The attack on Minneapolis Public Schools, which resulted in the leak of 300,000 files and a $1 million ransom demand, highlights the importance of transparency and security<sup><a href="#ref8">[8]</a></sup>.

### Addressing Cybersecurity in Critical Sectors

The commercial license option allows for tailored solutions in critical sectors such as healthcare, which has seen significant impacts from cyberattacks. For example, the recent Change Healthcare attack<sup><a href="#ref4">[4]</a></sup> affected millions of Americans and caused widespread disruption for hospitals and other providers. In January 2025, CISA<sup><a href="#ref2">[2]</a></sup> and FDA<sup><a href="#ref3">[3]</a></sup> jointly warned of critical backdoor vulnerabilities in Contec CMS8000 patient monitors, revealing how medical devices could be compromised for unauthorized remote access and patient data manipulation.

### Supporting Cybersecurity Awareness

The dual licensing model supports initiatives like the Cybersecurity and Infrastructure Security Agency (CISA) efforts to improve cybersecurity awareness<sup><a href="#ref7">[7]</a></sup> in "target rich" sectors, including K-12 education<sup><a href="#ref5">[5]</a></sup>. By allowing both open-source and commercial use, we aim to facilitate the development of tools that support these critical awareness and protection efforts.

### Bridging the Digital Divide

The unfortunate reality is that too many individuals and organizations have gone into a frenzy in every facet of our daily lives<sup><a href="#ref6">[6]</a></sup>. These unfortunate folks identify themselves with their talk of "10X" returns and building towards Artificial General Intelligence aka "AGI" while offering GPT wrappers. Our dual licensing approach aims to acknowledge this deeply concerning predatory paradigm with clear eyes while still operating to bring the best parts of the open-source community with our services and solutions.

### Recent Cybersecurity Attacks

Recent attacks underscore the importance of robust cybersecurity measures:

- The Change Healthcare cyberattack in February 2024 affected millions of Americans and caused significant disruption to healthcare providers.
- The White House and Congress jointly designated October 2024 as Cybersecurity Awareness Month. This designation comes with over 100 actions that align the Federal government and public/private sector partners are taking to help every man, woman, and child to safely navigate the age of AI.

By offering both open source and commercial licensing options, we strive to create a balance that promotes innovation and accessibility. We address the complex cybersecurity challenges faced by vulnerable populations and critical infrastructure sectors as the foundation of our solutions, not an afterthought.

### References

<div id="footnotes">
<p id="ref1"><strong>[1]</strong> <a href="https://www.whitehouse.gov/briefing-room/statements-releases/2024/10/02/international-counter-ransomware-initiative-2024-joint-statement/">International Counter Ransomware Initiative 2024 Joint Statement</a></p>

<p id="ref2"><strong>[2]</strong> <a href="https://www.cisa.gov/sites/default/files/2025-01/fact-sheet-contec-cms8000-contains-a-backdoor-508c.pdf">Contec CMS8000 Contains a Backdoor</a></p>

<p id="ref3"><strong>[3]</strong> <a href="https://www.aha.org/news/headline/2025-01-31-cisa-fda-warn-vulnerabilities-contec-patient-monitors">CISA, FDA warn of vulnerabilities in Contec patient monitors</a></p>

<p id="ref4"><strong>[4]</strong> <a href="https://www.chiefhealthcareexecutive.com/view/the-top-10-health-data-breaches-of-the-first-half-of-2024">The Top 10 Health Data Breaches of the First Half of 2024</a></p>

<p id="ref5"><strong>[5]</strong> <a href="https://www.cisa.gov/K12Cybersecurity">CISA's K-12 Cybersecurity Initiatives</a></p>

<p id="ref6"><strong>[6]</strong> <a href="https://www.ftc.gov/business-guidance/blog/2024/09/operation-ai-comply-continuing-crackdown-overpromises-ai-related-lies">Federal Trade Commission Operation AI Comply: continuing the crackdown on overpromises and AI-related lies</a></p>

<p id="ref7"><strong>[7]</strong> <a href="https://www.whitehouse.gov/briefing-room/presidential-actions/2024/09/30/a-proclamation-on-cybersecurity-awareness-month-2024/">A Proclamation on Cybersecurity Awareness Month, 2024</a></p>

<p id="ref8"><strong>[8]</strong> <a href="https://therecord.media/minneapolis-schools-say-data-breach-affected-100000/">Minneapolis school district says data breach affected more than 100,000 people</a></p>
</div>
</details>
