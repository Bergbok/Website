> Built with Cloudflare[^cf], Vite & Vue, among other things.

[^cf]: [Workers](https://cloudflare.com/products/workers) + [D1](https://cloudflare.com/products/d1) + [Durable Objects](https://cloudflare.com/products/durable-objects) + [KV](https://cloudflare.com/products/kv) + [R2](https://cloudflare.com/products/r2/) + [Rate Limits](https://cloudflare.com/products/rate-limiting) + [Static Assets](https://developers.cloudflare.com/workers/static-assets) + [Tunnels](https://cloudflare.com/products/tunnel) + [TURN](https://www.cloudflare.com/products/turn-sfu) + [Turnstile](https://cloudflare.com/products/turnstile) + [VPC](https://developers.cloudflare.com/workers-vpc)

### Features

- [3D Pipes](https://github.com/1j01/pipes)
- [Animal Crossing](https://github.com/turtlekiosk/slider)
- [Arch Linux 32](https://archlinux32.org)
- [Arx Fatalis](https://github.com/gabrielcuvillier/arxwasm)
- [AudiOrbits](https://github.com/hexxone/audiorbits)
- [BassoonTracker](https://github.com/steffest/BassoonTracker)
- [Celeste](https://github.com/MercuryWorkshop/celeste-wasm)
- [Club Penguin](https://github.com/solero/wand)
- [CS 1.6/HLDM](https://github.com/yohimik/webxash3d-fwgs)
- [Diablo](https://github.com/d07RiV/diabloweb)
- [DOOM 3](https://github.com/gabrielcuvillier/d3wasm)
- [DOOM](https://github.com/GMH-Code/Dwasm)
- [eightyeightthirtyone](https://github.com/NotNite/eightyeightthirtyone)
- [Fingal](https://youtube.com/watch?v=R8mdGbjYPq0)
- [Fluid Paint](https://github.com/dli/paint)
- [Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)
- [Geometry Dash](https://github.com/web-dashers/web-dashers.github.io)
- [Godot](https://editor.godotengine.org)
- [gpu-io](https://github.com/amandaghassaei/gpu-io)
- [Hollow Knight](https://github.com/HorizonOfficia/hollow-knight)
- [Hydra](https://hydra.ojack.xyz/docs)
- [JSPaint](https://github.com/1j01/jspaint)
- [KolibriOS](https://kolibrios.org)
- [Lain](https://github.com/laingame-net/lainTSX)
- [LEGO Island](https://github.com/isledecomp/isle.pizza)
- [Linux](https://github.com/joelseverin/linux-wasm)
- [Marble Blast](https://github.com/RandomityGuy/MBHaxe)
- [Markov Namegen ](https://github.com/Tw1ddle/MarkovNameGenerator)
- [Minecraft](https://classic.minecraft.net)
- [noclip](https://github.com/magcius/noclip.website)
- [OMORI](https://github.com/genizy/web-port/tree/main/omori-fixed)
- [OsakaOS](https://github.com/pac-ac/osakaOS)
- [Pixel Icons by Hackernoon](https://pixeliconlibrary.com)
- [Plants vs. Zombies](https://github.com/Bamcane/re-plants-vs-zombies)
- [Quake 2](https://github.com/GMH-Code/Qwasm2)
- [Quake 3](https://github.com/lrusso/Quake3)
- [Quake](https://github.com/GMH-Code/Qwasm)
- [RollerCoaster Tycoon 2](https://github.com/OpenRCT2/OpenRCT2)
- [saharan's oimo works](https://github.com/saharan/works)
- [Scribble](https://github.com/scribble-rs/scribble.rs)
- [SGI Demos](https://github.com/sgi-demos/sgi-demos)
- [SpaceCadetPinball](https://github.com/alula/SpaceCadetPinball)
- [Star Trek: Voyager - Elite Force: Holomatch](https://github.com/Chomenor/ioef-cmod)
- [StillAliveOS](https://github.com/maniekx86/stillalive-os)
- [Terraria](https://github.com/MercuryWorkshop/terraria-wasm)
- [The Old Timey Computer Show](https://github.com/TheOpponent/mr-otcs)
- [The Powder Toy](https://github.com/The-Powder-Toy/The-Powder-Toy)
- [Transport Tycoon](https://github.com/OpenTTD/OpenTTD)
- [ULTRAKILL Prelude](https://hakita.itch.io/ultrakill-prelude)
- [Untrusted](https://github.com/AlexNisnevich/untrusted)
- [WebMonkeyBall](https://github.com/sndrec/WebMonkeyBall)
- [Windows XP](frutigeraeroarchive.org/wallpapers/windows_xp#windowsXP)
- [Windows 7](https://frutigeraeroarchive.org/wallpapers/windows_7#windows7)
- [Windows 93](https://windows93.net)
- [Windows 98](https://en.wikipedia.org/wiki/Windows_98)
- [wipEout](https://github.com/phoboslab/wipeout-rewrite)

and [more](https://github.com/Bergbok/Computer/network/dependencies)!

### Running Locally

```bash
# requires bun, docker, dotnet, emscripten, jq, haxe, node, mono, rustup, uv & yq :)
git clone --recurse-submodules https://github.com/Bergbok/Computer.git && cd Computer
bun install
bun typegen
???
bun wrangler kv key put about --path src/assets/about/example.json --binding KV
bun wrangler d1 execute computer --file src/server/schema.sql
bun run build
bun dev
```

<p align='center'>
	( ͡° ͜ʖ ͡°)
</p>
