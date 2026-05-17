### Running Locally

```bash
git clone https://github.com/Bergbok/Website.git --recurse-submodules
cd Website
rustup target add wasm32-unknown-unknown
cd src/lib/noclip/rust
cargo install cargo-run-bin
cargo bin --install
cd -
bun install
bun typegen
bun dev
```

<div align='center'>
	<picture>
		<img width="960" src="https://i.imgur.com/Z3svaBS.png" />
	</picture>
</div>
