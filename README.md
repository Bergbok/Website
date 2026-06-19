( ͡° ͜ʖ ͡°)

### Features

- [3D Pipes](https://github.com/1j01/pipes)
- [Animal Crossing](https://github.com/turtlekiosk/slider)
- [Arch Linux 32](https://archlinux32.org)
- [BassoonTracker](https://github.com/steffest/BassoonTracker)
- [Club Penguin](https://github.com/solero/wand)
- [Diablo](https://github.com/d07RiV/diabloweb)
- [eightyeightthirtyone](https://github.com/NotNite/eightyeightthirtyone)
- [Fingal](https://youtube.com/watch?v=R8mdGbjYPq0)
- [Fluid Paint](https://github.com/dli/paint)
- [Godot](https://editor.godotengine.org)
- [Hollow Knight](https://github.com/HorizonOfficia/hollow-knight)
- [JSPaint](https://github.com/1j01/jspaint)
- [KolibriOS](https://kolibrios.org)
- [Lain](https://github.com/laingame-net/lainTSX)
- [LEGO Island](https://github.com/isledecomp/isle.pizza)
- [Minecraft](https://classic.minecraft.net)
- [noclip](https://github.com/magcius/noclip.website)
- [OMORI](https://github.com/genizy/web-port/tree/main/omori-fixed)
- [OsakaOS](https://github.com/pac-ac/osakaOS)
- [OTCS](https://github.com/TheOpponent/mr-otcs)
- [Pixel Icons by Hackernoon](https://pixeliconlibrary.com)
- [Plants vs. Zombies](https://github.com/Bamcane/re-plants-vs-zombies)
- [RollerCoaster Tycoon 2](https://github.com/OpenRCT2/OpenRCT2)
- [saharan's oimo works](https://github.com/saharan/works)
- [Scribble](https://github.com/scribble-rs/scribble.rs)
- [SGI Demos](https://github.com/sgi-demos/sgi-demos)
- [SpaceCadetPinball](https://github.com/alula/SpaceCadetPinball)
- [StillAliveOS](https://github.com/maniekx86/stillalive-os)
- [Terraria](https://github.com/MercuryWorkshop/terraria-wasm)
- [The Powder Toy](https://github.com/The-Powder-Toy/The-Powder-Toy)
- [Transport Tycoon](https://github.com/OpenTTD/OpenTTD)
- [ULTRAKILL Prelude](https://hakita.itch.io/ultrakill-prelude)
- [Webleste](https://github.com/MercuryWorkshop/celeste-wasm)
- [WebMonkeyBall](https://github.com/sndrec/WebMonkeyBall)
- [Windows 7](https://frutigeraeroarchive.org/wallpapers/windows_7#windows7)
- [Windows 93](https://windows93.net)
- [Windows 98](https://en.wikipedia.org/wiki/Windows_98)
- [Windows XP](frutigeraeroarchive.org/wallpapers/windows_xp#windowsXP)
- [wipEout](https://github.com/phoboslab/wipeout-rewrite)

and [more](https://github.com/Bergbok/Website/network/dependencies)!

### Running Locally

```bash
# requires bun, docker, dotnet, emscripten, haxe, node, mono, rust & uv :)
git clone --recurse-submodules https://github.com/Bergbok/Website.git && cd Website
bun install
bun typegen
???
bun wrangler d1 execute computer --file src/server/schema.sql
bun run build
bun dev
```

<!--
https://zhead.dev
https://websocket.org/reference/close-codes/
-->
