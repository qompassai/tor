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
